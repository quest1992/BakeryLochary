import type {Prisma} from "@prisma/client";

export class ProductionEditError extends Error {}

export const productionUseNote = (batchId: number) => `Партия №${batchId} · `;
export const productionDefectNote = (batchId: number) => `Брак при производстве · партия №${batchId}`;

export async function editProduction(
  tx: Prisma.TransactionClient,
  id: number,
  quantity: number,
  note: string,
  originalQuantity: number,
  originalNote: string,
) {
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) {
    throw new ProductionEditError("Укажите целое количество больше нуля");
  }
  const batch = await tx.productionBatch.findUnique({where:{id}, include:{product:{include:{stock:true}}}});
  if (!batch || batch.quantity !== originalQuantity || (batch.note ?? "") !== originalNote) {
    throw new ProductionEditError("Партия уже изменена. Обновите журнал");
  }

  if (quantity !== batch.quantity) {
    let usage = await tx.ingredientMovement.findMany({
      where:{type:"PRODUCTION_USE", note:{startsWith:productionUseNote(id)}}, orderBy:{id:"asc"},
    });
    let defects = await tx.productMovement.findMany({
      where:{productId:batch.productId, type:"WRITE_OFF", note:productionDefectNote(id)},
    });
    const linked = usage.length > 0;
    if (!linked) {
      const from = new Date(+batch.producedAt - 2000);
      const to = new Date(+batch.producedAt + 2000);
      const nearby = await tx.productionBatch.count({
        where:{id:{not:id}, productId:batch.productId, producedAt:{gte:from, lte:to}},
      });
      if (nearby) throw new ProductionEditError("Рядом есть другая партия. Нельзя однозначно определить списание сырья");
      usage = await tx.ingredientMovement.findMany({
        where:{type:"PRODUCTION_USE", note:"Партия " + batch.product.name, createdAt:{gte:from, lte:batch.producedAt}},
        orderBy:{id:"asc"},
      });
      defects = await tx.productMovement.findMany({
        where:{productId:batch.productId, userId:batch.userId, type:"WRITE_OFF", note:"Брак при производстве",
          createdAt:{gte:batch.producedAt, lte:to}},
      });
    }
    const ambiguous = !usage.length || new Set(usage.map(row => row.ingredientId)).size !== usage.length
      || usage.some((row, index) => row.quantity >= 0 || (!linked && index > 0 && row.id !== usage[index - 1].id + 1));
    if (ambiguous || defects.length > 1 || defects.some(row => row.quantity >= 0 || -row.quantity > batch.quantity)) {
      throw new ProductionEditError("Не удалось однозначно связать партию со списанием. Количество не изменено");
    }
    if (defects.length && quantity < -defects[0].quantity) {
      throw new ProductionEditError("Количество не может быть меньше уже записанного брака");
    }
    const delta = quantity - batch.quantity;
    const stock = batch.product.stock;
    if (!stock || stock.quantity + delta < 0) {
      throw new ProductionEditError("На складе недостаточно готовой продукции для уменьшения партии");
    }
    await tx.productStock.update({where:{id:stock.id}, data:{quantity:{increment:delta}}});
    for (const row of usage) {
      const updated = row.quantity * (quantity / batch.quantity);
      await tx.ingredient.update({where:{id:row.ingredientId}, data:{stock:{increment:updated - row.quantity}}});
      await tx.ingredientMovement.update({
        where:{id:row.id},
        data:{quantity:updated, note:productionUseNote(id) + batch.product.name},
      });
    }
    if (!linked && defects.length) {
      await tx.productMovement.update({where:{id:defects[0].id}, data:{note:productionDefectNote(id)}});
    }
  }
  await tx.productionBatch.update({where:{id}, data:{quantity, note}});
}

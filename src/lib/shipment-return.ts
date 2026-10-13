import type { Prisma } from "@prisma/client";

export async function saveShipmentReturn(tx: Prisma.TransactionClient, input: {shipmentId:number;productId:number;quantity:number;userId:number;note:string}) {
  const {shipmentId, productId, quantity, userId, note}=input;
  if (![shipmentId,productId,quantity].every(v=>Number.isSafeInteger(v)&&v>0)) throw new Error("Введите целое положительное количество и корректную накладную");
  const shipment=await tx.shipment.findUnique({where:{id:shipmentId},include:{items:true}});
  if (!shipment || shipment.status!=="DELIVERED") throw new Error("Возврат доступен только для доставленной накладной");
  const lines=shipment.items.filter(i=>i.productId===productId);
  if (lines.length!==1) throw new Error("Позиция не найдена или неоднозначна в накладной");
  const line=lines[0];
  const returned=await tx.productMovement.aggregate({where:{shipmentId,productId,type:"RETURN"},_sum:{quantity:true}});
  if ((returned._sum.quantity||0)+quantity>line.quantity) throw new Error("Возврат больше отгруженного количества");
  await tx.productStock.upsert({where:{productId},create:{productId,quantity},update:{quantity:{increment:quantity}}});
  // Customer is resolved through the original shipment; use its historical price.
  await tx.productMovement.create({data:{shipmentId,productId,quantity,userId,note,type:"RETURN"}});
  await tx.shipment.update({where:{id:shipmentId},data:{total:Math.round((shipment.total-line.price*quantity)*100)/100}});
}

import type {Prisma} from '@prisma/client';
export type EditedLine={productId:number;quantity:number;price:number};
export function shipmentRevision(total:number,items:EditedLine[]){return JSON.stringify({total,items:items.map(i=>({productId:i.productId,quantity:i.quantity,price:i.price})).sort((a,b)=>a.productId-b.productId)});}
export async function editShipment(tx:Prisma.TransactionClient,id:number,userId:number,items:EditedLine[],revision:string){
 if(!Number.isSafeInteger(id)||id<1||!items.length||items.some(i=>!Number.isSafeInteger(i.productId)||i.productId<1||!Number.isSafeInteger(i.quantity)||i.quantity<0||!Number.isFinite(i.price)||i.price<0)||new Set(items.map(i=>i.productId)).size!==items.length)throw Error('Проверьте изделия, количество и цену');
 const s=await tx.shipment.findUniqueOrThrow({where:{id},include:{items:true}});
 if(s.status!=='DELIVERED')throw Error('Можно редактировать только отгруженную накладную');
 if(shipmentRevision(s.total,s.items)!==revision)throw Error('Накладная уже изменена. Обновите страницу');
 const returns=await tx.productMovement.findMany({where:{shipmentId:id,type:'RETURN'}});
 let total=0;
 const ids=new Set([...s.items.map(i=>i.productId),...items.map(i=>i.productId)]);
 for(const productId of ids){
 const old=s.items.filter(i=>i.productId===productId);if(old.length>1)throw Error('Повторяющиеся изделия в накладной требуют отдельной проверки');
 const before=old[0],after=items.find(i=>i.productId===productId),qty=after?.quantity||0;
 const returned=returns.filter(r=>r.productId===productId).reduce((sum,r)=>sum+r.quantity,0);
 if(qty<returned)throw Error('Количество не может быть меньше уже возвращённого');
 if(returned&&after?.price!==before?.price)throw Error('Цена изделия с возвратами не меняется, чтобы сохранить сумму возврата');
 const delta=qty-(before?.quantity||0);
 const product=await tx.product.findUniqueOrThrow({where:{id:productId},include:{stock:true}});
 if(!before&&!product.active)throw Error('Изделие в архиве');
 if(delta>0&&(product.stock?.quantity||0)<delta)throw Error('Недостаточно на складе: '+product.name);
 if(delta){await tx.productStock.upsert({where:{productId},create:{productId,quantity:-delta},update:{quantity:{decrement:delta}}});await tx.productMovement.create({data:{productId,shipmentId:id,userId,type:'SHIPMENT_EDIT',quantity:-delta,note:'Редактирование отгрузки №'+id}});}
 if(qty&&after){total+=(qty-returned)*after.price;if(before)await tx.shipmentItem.update({where:{id:before.id},data:{quantity:qty,price:after.price}});else await tx.shipmentItem.create({data:{shipmentId:id,productId,quantity:qty,price:after.price,costPrice:product.costPrice}});}
 else if(before)await tx.shipmentItem.delete({where:{id:before.id}});
 }
 if(!Number.isFinite(total))throw Error('Сумма накладной слишком большая');
 if(!items.some(i=>i.quantity>0))throw Error('Оставьте хотя бы одно изделие');
 const oldGross=s.items.reduce((sum,i)=>sum+i.quantity*i.price,0),newGross=items.reduce((sum,i)=>sum+i.quantity*i.price,0);
 await tx.customer.update({where:{id:s.customerId},data:{bonusPoints:{increment:Math.floor(newGross/10)-Math.floor(oldGross/10)}}});
 await tx.shipment.update({where:{id},data:{total:Math.round(total*100)/100}});
}

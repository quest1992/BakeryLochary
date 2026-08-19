import {PrismaClient,Role,Unit,ShipmentStatus,PaymentMethod} from "@prisma/client";
import{hash}from"bcryptjs";const db=new PrismaClient();
async function main(){
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma delegates share deleteMany but have different generated types.
for(const m of [db.purchaseItem,db.purchase,db.supplier,db.shipmentItem,db.payment,db.shipment,db.productionBatch,db.ingredientMovement,db.recipeItem,db.productStock,db.expense,db.customer,db.product,db.ingredient,db.user])await (m as any).deleteMany();
const owner=await db.user.create({data:{name:"Усмон",username:"owner",passwordHash:await hash("lochari2026",10),role:Role.OWNER}});
await db.user.createMany({data:[{name:"Супруга",username:"wife",passwordHash:await hash("worker123",10),role:Role.WORKER},{name:"Сотрудница",username:"worker",passwordHash:await hash("worker123",10),role:Role.WORKER},{name:"Инвестор",username:process.env.INVESTOR_USERNAME||"investor",passwordHash:await hash(process.env.INVESTOR_PASSWORD||"investor2026",10),role:Role.INVESTOR}]});await db.supplier.createMany({data:[{name:"Оптовый склад Саховат",phone:"+992 900 22 33 44",address:"рынок Саховат",note:"Мука и сахар"},{name:"Фермерское хозяйство Баракат",phone:"+992 918 55 66 77",address:"Гиссар",note:"Яйца и масло"}]});
const flour=await db.ingredient.create({data:{name:"Мука высший сорт",unit:Unit.KG,stock:85,minStock:20,purchasePrice:6.5}});
const sugar=await db.ingredient.create({data:{name:"Сахар",unit:Unit.KG,stock:18,minStock:5,purchasePrice:12}});
const yeast=await db.ingredient.create({data:{name:"Дрожжи",unit:Unit.G,stock:2400,minStock:500,purchasePrice:.04}});
const oil=await db.ingredient.create({data:{name:"Масло растительное",unit:Unit.L,stock:9,minStock:3,purchasePrice:18}});
const eggs=await db.ingredient.create({data:{name:"Яйца",unit:Unit.PCS,stock:120,minStock:30,purchasePrice:1.2}});
const p1=await db.product.create({data:{name:"Нон Лочари",sku:"NON-01",price:8,costPrice:3.4,stock:{create:{quantity:46}}}});
const p2=await db.product.create({data:{name:"Булочка с сахаром",sku:"BUL-01",price:5,costPrice:2.1,stock:{create:{quantity:32}}}});
const p3=await db.product.create({data:{name:"Лепёшка семейная",sku:"LEP-01",price:12,costPrice:5.2,stock:{create:{quantity:18}}}});
await db.recipeItem.createMany({data:[{productId:p1.id,ingredientId:flour.id,quantity:.42},{productId:p1.id,ingredientId:yeast.id,quantity:6},{productId:p1.id,ingredientId:oil.id,quantity:.012},{productId:p2.id,ingredientId:flour.id,quantity:.12},{productId:p2.id,ingredientId:sugar.id,quantity:.025},{productId:p2.id,ingredientId:yeast.id,quantity:2},{productId:p2.id,ingredientId:eggs.id,quantity:.1},{productId:p3.id,ingredientId:flour.id,quantity:.65},{productId:p3.id,ingredientId:yeast.id,quantity:8},{productId:p3.id,ingredientId:oil.id,quantity:.018}]});
const c1=await db.customer.create({data:{name:"Магазин Сомон",phone:"+992 900 10 20 30",address:"ул. Рудаки, 45",creditLimit:1000,bonusPoints:84}});
const c2=await db.customer.create({data:{name:"Чойхонаи Баҳор",phone:"+992 918 44 55 66",address:"рынок Саховат",creditLimit:700,bonusPoints:42}});
await db.customer.create({data:{name:"Магазин у школы №8",phone:"+992 935 11 22 33",address:"мкр. 33",creditLimit:500}});
const s=await db.shipment.create({data:{customerId:c1.id,userId:owner.id,status:ShipmentStatus.DELIVERED,total:240,paidAmount:160,note:"Утренняя доставка",items:{create:[{productId:p1.id,quantity:20,price:8},{productId:p2.id,quantity:16,price:5}]}}});
await db.payment.create({data:{customerId:c1.id,shipmentId:s.id,amount:160,method:PaymentMethod.CASH}});
await db.shipment.create({data:{customerId:c2.id,userId:owner.id,status:ShipmentStatus.DELIVERED,total:144,paidAmount:0,items:{create:[{productId:p3.id,quantity:12,price:12}]}}});
await db.expense.createMany({data:[{category:"Транспорт",amount:45,note:"Топливо",userId:owner.id},{category:"Упаковка",amount:32,note:"Пакеты",userId:owner.id}]});
}main().finally(()=>db.$disconnect());

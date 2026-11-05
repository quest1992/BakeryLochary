import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {editShipment,shipmentRevision,parseShipmentDate} from './edit-shipment';

test('date validation uses Dushanbe and rejects impossible dates',()=>{
 assert.equal(parseShipmentDate('2026-11-05T20:02').toISOString(),'2026-11-05T15:02:00.000Z');
 for(const date of ['2026-02-31T12:00','2026-11-05T24:00','invalid',''])assert.throws(()=>parseShipmentDate(date));
});
test('changing shop and date preserves invoice, stock and payment details; stale saves roll back',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lochari-shop-date-'));
 writeFileSync(join(dir,'test.db'),'');
 const url='file:'+join(dir,'test.db').replaceAll('\\','/');
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
 const db=new PrismaClient({datasourceUrl:url});
 try{
 const user=await db.user.create({data:{name:'Owner',username:'test',passwordHash:'test',role:'OWNER'}});
 const old=await db.customer.create({data:{name:'Old',bonusPoints:9}});
 const next=await db.customer.create({data:{name:'New'}});
 const product=await db.product.create({data:{name:'Pizza',sku:'001',price:11.7,stock:{create:{quantity:12}}}});
 const s=await db.shipment.create({data:{customerId:old.id,userId:user.id,total:93.6,paidAmount:30,note:'keep',deliveredAt:new Date('2026-11-05T15:02:00Z'),items:{create:{productId:product.id,quantity:8,price:11.7,costPrice:5}}},include:{items:true}});
 const payment=await db.payment.create({data:{customerId:old.id,shipmentId:s.id,amount:30,note:'keep payment',method:'TRANSFER'}});
 const details={customerId:next.id,deliveredAt:parseShipmentDate('2026-11-06T20:02'),originalCustomerId:old.id,originalDeliveredAt:s.deliveredAt.toISOString(),originalPaidAmount:s.paidAmount};
 await db.$transaction(tx=>editShipment(tx,s.id,user.id,s.items,shipmentRevision(s.total,s.items),details));
 const after=await db.shipment.findUniqueOrThrow({where:{id:s.id},include:{items:true}});
 assert.equal(after.customerId,next.id);assert.equal(after.deliveredAt.toISOString(),'2026-11-06T15:02:00.000Z');
 assert.equal(after.total,93.6);assert.equal(after.paidAmount,30);assert.equal(after.note,'keep');assert.deepEqual(after.items,s.items);
 assert.deepEqual(await db.payment.findUnique({where:{id:payment.id}}),{...payment,customerId:next.id});
 assert.equal((await db.productStock.findUniqueOrThrow({where:{productId:product.id}})).quantity,12);
 assert.equal(await db.productMovement.count(),0);
 assert.equal((await db.customer.findUniqueOrThrow({where:{id:old.id}})).bonusPoints,0);
 assert.equal((await db.customer.findUniqueOrThrow({where:{id:next.id}})).bonusPoints,9);
 await assert.rejects(db.$transaction(tx=>editShipment(tx,s.id,user.id,s.items,shipmentRevision(s.total,s.items),details)));
 assert.deepEqual(await db.shipment.findUniqueOrThrow({where:{id:s.id},include:{items:true}}),after);
 }finally{await db.$disconnect();rmSync(dir,{recursive:true,force:true});}
});

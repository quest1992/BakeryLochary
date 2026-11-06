import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {applyShipmentPayment} from './shipment-payment';

test('shipment accepts payment above its total, settles old debt and records any advance exactly once',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lochari-shipment-payment-'));
 writeFileSync(join(dir,'test.db'),'');
 const url='file:'+join(dir,'test.db').replaceAll('\\','/');
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
 const db=new PrismaClient({datasourceUrl:url});
 try {
  const user=await db.user.create({data:{name:'Owner',username:'test',passwordHash:'test',role:'OWNER'}});
  const customer=await db.customer.create({data:{name:'Киото'}});
  const other=await db.customer.create({data:{name:'Другой клиент'}});
  const otherDebt=await db.customerDebt.create({data:{customerId:other.id,amount:500}});
  const opening=await db.customerDebt.create({data:{customerId:customer.id,amount:50}});
  const old=await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:147.2,paidAmount:10,deliveredAt:new Date('2026-11-01T00:00:00Z')}});
  const cancelled=await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:99,status:'CANCELLED'}});
  const current=await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:111}});
  await db.$transaction(tx=>applyShipmentPayment(tx,customer.id,187.2,'CASH'));
  assert.equal((await db.customerDebt.findUniqueOrThrow({where:{id:opening.id}})).paidAmount,50);
  assert.equal((await db.shipment.findUniqueOrThrow({where:{id:old.id}})).paidAmount,147.2);
  assert.equal((await db.shipment.findUniqueOrThrow({where:{id:current.id}})).paidAmount,0);
  assert.equal((await db.shipment.findUniqueOrThrow({where:{id:cancelled.id}})).paidAmount,0);
  assert.equal((await db.customerDebt.findUniqueOrThrow({where:{id:otherDebt.id}})).paidAmount,0);
  await db.$transaction(tx=>applyShipmentPayment(tx,customer.id,120.01,'TRANSFER'));
  assert.equal((await db.shipment.findUniqueOrThrow({where:{id:current.id}})).paidAmount,111);
  const payments=await db.payment.findMany({where:{customerId:customer.id}});
  assert.equal(Math.round(payments.reduce((sum,p)=>sum+p.amount,0)*100),30721);
  assert.equal(payments.find(p=>!p.shipmentId&&!p.customerDebtId)?.amount,9.01);
  assert.equal(payments.find(p=>p.shipmentId===current.id)?.method,'TRANSFER');
  await db.$transaction(tx=>applyShipmentPayment(tx,customer.id,0,'CASH'));
  for(const amount of [-1,NaN,Infinity])await assert.rejects(db.$transaction(tx=>applyShipmentPayment(tx,customer.id,amount,'CASH')));
  assert.equal(await db.payment.count(),payments.length);
 } finally {await db.$disconnect();rmSync(dir,{recursive:true,force:true});}
});

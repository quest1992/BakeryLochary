import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {saveShipmentReturn} from './shipment-return';

test('returns persist, link to the store, update stock and net debt once, and reject invalid returns',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lochari-return-'));
 writeFileSync(join(dir,'test.db'),'');
 const url='file:'+join(dir,'test.db').replaceAll('\\','/');
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
 const db=new PrismaClient({datasourceUrl:url});
 try{
 const customer=await db.customer.create({data:{name:'Test shop'}});
 const user=await db.user.create({data:{name:'Tester',username:'tester',passwordHash:'test'}});
 const product=await db.product.create({data:{name:'Bread',sku:'T',price:99}});
 const shipment=await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:100,paidAmount:30,items:{create:{productId:product.id,quantity:10,price:10}}}});
 const input={shipmentId:shipment.id,productId:product.id,quantity:2,userId:user.id,note:'Test'};
 await db.$transaction(tx=>saveShipmentReturn(tx,input));
 await db.$transaction(tx=>saveShipmentReturn(tx,{...input,quantity:1}));
 const saved=await db.shipment.findUniqueOrThrow({where:{id:shipment.id},include:{customer:true}});
 assert.equal(saved.customer.id,customer.id);assert.equal(saved.total,70);assert.equal(saved.total-saved.paidAmount,40);
 assert.equal((await db.productStock.findUniqueOrThrow({where:{productId:product.id}})).quantity,3);
 assert.equal(await db.productMovement.count({where:{shipmentId:shipment.id,type:'RETURN'}}),2);
 for(const quantity of [0,-1,0.5,NaN,Infinity,8]) await assert.rejects(db.$transaction(tx=>saveShipmentReturn(tx,{...input,quantity})));
 await assert.rejects(db.$transaction(tx=>saveShipmentReturn(tx,{...input,shipmentId:9999})));
 assert.equal(await db.productMovement.count(),2);
 await db.$transaction(tx=>saveShipmentReturn(tx,{...input,quantity:7}));
 const fully=await db.shipment.findUniqueOrThrow({where:{id:shipment.id}});assert.equal(fully.total,0);assert.equal(fully.paidAmount,30);
 await db.shipment.update({where:{id:shipment.id},data:{status:'CANCELLED'}});
 await assert.rejects(db.$transaction(tx=>saveShipmentReturn(tx,input)));
 }finally{await db.$disconnect();rmSync(dir,{recursive:true,force:true});}
});

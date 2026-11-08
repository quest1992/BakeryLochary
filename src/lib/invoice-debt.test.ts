import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {getInvoiceDebt} from './invoice-debt';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import InvoiceDebtRow from '../components/InvoiceDebtRow';

test('hidden debt emits no print markup; enabled debt is a totals row for PDF and Bluetooth',()=>{
 assert.equal(renderToStaticMarkup(createElement(InvoiceDebtRow,{debt:null})), '');
 const markup=renderToStaticMarkup(createElement(InvoiceDebtRow,{debt:{beforeInvoiceDay:162.2,total:273.2}}));
 assert.match(markup, /<div><span>Долг до даты накладной<\/span><b>162,20/);
 assert.match(markup, /273,20/);
 assert.match(renderToStaticMarkup(createElement(InvoiceDebtRow,{debt:{beforeInvoiceDay:0,total:0}})), /0,00/);
});

test('invoice debt is hidden by default and totals only the selected customer when enabled',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lochari-invoice-debt-'));
 writeFileSync(join(dir,'test.db'),'');
 const url='file:'+join(dir,'test.db').replaceAll('\\','/');
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:{...process.env,DATABASE_URL:url},stdio:'pipe'});
 const db=new PrismaClient({datasourceUrl:url});
 try {
  const invoiceDate=new Date('2026-11-09T13:00:00+05:00');
  const previousDay=new Date('2026-11-08T23:59:59+05:00');
  const invoiceDay=new Date('2026-11-09T00:00:00+05:00');
  const user=await db.user.create({data:{name:'Owner',username:'test',passwordHash:'test',role:'OWNER'}});
  const customer=await db.customer.create({data:{name:'Клиент'}});
  const other=await db.customer.create({data:{name:'Другой клиент',showDebtOnInvoice:true}});
  assert.equal(customer.showDebtOnInvoice,false);
  assert.equal(customer.allowInvoiceShare,false);
  assert.equal(customer.whatsappNumber,null);assert.equal(customer.telegramNumber,null);
  await db.customerDebt.create({data:{customerId:customer.id,amount:100,paidAmount:25,debtDate:previousDay}});
  await db.customerDebt.create({data:{customerId:other.id,amount:900,debtDate:invoiceDay}});
  await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:187.2,paidAmount:100,deliveredAt:previousDay}});
  await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:111,paidAmount:0,deliveredAt:invoiceDay}});
  await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:80,paidAmount:90}});
  await db.shipment.create({data:{customerId:customer.id,userId:user.id,total:999,status:'CANCELLED'}});
  const before={shipments:await db.shipment.findMany(),payments:await db.payment.findMany(),debts:await db.customerDebt.findMany()};
  assert.equal(await getInvoiceDebt(db,customer.id,false,invoiceDate),null);
  await db.customer.update({where:{id:customer.id},data:{showDebtOnInvoice:true}});
  assert.deepEqual(await getInvoiceDebt(db,customer.id,true,invoiceDate),{beforeInvoiceDay:162.2,total:273.2});
  assert.deepEqual(await getInvoiceDebt(db,other.id,true,invoiceDate),{beforeInvoiceDay:0,total:900});
  await db.customer.update({where:{id:customer.id},data:{showDebtOnInvoice:false}});
  assert.equal(await getInvoiceDebt(db,customer.id,false,invoiceDate),null);
  assert.deepEqual({shipments:await db.shipment.findMany(),payments:await db.payment.findMany(),debts:await db.customerDebt.findMany()},before);
  await db.customerDebt.updateMany({where:{customerId:other.id},data:{paidAmount:900}});
  assert.deepEqual(await getInvoiceDebt(db,other.id,true,invoiceDate),{beforeInvoiceDay:0,total:0});
 } finally {await db.$disconnect();rmSync(dir,{recursive:true,force:true});}
});

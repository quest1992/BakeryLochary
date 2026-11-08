import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInvoicePhone,parseInvoiceShareSettings,invoiceShareMessage,type ShareInvoice} from './invoice-share';
import {createInvoiceImage} from './invoice-image';

test('sharing follows the customer checkbox with or without a saved messenger number',()=>{
 assert.deepEqual(parseInvoiceShareSettings(new FormData()),{whatsappNumber:null,telegramNumber:null,allowInvoiceShare:false});
 assert.equal(normalizeInvoicePhone('+992 (90) 123-45-67'),'+992901234567');
 const form=new FormData();form.set('allowInvoiceShare','on');
 assert.deepEqual(parseInvoiceShareSettings(form),{whatsappNumber:null,telegramNumber:null,allowInvoiceShare:true});
 form.set('telegramNumber','+992901234567');
 assert.equal(parseInvoiceShareSettings(form).allowInvoiceShare,true);
 form.delete('allowInvoiceShare');
 assert.equal(parseInvoiceShareSettings(form).allowInvoiceShare,false);
 for(const phone of ['abc','123','+1234567890123456','javascript:alert(1)'])assert.throws(()=>normalizeInvoicePhone(phone));
});

test('electronic image uses shipment date in Dushanbe and excludes signatures and hidden debt',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');
 let text:string[]=[];
 const ctx={font:'',fillStyle:'',textBaseline:'',textAlign:'',strokeStyle:'',lineWidth:0,
   measureText:(value:string)=>({width:value.length*18}),
   fillRect:()=>{},strokeRect:()=>{},fillText:(value:string)=>{text.push(value);}};
 const canvas={width:0,height:0,getContext:()=>ctx,toBlob:(done:(blob:Blob)=>void)=>done(new Blob(['image'],{type:'image/png'}))};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{fonts:{ready:Promise.resolve()},createElement:()=>canvas}});
 const invoice:ShareInvoice={id:19,customerName:'Клиент',address:'Адрес',phone:'+992901234567',deliveredAt:'2026-11-06T20:30:00Z',expeditor:'Усмон',note:'',items:[{name:'Пицца',quantity:5,price:11.7}],total:58.5,paid:0,debt:null};
 try {
  const file=await createInvoiceImage(invoice);
  assert.equal(file.name,'Lochari-invoice-19.png');assert.equal(file.type,'image/png');
  assert.ok(text.includes('ОТГРУЖЕНО'));assert.ok(text.some(value=>value.includes('07.11.2026, 01:30')));
  assert.ok(text.some(value=>value.includes('58,50')));
  assert.ok(!text.some(value=>/долг|Принял|Отпустил/i.test(value)));
  assert.ok(!/долг/i.test(invoiceShareMessage({...invoice,debt:1000})));
  text=[];await createInvoiceImage({...invoice,debt:273.2});
  assert.ok(text.some(value=>value.includes('Общий долг: 273,20')));
 } finally {if(original)Object.defineProperty(globalThis,'document',original);else Reflect.deleteProperty(globalThis,'document');}
});

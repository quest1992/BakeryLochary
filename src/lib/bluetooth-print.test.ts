import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberedPrinter,sendPrinterData,type PrinterPort} from './bluetooth-print';
import {encodeRaster} from './thermal-raster';

test('reuse only the single previously authorized printer, never guess among devices',()=>{
 const printer={};
 assert.equal(rememberedPrinter([printer],true),printer);
 assert.equal(rememberedPrinter([printer],false),undefined);
 assert.equal(rememberedPrinter([],true),undefined);
 assert.equal(rememberedPrinter([printer,{}],true),undefined);
});

test('Bluetooth writes preserve all ESC/POS bytes, pace chunks and flush before disconnect',async()=>{
 const events:string[]=[], chunks:Uint8Array[]=[];
 const writable=new WritableStream<Uint8Array>({
   write(data){assert.ok(data.length<=256);chunks.push(data);events.push('write');},
   close(){events.push('flush');},
 });
 const port:PrinterPort={writable,async open(){events.push('open');},async close(){assert.equal(writable.locked,false);events.push('disconnect');}};
 const pixels=new Uint8ClampedArray(576*24*4).fill(255);
 const packets=[new Uint8Array([27,64]),encodeRaster(pixels,576,24),new Uint8Array([10,10,10])];
 await sendPrinterData(port,packets,()=>{},async ms=>{events.push(`pause-${ms}`);});
 assert.deepEqual(Buffer.concat(chunks),Buffer.concat(packets));
 assert.equal(events[0],'open');
 assert.deepEqual(events.slice(-3),['flush','pause-300','disconnect']);
 assert.equal(events.filter(e=>e==='pause-40').length,chunks.length);
});

test('failed transmission releases the port and does not resend a partial invoice',async()=>{
 let writes=0,closed=false,attempted=false;
 const writable=new WritableStream<Uint8Array>({write(){writes++;throw Error('disconnected');}});
 const port:PrinterPort={writable,async open(){},async close(){closed=true;assert.equal(writable.locked,false);}};
 await assert.rejects(sendPrinterData(port,[new Uint8Array(600)],()=>{attempted=true;},async()=>{}),/disconnected/);
 assert.equal(writes,1);assert.equal(closed,true);assert.equal(attempted,true);
});

test('failed opening sends no bytes and never closes a port owned by another app',async()=>{
 let closed=false,attempted=false;
 const port:PrinterPort={writable:null,async open(){throw Error('busy');},async close(){closed=true;}};
 await assert.rejects(sendPrinterData(port,[new Uint8Array([27,64])],()=>{attempted=true;},async()=>{}),/busy/);
 assert.equal(closed,false);assert.equal(attempted,false);
});

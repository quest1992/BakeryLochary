"use client";
import {useState,useRef} from 'react';
import {defaultPrinter} from '@/lib/default-printer';
import {Bluetooth,Printer} from 'lucide-react';
import {encodeRaster} from '@/lib/thermal-raster';
type Port={open(options:{baudRate:number}):Promise<void>;close():Promise<void>;writable:WritableStream<Uint8Array>|null};
type Serial={requestPort():Promise<Port>;getPorts():Promise<Port[]>};
function receipt(){
 const root=document.querySelector('.invoice');if(!root)throw Error('Накладная не найдена');
 const canvas=document.createElement('canvas');canvas.width=576;canvas.height=16000;
 const context=canvas.getContext('2d');if(!context)throw Error('Не удалось подготовить накладную');const ctx=context;
 ctx.fillStyle='white';ctx.fillRect(0,0,576,16000);ctx.fillStyle='black';let y=16;
 function text(value:string,size=16,center=false){
 ctx.font=`${size===8?'400':'700'} ${Math.round(size*203/72)}px Arial`;ctx.textBaseline='top';ctx.textAlign=center?'center':'left';const step=Math.ceil(size*203/72*1.12);
 let line='';for(const word of value.trim().split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>544&&line){ctx.fillText(line,center?288:16,y);y+=step;line=word;}else line=next;}
 ctx.textAlign=center?'center':'left';if(line){ctx.fillText(line,center?288:16,y,544);y+=step;}ctx.textAlign='left';
 }
 function rule(){y+=5;ctx.fillRect(16,y,544,2);y+=8;}
 const value=(selector:string)=>root!.querySelector(selector)?.textContent||'';
 text(value('h1'),16,true);text(value('.invoiceTagline'),8,true);text(value('.invoiceDocumentTitle'),12,true);text(value('.invoiceHead strong'),14,true);text(value('.invoiceHead>div:last-child span'),14,true);rule();
 root.querySelectorAll('.invoiceMeta>div').forEach(group=>{Array.from(group.children).forEach(el=>text(el.textContent||'',el.classList.contains('invoiceAddress')?8:14));});rule();
 root.querySelectorAll('tbody tr').forEach(row=>{const cells=Array.from(row.querySelectorAll('td')).map(el=>el.textContent||'');text(cells[0]+'. '+cells[1]);text('Кол.: '+cells[2]+'  Цена: '+cells[3]);text('Сумма: '+cells[4]);rule();});
 const returns=root.querySelector('.invoiceReturns');if(returns){text('Возвраты');returns.querySelectorAll(':scope>div').forEach(group=>{Array.from(group.children).forEach(el=>text(el.textContent||'',14));rule();});}
 root.querySelectorAll('.invoiceTotals>div').forEach(row=>{ctx.font='700 45px Arial';ctx.textBaseline='top';const label=row.querySelector('span')?.textContent||'',amount=row.querySelector('b,strong')?.textContent||'';const right=ctx.measureText(amount).width;ctx.fillText(label,16,y,Math.max(1,536-right));ctx.textAlign='right';ctx.fillText(amount,560,y,Math.min(330,right));ctx.textAlign='left';y+=53;});rule();text('Отпустил __________________');text('Принял __________________');
 if(y+16>16000)throw Error('Накладная слишком длинная для Bluetooth. Используйте обычную печать.');
 return {ctx,height:y+16};
}
export default function PrintButton(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const selected=useRef<Port|undefined>(undefined);
 const preference='lochari-default-bluetooth-printer';
 async function checkBluetooth(){
 const serial=(navigator as Navigator&{serial?:Serial}).serial;
 const version=navigator.userAgent.match(/(?:Chrome|Chromium)\/([\d.]+)/)?.[1]||'не определена';
 let known='';if(serial){try{known=' Ранее разрешённых принтеров: '+(await serial.getPorts()).length+'.';}catch{known=' Доступ к устройствам ограничен браузером.';}}
 setMessage('Chrome: '+version+'. Прямая печать: '+(serial?'API доступен.':'API недоступен.')+known+' Если список пуст: проверьте сопряжение MPT-III и разрешение «Устройства поблизости» для Chrome, если оно есть в настройках телефона.');
 }
 async function printBluetooth(changePrinter=false){
 const serial=(navigator as Navigator&{serial?:Serial}).serial;
 if(!serial){setMessage('Прямая печать недоступна. Откройте сайт в обновлённом Chrome на Android.');return;}
 let port:Port|undefined,writer:WritableStreamDefaultWriter<Uint8Array>|undefined,sent=false;
 setBusy(true);setMessage('Подключение к принтеру…');
 try{
 // No service filter: some Android printer ports are exposed without SPP metadata.
 if(!changePrinter){
 port=selected.current;
 if(!port){let enabled=false;try{enabled=localStorage.getItem(preference)==='yes';}catch{}port=defaultPrinter(await serial.getPorts(),enabled);}
 }
 if(!port)port=await serial.requestPort();
 selected.current=port;
 await document.fonts.ready;const {ctx,height}=receipt();
 await port.open({baudRate:9600});try{localStorage.setItem(preference,'yes');}catch{}if(!port.writable)throw Error('Принтер недоступен');writer=port.writable.getWriter();
 const write=async(data:Uint8Array)=>{for(let i=0;i<data.length;i+=1024){sent=true;await writer!.write(data.slice(i,i+1024));await new Promise(resolve=>setTimeout(resolve,20));}};
 await write(new Uint8Array([27,64]));
 for(let y=0;y<height;y+=128){const h=Math.min(128,height-y);await write(encodeRaster(ctx.getImageData(0,y,576,h).data,576,h));}
 await write(new Uint8Array([10,10,10]));setMessage('Накладная отправлена. Проверьте распечатку на принтере.');
 }catch(error){const name=error instanceof Error?error.name:'';if(!sent)selected.current=undefined;setMessage(name==='NotFoundError'?'Принтер не выбран или Chrome не нашёл доступных устройств. Поиск выполняется без фильтра. Нажмите «Проверить Bluetooth» и сообщите результат.':(sent?'Передача прервалась; часть накладной могла напечататься. ':'Не удалось подключиться ('+ (name||'ошибка') +'). Включите принтер и проверьте сопряжение MPT-III. ')+'Обычная печать остаётся доступна.');}
 finally{writer?.releaseLock();if(port)await port.close().catch(()=>{});setBusy(false);}
 }
 return <div className="invoicePrintControls"><div className="invoicePrintButtons"><button className="printButton" onClick={()=>window.print()}><Printer size={17}/>Печать / PDF</button><button type="button" disabled={busy} onClick={()=>printBluetooth()}><Bluetooth size={17}/>{busy?'Отправка…':'Печать Bluetooth'}</button><button type="button" disabled={busy} onClick={()=>printBluetooth(true)}>Другой принтер</button><button type="button" disabled={busy} onClick={checkBluetooth}>Проверить Bluetooth</button></div>{message&&<p role="status">{message}</p>}</div>;
}

"use client";
import {useEffect,useRef,useState} from 'react';
import {rememberedPrinter,sendPrinterData,type PrinterPort} from '@/lib/bluetooth-print';
import {Bluetooth,Printer} from 'lucide-react';
import {encodeRaster} from '@/lib/thermal-raster';
type Port=PrinterPort;
type Serial={requestPort():Promise<Port>;getPorts():Promise<Port[]>};
function receipt(){
 const root=document.querySelector('.invoice');if(!root)throw Error('Накладная не найдена');
 const canvas=document.createElement('canvas');canvas.width=576;canvas.height=16000;
 const context=canvas.getContext('2d');if(!context)throw Error('Не удалось подготовить накладную');const ctx=context;
 ctx.fillStyle='white';ctx.fillRect(0,0,576,16000);ctx.fillStyle='black';let y=16;
 function text(value:string,size=14,center=false){
 ctx.font=`${size===6?'400':'700'} ${Math.round(size*203/72)}px Arial`;ctx.textBaseline='top';ctx.textAlign=center?'center':'left';const step=Math.ceil(size*203/72*1.12);
 let line='';for(const word of value.trim().split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>544&&line){ctx.fillText(line,center?288:16,y);y+=step;line=word;}else line=next;}
 ctx.textAlign=center?'center':'left';if(line){ctx.fillText(line,center?288:16,y,544);y+=step;}ctx.textAlign='left';
 }
 function rule(){y+=5;ctx.fillRect(16,y,544,2);y+=8;}
 const value=(selector:string)=>root!.querySelector(selector)?.textContent||'';
 text(value('h1'),14,true);text(value('.invoiceTagline'),6,true);text(value('.invoiceDocumentTitle'),10,true);text(value('.invoiceHead strong'),12,true);text(value('.invoiceHead>div:last-child span'),12,true);rule();
 root.querySelectorAll('.invoiceMeta>div').forEach(group=>{Array.from(group.children).forEach(el=>text(el.textContent||'',el.classList.contains('invoiceAddress')?6:12));});rule();
 root.querySelectorAll('tbody tr').forEach(row=>{const cells=Array.from(row.querySelectorAll('td')).map(el=>el.textContent||'');text(cells[0]+'. '+cells[1]);text('Кол.: '+cells[2]+'  Цена: '+cells[3]);text('Сумма: '+cells[4]);rule();});
 const returns=root.querySelector('.invoiceReturns');if(returns){text('Возвраты');returns.querySelectorAll(':scope>div').forEach(group=>{Array.from(group.children).forEach(el=>text(el.textContent||'',12));rule();});}
 root.querySelectorAll('.invoiceTotals>div').forEach(row=>{ctx.font='700 39px Arial';ctx.textBaseline='top';const label=row.querySelector('span')?.textContent||'',amount=row.querySelector('b,strong')?.textContent||'';const right=ctx.measureText(amount).width;ctx.fillText(label,16,y,Math.max(1,536-right));ctx.textAlign='right';ctx.fillText(amount,560,y,Math.min(330,right));ctx.textAlign='left';y+=46;});rule();text('Отпустил __________________');text('Принял __________________');
 if(y+16>16000)throw Error('Накладная слишком длинная для Bluetooth. Разделите накладную на несколько отгрузок.');
 return {ctx,height:y+16};
}
export default function PrintButton({autoPrint=false}:{autoPrint?:boolean}){
 const autoPrinted=useRef(false);
 useEffect(()=>{
   if(!autoPrint||autoPrinted.current)return;
   let active=true;
   void document.fonts.ready.then(()=>{
     if(!active)return;
     autoPrinted.current=true;
     window.print();
   });
   return()=>{active=false;};
 },[autoPrint]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const selected=useRef<Port|undefined>(undefined),printing=useRef(false);
 const preference='lochari-default-bluetooth-printer';
 useEffect(()=>{
   let active=true;
   const serial=(navigator as Navigator&{serial?:Serial}).serial;
   let enabled=false;try{enabled=localStorage.getItem(preference)==='yes';}catch{}
   if(enabled&&serial)serial.getPorts().then(ports=>{if(active&&!selected.current&&!printing.current)selected.current=rememberedPrinter(ports,true);}).catch(()=>{});
   return()=>{active=false;};
 },[]);
 async function printBluetooth(changePrinter=false){
 if(printing.current)return;
 const serial=(navigator as Navigator&{serial?:Serial}).serial;
 if(!window.isSecureContext){setMessage('Для Bluetooth откройте сайт по защищённому адресу HTTPS.');return;}
 if(!serial){setMessage('Этот браузер не поддерживает прямую Bluetooth-печать. На Android откройте сайт в Chrome версии 138 или новее.');return;}
 let sent=false;
 printing.current=true;setBusy(true);setMessage('Подключение к принтеру…');
 try{
 // Keep the chooser directly in the click handler so browser activation is retained.
 const port=(!changePrinter&&selected.current)||await serial.requestPort();
 selected.current=port;
 await document.fonts.ready;const {ctx,height}=receipt();
 function* packets(){
   yield new Uint8Array([27,64]);
   for(let y=0;y<height;y+=24){const h=Math.min(24,height-y);yield encodeRaster(ctx.getImageData(0,y,576,h).data,576,h);}
   yield new Uint8Array([10,10,10]);
 }
 setMessage('Передача накладной…');
 await sendPrinterData(port,packets(),()=>{sent=true;});
 try{localStorage.setItem(preference,'yes');}catch{}
 setMessage('Накладная отправлена. Проверьте распечатку на принтере.');
 }catch(error){
 const name=error instanceof Error?error.name:'';
 if(name!=='NotFoundError')selected.current=undefined;
 if(sent)setMessage('Передача прервалась; часть накладной могла напечататься. Проверьте бумагу и соединение перед повторной печатью.');
 else if(name==='NotFoundError')setMessage('Выбор принтера отменён или устройство не найдено. Проверьте, что принтер включён и сопряжён с телефоном.');
 else if(name==='SecurityError'||name==='NotAllowedError')setMessage('Браузер запретил подключение. Разрешите сайту доступ к принтеру и проверьте разрешение «Устройства поблизости» для Chrome.');
 else setMessage('Не удалось напечатать: '+(error instanceof Error?error.message:'неизвестная ошибка')+'. Проверьте сопряжение принтера и закройте другие приложения, подключённые к нему.');
 }finally{printing.current=false;setBusy(false);}
 }
 return <div className="invoicePrintControls"><div className="invoicePrintButtons"><button type="button" disabled={busy} onClick={()=>window.print()}><Printer size={17}/>Печать / PDF</button><button type="button" disabled={busy} onClick={()=>printBluetooth()}><Bluetooth size={17}/>{busy?'Отправка…':'Печать Bluetooth'}</button><button type="button" disabled={busy} onClick={()=>printBluetooth(true)}>Другой принтер</button></div>{message&&<p role="status">{message}</p>}</div>;
}

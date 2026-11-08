"use client";
import {money} from "@/lib/money";
import{useMemo,useState}from"react";import{Plus,Trash2,Truck}from"lucide-react";import{shipmentAction}from"@/app/actions";
import ShipmentCustomerDebt, {type DebtCustomer} from "./ShipmentCustomerDebt";
type Product={id:number;name:string;price:number;stock:number};
type ShipmentCustomer=DebtCustomer & {electronicInvoice:boolean};
type ShipmentItem={productId:number;quantity:string};
export default function ShipmentComposer({products,customers,compact=false}:{products:Product[];customers:ShipmentCustomer[];compact?:boolean}){
 const[paidInFull,setPaidInFull]=useState(false);
 const[partialPayment,setPartialPayment]=useState("0");
 const[customerId,setCustomerId]=useState(String(customers[0]?.id??""));
 const[items,setItems]=useState<ShipmentItem[]>(products[0]?[{productId:products[0].id,quantity:"1"}]:[]);
 const total=useMemo(()=>items.reduce((s,i)=>{const quantity=Number(i.quantity);return s+(Number.isFinite(quantity)?(products.find(p=>p.id===i.productId)?.price||0)*quantity:0)},0),[items,products]);
 const add=()=>{const free=products.find(p=>!items.some(i=>i.productId===p.id));if(free)setItems([...items,{productId:free.id,quantity:"1"}])};
 const updateProduct=(idx:number,productId:number)=>setItems(items.map((i,n)=>n===idx?{...i,productId}:i));
 const updateQuantity=(idx:number,quantity:string)=>setItems(items.map((i,n)=>n===idx?{...i,quantity}:i));
 const customer=customers.find(c=>String(c.id)===customerId);
 const submitLabel=customer?.electronicInvoice ? "Сохранить и отправить"
   : compact ? "Сохранить отгрузку" : "Сохранить отгрузку и печатать";
 const submittedItems=items.map(item=>({...item,quantity:Number(item.quantity)}));
 return <form action={shipmentAction} className={"card formBox shipmentComposer "+(compact?"compact":"")}><div className="cardHead"><h3>{compact?"Быстрая отгрузка":"Новая многопозиционная отгрузка"}</h3><strong>{money(total)}</strong></div><label>Точка / клиент<select name="customerId" required value={customerId} onChange={e=>setCustomerId(e.target.value)}>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><ShipmentCustomerDebt key={customerId} customer={customer}/><div className="cartLines">{items.map((item,idx)=>{const p=products.find(x=>x.id===item.productId),quantity=Number(item.quantity);return <div className="cartLine" key={idx}><select aria-label="Продукция" value={item.productId} onChange={e=>updateProduct(idx,Number(e.target.value))}>{products.filter(x=>x.id===item.productId||!items.some(i=>i.productId===x.id)).map(x=><option key={x.id} value={x.id}>{x.name} · {money(x.price)} · остаток {x.stock}</option>)}</select><input aria-label="Количество" type="number" min="1" max={p?.stock||1} value={item.quantity} onChange={e=>updateQuantity(idx,e.target.value)}/><b>{money((p?.price||0)*(Number.isFinite(quantity)?quantity:0))}</b><button type="button" className="iconButton" onClick={()=>setItems(items.filter((_,n)=>n!==idx))} disabled={items.length===1}><Trash2 size={16}/></button></div>})}</div><button type="button" className="ghostButton addLine" onClick={add} disabled={items.length>=products.length}><Plus size={16}/>Добавить позицию</button><div className="formGrid"><div><label>Оплачено сейчас<input name="paid" type="number" min="0" step=".01" value={paidInFull?total.toFixed(2):partialPayment} readOnly={paidInFull} onChange={e=>setPartialPayment(e.target.value)} required/></label><label style={{display:"flex",flexDirection:"row",alignItems:"center",gap:8,marginTop:10}}><input type="checkbox" checked={paidInFull} onChange={e=>{setPaidInFull(e.target.checked);setPartialPayment("0")}}/>Оплатил сразу</label></div><label>Способ оплаты<select name="method"><option value="CASH">Наличные</option><option value="TRANSFER">Перевод</option></select></label><label>Примечание<input name="note" placeholder="Маршрут или комментарий"/></label></div><input type="hidden" name="items" value={JSON.stringify(submittedItems)}/>{!compact && <input type="hidden" name="openInvoice" value="yes"/>}<button disabled={!items.length || !customer}><Truck size={17}/>{submitLabel}</button></form>
}

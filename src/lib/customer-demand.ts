export type DemandShipment={customerId:number;customerName:string;deliveredAt:Date;items:{productId:number;productName:string;quantity:number}[]};
export type CustomerDemand={customerId:number;customerName:string;productId:number;productName:string;weeklyQuantity:number;dailyAverage:number;recommended:number;todayQuantity:number;shortage:number;missedDays:number};

const dayKey=(date:Date)=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function calculateCustomerDemand(shipments:DemandShipment[],now:Date=new Date()):CustomerDemand[]{
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),from=new Date(today);from.setDate(from.getDate()-7);
 const groups=new Map<string,{customerId:number;customerName:string;productId:number;productName:string;days:Map<string,number>;todayQuantity:number}>();
 for(const shipment of shipments){
  if(shipment.deliveredAt<from)continue;
  const isToday=shipment.deliveredAt>=today;
  for(const item of shipment.items){
   const key=`${shipment.customerId}:${item.productId}`,group=groups.get(key)||{customerId:shipment.customerId,customerName:shipment.customerName,productId:item.productId,productName:item.productName,days:new Map(),todayQuantity:0};
   if(isToday)group.todayQuantity+=item.quantity;else group.days.set(dayKey(shipment.deliveredAt),(group.days.get(dayKey(shipment.deliveredAt))||0)+item.quantity);
   groups.set(key,group);
  }
 }
 return [...groups.values()].map(group=>{const weeklyQuantity=[...group.days.values()].reduce((sum,value)=>sum+value,0),dailyAverage=weeklyQuantity/7,recommended=Math.ceil(dailyAverage),missedDays=Array.from({length:7},(_,index)=>{const day=new Date(from);day.setDate(from.getDate()+index);return group.days.has(dayKey(day))?0:1}).reduce<number>((sum,value)=>sum+value,0);return{customerId:group.customerId,customerName:group.customerName,productId:group.productId,productName:group.productName,weeklyQuantity,dailyAverage,recommended,todayQuantity:group.todayQuantity,shortage:Math.max(0,recommended-group.todayQuantity),missedDays}}).filter(row=>row.weeklyQuantity>0).sort((a,b)=>b.shortage-a.shortage||b.weeklyQuantity-a.weeklyQuantity);
}

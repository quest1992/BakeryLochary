type PaymentRow={id:number;amount:number;method:"CASH"|"TRANSFER";paidAt:Date;note:string|null;customer:{id:number;name:string};shipment:{id:number;deliveredAt:Date}|null;customerDebt:{id:number}|null};

const localDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dushanbe",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);

export function groupPaymentsForReport(rows:PaymentRow[]){
 const groups=new Map<string,{id:string;date:string;customer:{id:number;name:string};method:"CASH"|"TRANSFER";amount:number;shipmentIds:Set<number>;shipmentDates:Set<string>;hasOpeningDebt:boolean;hasAdvance:boolean}>();
 for(const row of rows){const day=localDay(row.paidAt),key=`${day}:${row.customer.id}:${row.method}`,group=groups.get(key)??{id:key,date:day,customer:row.customer,method:row.method,amount:0,shipmentIds:new Set<number>(),shipmentDates:new Set<string>(),hasOpeningDebt:false,hasAdvance:false};group.amount+=row.amount;if(row.shipment){group.shipmentIds.add(row.shipment.id);group.shipmentDates.add(localDay(row.shipment.deliveredAt))}if(row.customerDebt)group.hasOpeningDebt=true;if(!row.shipment&&!row.customerDebt)group.hasAdvance=true;groups.set(key,group)}
 return[...groups.values()].map(group=>({id:group.id,date:group.date,customer:group.customer,method:group.method,amount:Math.round(group.amount*100)/100,shipmentIds:[...group.shipmentIds].sort((a,b)=>a-b),shipmentDates:[...group.shipmentDates].sort(),hasOpeningDebt:group.hasOpeningDebt,hasAdvance:group.hasAdvance})).sort((a,b)=>b.date.localeCompare(a.date));
}

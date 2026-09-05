export type DatedDebt={amount:number;paidAmount:number;date:Date};

const outstanding=(row:DatedDebt)=>Math.max(0,row.amount-row.paidAmount);
const cents=(value:number)=>Math.round(value*100)/100;

export function splitCustomerDebt(rows:DatedDebt[],cutoff:Date){
 const cutoffTime=cutoff.getTime();
 const before=cents(rows.filter(row=>row.date.getTime()<cutoffTime).reduce((sum,row)=>sum+outstanding(row),0));
 const after=cents(rows.filter(row=>row.date.getTime()>=cutoffTime).reduce((sum,row)=>sum+outstanding(row),0));
 return{before,after,total:cents(before+after)};
}

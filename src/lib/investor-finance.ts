import {db} from "./db";
import {calculateInvestment} from "./investment";

export type FinancialPeriod = {from: Date; to: Date};

export function parseFinancialPeriod(from?: string, to?: string): FinancialPeriod {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const parsedFrom = from ? new Date(`${from}T00:00:00`) : defaultFrom;
  const parsedTo = to ? new Date(`${to}T23:59:59.999`) : now;
  if (Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime()) || parsedFrom > parsedTo) return {from: defaultFrom, to: now};
  return {from: parsedFrom, to: parsedTo};
}

export async function getInvestorFinance(period: FinancialPeriod) {
  const range = {gte: period.from, lte: period.to};
  const [shipments, expenses, payments, customers, supplierDebts, paymentHistory, investmentAgreement] = await Promise.all([
    db.shipment.findMany({where:{status:"DELIVERED",deliveredAt:range},select:{total:true,paidAmount:true,items:{select:{quantity:true,costPrice:true}}}}),
    db.expense.findMany({where:{spentAt:range},select:{id:true,category:true,amount:true,note:true,spentAt:true,user:{select:{name:true}}},orderBy:{spentAt:"desc"}}),
    db.payment.findMany({where:{paidAt:range},select:{amount:true}}),
    db.customer.findMany({select:{id:true,name:true,phone:true,shipments:{where:{status:"DELIVERED"},select:{total:true,paidAmount:true}},debts:{select:{amount:true,paidAmount:true}}},orderBy:{name:"asc"}}),
    db.supplierDebt.findMany({select:{amount:true,paidAmount:true,supplier:{select:{id:true,name:true}}}}),
    db.payment.findMany({where:{paidAt:range},select:{id:true,amount:true,method:true,paidAt:true,note:true,customer:{select:{id:true,name:true}}},orderBy:{paidAt:"desc"},take:100}),
    db.investmentAgreement.findUnique({where:{id:1},select:{investorName:true,principal:true,initialShare:true,startedAt:true,note:true,buybacks:{select:{id:true,amount:true,paidAt:true,note:true},orderBy:{paidAt:"desc"}}}}),
  ]);
  const income = shipments.reduce((sum,row)=>sum+row.total,0);
  const cogs = shipments.reduce((sum,row)=>sum+row.items.reduce((itemSum,item)=>itemSum+item.quantity*item.costPrice,0),0);
  const expenseTotal = expenses.reduce((sum,row)=>sum+row.amount,0);
  const customerRows = customers.map(customer=>({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    sales: customer.shipments.reduce((sum,row)=>sum+row.total,0),
    debt: customer.shipments.reduce((sum,row)=>sum+Math.max(0,row.total-row.paidAmount),0)+customer.debts.reduce((sum,row)=>sum+Math.max(0,row.amount-row.paidAmount),0),
  }));
  const supplierMap = new Map<number,{id:number;name:string;debt:number}>();
  for (const row of supplierDebts) {
    const current=supplierMap.get(row.supplier.id)??{id:row.supplier.id,name:row.supplier.name,debt:0};
    current.debt+=Math.max(0,row.amount-row.paidAmount);supplierMap.set(current.id,current);
  }
  const investment=investmentAgreement?{...investmentAgreement,...calculateInvestment(investmentAgreement.principal,investmentAgreement.initialShare,investmentAgreement.buybacks.map(row=>row.amount)),startedAt:investmentAgreement.startedAt.toISOString(),buybacks:investmentAgreement.buybacks.map(row=>({...row,paidAt:row.paidAt.toISOString()}))}:null;
  return {
    period:{from:period.from.toISOString(),to:period.to.toISOString()},
    summary:{income,expenses:expenseTotal,costOfSales:cogs,profit:income-cogs-expenseTotal,received:payments.reduce((sum,row)=>sum+row.amount,0),soldOnCredit:shipments.reduce((sum,row)=>sum+Math.max(0,row.total-row.paidAmount),0),receivable:customerRows.reduce((sum,row)=>sum+row.debt,0),payable:[...supplierMap.values()].reduce((sum,row)=>sum+row.debt,0)},
    customers:customerRows,
    suppliers:[...supplierMap.values()].filter(row=>row.debt>0),
    expenses:expenses.map(row=>({id:row.id,category:row.category,amount:row.amount,note:row.note,date:row.spentAt.toISOString(),recordedBy:row.user.name})),
    payments:paymentHistory.map(row=>({id:row.id,amount:row.amount,method:row.method,date:row.paidAt.toISOString(),note:row.note,customer:{id:row.customer.id,name:row.customer.name}})),
    investment,
  };
}

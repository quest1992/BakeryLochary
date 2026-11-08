import type {FinancialPeriod} from "./investor-finance";

const start = new Date("2026-11-01T00:00:00+05:00");
const day = 86400000;
const dateLabel = new Intl.DateTimeFormat("ru-RU", {timeZone:"Asia/Dushanbe", day:"numeric", month:"short", year:"numeric"});
const dayKey = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Dushanbe", year:"numeric", month:"2-digit", day:"2-digit"});

export function investorWeeks(now = new Date()) {
  const weeks = [];
  for (let from = start; from <= now;) {
    const days = from === start ? 1 : 7;
    const next = new Date(+from + days * day);
    const end = new Date(+next - 1);
    const label = days === 1 ? dateLabel.format(from) : dateLabel.formatRange(from, end);
    weeks.push({
      value: dayKey.format(from), label, end, period: {from, to: new Date(Math.min(+end, +now))},
    });
    from = next;
  }
  return weeks.reverse();
}

type Payment = {amount:number;paidAt:Date};
type Invoice = {
  items:{productId:number;quantity:number;price:number;costPrice:number}[];
  payments:Payment[];
};
type Return = {productId:number;quantity:number;createdAt:Date};

export function paidInvoiceCost(invoice: Invoice, returns: Return[], through: Date) {
  let total = 0;
  let cost = 0;
  for (const item of invoice.items) {
    const returned = returns.filter(row => row.productId === item.productId && row.createdAt <= through)
      .reduce((sum, row) => sum + row.quantity, 0);
    const quantity = Math.max(0, item.quantity - returned);
    total += quantity * item.price;
    cost += quantity * item.costPrice;
  }
  const paid = invoice.payments.filter(row => row.paidAt <= through).reduce((sum, row) => sum + row.amount, 0);
  return total > 0 ? cost * Math.min(1, Math.max(0, paid / total)) : 0;
}

export function weeklyInvestorTotals(receipts:number, cost:number, expenses:number, writeOffs:number) {
  const profitCents = Math.round((receipts - cost - expenses - writeOffs) * 100);
  const distributableCents = receipts > 0 ? Math.max(0, profitCents) : 0;
  const investorCents = Math.round(distributableCents * 0.4);
  return {receipts, cost, profit:profitCents / 100, investorEarnings:investorCents / 100, ownerEarnings:(distributableCents - investorCents) / 100};
}

export async function getWeeklyInvestorTotals(period: FinancialPeriod, expenses:number, writeOffs:number) {
  const {db} = await import("./db");
  const range = {gte:period.from, lte:period.to};
  const [payments, weeklyReturns] = await Promise.all([
    db.payment.findMany({where:{paidAt:range}, select:{amount:true, shipmentId:true, customerDebtId:true}}),
    db.productMovement.findMany({where:{type:"RETURN", shipmentId:{not:null}, createdAt:range}, select:{shipmentId:true}}),
  ]);
  const receipts = payments.reduce((sum, row) => sum + (row.shipmentId !== null || row.customerDebtId !== null ? row.amount : 0), 0);
  const ids = [...new Set([...payments, ...weeklyReturns].flatMap(row => row.shipmentId === null ? [] : [row.shipmentId]))];
  const [invoices, returns] = await Promise.all([
    db.shipment.findMany({
      where:{id:{in:ids}},
      select:{id:true, items:{select:{productId:true, quantity:true, price:true, costPrice:true}}, payments:{where:{paidAt:{lte:period.to}}, select:{amount:true, paidAt:true}}},
    }),
    db.productMovement.findMany({
      where:{type:"RETURN", shipmentId:{in:ids}, createdAt:{lte:period.to}},
      select:{shipmentId:true, productId:true, quantity:true, createdAt:true},
    }),
  ]);
  const previous = new Date(+period.from - 1);
  const cost = invoices.reduce((sum, invoice) => {
    const invoiceReturns = returns.filter(row => row.shipmentId === invoice.id);
    return sum + paidInvoiceCost(invoice, invoiceReturns, period.to) - paidInvoiceCost(invoice, invoiceReturns, previous);
  }, 0);
  return weeklyInvestorTotals(receipts, cost, expenses, writeOffs);
}

import type {Prisma} from '@prisma/client';

export type InvoiceDebt = {beforeInvoiceDay: number; total: number};
export const previousDebtLabel = 'Долг до даты накладной';

const businessDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dushanbe', year: 'numeric', month: '2-digit', day: '2-digit',
});

export async function getInvoiceDebt(
  db: Pick<Prisma.TransactionClient, 'shipment' | 'customerDebt'>,
  customerId: number,
  visible: boolean,
  invoiceDate: Date,
): Promise<InvoiceDebt | null> {
  if (!visible) return null;
  const cutoff = new Date(businessDay.format(invoiceDate) + 'T00:00:00+05:00');
  const [shipments, debts] = await Promise.all([
    db.shipment.findMany({where: {customerId, status: 'DELIVERED'}, select: {total: true, paidAmount: true, deliveredAt: true}}),
    db.customerDebt.findMany({where: {customerId}, select: {amount: true, paidAmount: true, debtDate: true}}),
  ]);
  let beforeInvoiceDay = 0;
  let total = 0;
  const balances = [
    ...shipments.map(row => ({amount: row.total, paid: row.paidAmount, date: row.deliveredAt})),
    ...debts.map(row => ({amount: row.amount, paid: row.paidAmount, date: row.debtDate})),
  ];
  for (const {amount, paid, date} of balances) {
    const outstanding = Math.max(0, Math.round(amount * 100) - Math.round(paid * 100));
    total += outstanding;
    if (date < cutoff) beforeInvoiceDay += outstanding;
  }
  return {beforeInvoiceDay: beforeInvoiceDay / 100, total: total / 100};
}

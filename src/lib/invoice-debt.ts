import type {Prisma} from '@prisma/client';

export async function getInvoiceDebt(db: Pick<Prisma.TransactionClient, 'shipment' | 'customerDebt'>, customerId: number, visible: boolean): Promise<number | null> {
  if (!visible) return null;
  const [shipments, debts] = await Promise.all([
    db.shipment.findMany({where: {customerId, status: 'DELIVERED'}, select: {total: true, paidAmount: true}}),
    db.customerDebt.findMany({where: {customerId}, select: {amount: true, paidAmount: true}}),
  ]);
  const total = shipments.reduce((sum, row) => sum + Math.max(0, Math.round(row.total * 100) - Math.round(row.paidAmount * 100)), 0)
    + debts.reduce((sum, row) => sum + Math.max(0, Math.round(row.amount * 100) - Math.round(row.paidAmount * 100)), 0);
  return total / 100;
}

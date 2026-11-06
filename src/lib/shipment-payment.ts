import type {Prisma} from '@prisma/client';

export async function applyShipmentPayment(tx: Prisma.TransactionClient, customerId: number, amount: number, method: 'CASH' | 'TRANSFER') {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100))) throw new Error('Проверьте сумму оплаты');
  let left = Math.round(amount * 100);
  if (!left) return;
  const paidAt = new Date();
  const debts = await tx.customerDebt.findMany({where: {customerId}, orderBy: [{debtDate: 'asc'}, {id: 'asc'}]});
  for (const debt of debts) {
    if (!left) break;
    const part = Math.min(left, Math.max(0, Math.round((debt.amount - debt.paidAmount) * 100)));
    if (!part) continue;
    await tx.customerDebt.update({where: {id: debt.id}, data: {paidAmount: {increment: part / 100}}});
    await tx.payment.create({data: {customerId, customerDebtId: debt.id, amount: part / 100, method, paidAt}});
    left -= part;
  }
  const shipments = await tx.shipment.findMany({where: {customerId, status: 'DELIVERED'}, orderBy: [{deliveredAt: 'asc'}, {id: 'asc'}]});
  for (const shipment of shipments) {
    if (!left) break;
    const part = Math.min(left, Math.max(0, Math.round((shipment.total - shipment.paidAmount) * 100)));
    if (!part) continue;
    await tx.shipment.update({where: {id: shipment.id}, data: {paidAmount: {increment: part / 100}}});
    await tx.payment.create({data: {customerId, shipmentId: shipment.id, amount: part / 100, method, paidAt}});
    left -= part;
  }
  if (left) await tx.payment.create({data: {customerId, amount: left / 100, method, paidAt, note: 'Аванс'}});
}

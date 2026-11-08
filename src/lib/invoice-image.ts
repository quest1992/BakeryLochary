import {previousDebtLabel} from "./invoice-debt";
import {money} from './money';
import {invoiceShareDate, type ShareInvoice} from './invoice-share';

export async function createInvoiceImage(invoice: ShareInvoice): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось подготовить фото накладной');
  const rows: {text: string; size: number; bold: boolean; center: boolean; y: number}[] = [];
  let y = 50;
  const line = (value: string, size = 27, bold = false, center = false) => {
    ctx.font = `${bold ? 700 : 400} ${size}px Arial`;
    // Wrap by characters as well as spaces, so long product names never clip.
    for (const paragraph of value.split('\n')) {
      let current = '';
      for (const char of paragraph) {
        if (ctx.measureText(current + char).width > 980 && current) {
          rows.push({text: current, size, bold, center, y}); y += size * 1.45; current = '';
        }
        current += char;
      }
      rows.push({text: current, size, bold, center, y}); y += size * 1.45;
    }
  };
  line('Нонвойхонаи Лочари', 40, true, true);
  line('Свежая выпечка каждый день', 23, false, true);
  line(`НАКЛАДНАЯ № ${String(invoice.id).padStart(5, '0')}`, 32, true, true);
  line(invoiceShareDate(invoice.deliveredAt), 25, false, true); y += 25;
  line(`Получатель: ${invoice.customerName}`, 29, true);
  if (invoice.address) line(`Адрес: ${invoice.address}`);
  if (invoice.phone) line(`Телефон: ${invoice.phone}`);
  line(`Экспедитор: ${invoice.expeditor}`);
  if (invoice.note) line(`Примечание: ${invoice.note}`);
  y += 25;
  invoice.items.forEach((item, index) => {
    line(`${index + 1}. ${item.name}`, 29, true);
    line(`${item.quantity} шт. × ${money(item.price)} = ${money(item.quantity * item.price)}`);
    y += 15;
  });
  y += 20;
  line(`Итого: ${money(invoice.total)}`, 34, true);
  line(`Оплачено: ${money(invoice.paid)}`, 29);
  if (invoice.debt !== null) {
    line(`${previousDebtLabel}: ${money(invoice.debt.beforeInvoiceDay)}`, 32, true);
    line(`Общий долг: ${money(invoice.debt.total)}`, 32, true);
  }
  y += 45;
  const stampTop = y;
  line('ОТГРУЖЕНО', 38, true, true);
  line(invoiceShareDate(invoice.deliveredAt), 28, true, true);
  y += 55;
  if (y > 16000) throw new Error('Накладная слишком длинная для одного фото. Используйте печать / PDF.');
  canvas.height = Math.ceil(y);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'top';
  for (const row of rows) {
    ctx.font = `${row.bold ? 700 : 400} ${row.size}px Arial`;
    ctx.fillStyle = row.y >= stampTop ? '#19704e' : '#201b18';
    ctx.textAlign = row.center ? 'center' : 'left';
    ctx.fillText(row.text, row.center ? 550 : 60, row.y);
  }
  ctx.strokeStyle = '#19704e'; ctx.lineWidth = 4;
  ctx.strokeRect(240, stampTop - 15, 620, y - stampTop - 20);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Не удалось сохранить фото накладной')), 'image/png'));
  return new File([blob], `Lochari-invoice-${invoice.id}.png`, {type: 'image/png'});
}

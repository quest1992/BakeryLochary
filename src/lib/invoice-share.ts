export function normalizeInvoicePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) throw new Error('Укажите номер WhatsApp или Telegram в международном формате, например +992…');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) throw new Error('Проверьте номер WhatsApp или Telegram: от 7 до 15 цифр с кодом страны');
  return '+' + digits;
}

export function parseInvoiceShareSettings(form: FormData) {
  const whatsappNumber = normalizeInvoicePhone(String(form.get('whatsappNumber') || ''));
  const telegramNumber = normalizeInvoicePhone(String(form.get('telegramNumber') || ''));
  const allowInvoiceShare = form.get('allowInvoiceShare') === 'on';
  return {whatsappNumber, telegramNumber, allowInvoiceShare};
}

export type ShareInvoice = {
  id: number; customerName: string; address: string; phone: string;
  deliveredAt: string; expeditor: string; note: string;
  items: {name: string; quantity: number; price: number}[];
  total: number; paid: number; debt: number | null;
};

export const invoiceShareDate = (date: string) => new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Dushanbe', dateStyle: 'short', timeStyle: 'short',
}).format(new Date(date));

export const invoiceShareMessage = (invoice: ShareInvoice) =>
  `Нонвойхонаи Лочари. Накладная № ${String(invoice.id).padStart(5, '0')}. ${invoice.customerName}. ОТГРУЖЕНО ${invoiceShareDate(invoice.deliveredAt)}. Сумма: ${invoice.total.toFixed(2)} сомони.`;

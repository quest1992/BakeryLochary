"use client";

import {useEffect, useState} from 'react';
import {Share2} from 'lucide-react';
import {createInvoiceImage} from '@/lib/invoice-image';
import {invoiceShareMessage, type ShareInvoice} from '@/lib/invoice-share';

export default function InvoiceShareButton({invoice, whatsapp, telegram}: {invoice: ShareInvoice; whatsapp: string | null; telegram: string | null}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const text = invoiceShareMessage(invoice);
  useEffect(() => {
    if (!open) return;
    let active = true, url = '';
    setFile(null); setPreview(''); setMessage('Подготовка фото накладной…');
    createInvoiceImage(invoice).then(image => {
      if (!active) return;
      url = URL.createObjectURL(image); setFile(image); setPreview(url); setMessage('');
    }).catch(error => {if (active) setMessage(error instanceof Error ? error.message : 'Не удалось подготовить накладную');});
    return () => {active = false; if (url) URL.revokeObjectURL(url);};
  }, [open, invoice]);

  async function copy(value: string) {
    try {await navigator.clipboard.writeText(value); setMessage('Скопировано.');}
    catch {setMessage('Не удалось скопировать. Выделите и скопируйте текст вручную.');}
  }
  async function share() {
    if (!file || busy) return;
    if (!navigator.share || !navigator.canShare?.({files: [file]})) {
      setMessage('Этот браузер не передаёт фото в приложения. Скачайте фото ниже, откройте мессенджер и прикрепите его клиенту.'); return;
    }
    setBusy(true);
    try {
      await navigator.share({files: [file], text, title: `Накладная № ${invoice.id}`});
      setMessage('Фото передано в выбранное приложение. Проверьте получателя и подтвердите отправку там.');
    } catch (error) {
      setMessage(error instanceof Error && error.name === 'AbortError' ? 'Отправка отменена.' : 'Не удалось открыть отправку. Можно скачать фото и прикрепить его вручную.');
    } finally {setBusy(false);}
  }
  return <div className="invoiceShareControls">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}><Share2 size={17}/>Отправить накладную</button>
    {open && <section className="invoiceSharePanel" aria-label="Отправка накладной">
      <h3>Электронная накладная № {invoice.id}</h3>
      <p><b>{invoice.customerName}</b></p>
      <p>Выберите WhatsApp или Telegram в меню «Поделиться», затем клиента. Отправку подтвердите в мессенджере.</p>
      {whatsapp && <p>WhatsApp: <span>{whatsapp}</span> <button type="button" className="ghostButton" onClick={() => copy(whatsapp)}>Копировать номер</button></p>}
      {telegram && <p>Telegram: <span>{telegram}</span> <button type="button" className="ghostButton" onClick={() => copy(telegram)}>Копировать номер</button></p>}
      {preview && <img src={preview} alt={`Накладная № ${invoice.id}, ${invoice.customerName}, со штампом «ОТГРУЖЕНО»`} className="invoiceSharePreview"/>}
      <div className="invoicePrintButtons"><button type="button" disabled={!file || busy} onClick={share}>{busy ? 'Открытие…' : 'Поделиться фото'}</button>
        {file && <><a className="printLink" href={preview} download={file.name}>Скачать фото</a><button type="button" className="ghostButton" onClick={() => copy(text)}>Копировать сообщение</button></>}
        <button type="button" className="ghostButton" disabled={busy} onClick={() => setOpen(false)}>Закрыть</button>
      </div>
      <p className="invoiceShareText">{text}</p>
      {message && <p role="status">{message}</p>}
    </section>}
  </div>;
}

import React from 'react';
import {previousDebtLabel, type InvoiceDebt} from '@/lib/invoice-debt';
import {money} from '@/lib/money';

export default function InvoiceDebtRow({debt}: {debt: InvoiceDebt | null}) {
  if (debt === null) return null;
  return <>
    <div><span>{previousDebtLabel}</span><b>{money(debt.beforeInvoiceDay)}</b></div>
    <div><span>Общий долг</span><b>{money(debt.total)}</b></div>
  </>;
}

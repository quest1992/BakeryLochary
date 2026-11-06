import React from 'react';
import {money} from '@/lib/money';

export default function InvoiceDebtRow({debt}: {debt: number | null}) {
  if (debt === null) return null;
  return <div><span>Общий долг</span><b>{money(debt)}</b></div>;
}

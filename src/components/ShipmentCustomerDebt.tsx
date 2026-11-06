"use client";

import {useId} from "react";
import {money} from "@/lib/money";
const BUSINESS_TIME_ZONE="Asia/Dushanbe";

type DebtEntry = {
  id: string; shipmentId?: number; date: string; amount: number; paid: number;
  items: {name: string; quantity: number; price: number}[]; note?: string;
};
export type DebtCustomer = {id: number; name: string; debtEntries: DebtEntry[]};

export default function ShipmentCustomerDebt({customer}: {customer?: DebtCustomer}) {
  const headingId = useId();
  const entries = customer?.debtEntries ?? [];
  const total = entries.reduce((sum, row) => sum + Math.max(0, row.amount - row.paid), 0);
  return <details className="shipmentCustomerDebt">
    <summary>
      <span><b>Долг</b><small>{customer?.name ?? "Выберите клиента"}</small></span>
      <span><strong className={total > 0 ? "red" : ""}>{money(total)}</strong><small>Подробнее</small></span>
    </summary>
    <section aria-labelledby={headingId}>
      <h4 id={headingId}>Долг — {customer?.name ?? "клиент не выбран"}</h4>
      <p>Все неоплаченные отгрузки, включая прошлые периоды. Текущая отгрузка попадёт сюда после сохранения.</p>
      {!entries.length ? <p>{customer ? "У клиента нет задолженности." : "Выберите клиента для просмотра долга."}</p> : <>
        <div className="shipmentDebtTable"><table>
          <thead><tr><th>Дата / накладная</th><th>Что взял</th><th>Количество</th><th>Цена</th><th>Сумма</th><th>Оплачено</th><th>Осталось</th></tr></thead>
          <tbody>{entries.map(row => <tr key={row.id}>
            <td>{new Intl.DateTimeFormat("ru-RU", {timeZone: BUSINESS_TIME_ZONE}).format(new Date(row.date))}{row.shipmentId && <><br/><a href={`/shipments/${row.shipmentId}/print`} target="_blank" rel="noreferrer">№ {row.shipmentId}</a></>}</td>
            <td>{row.items.length ? row.items.map((item, index) => <div key={index}>{item.name}</div>) : <><b>Ранее внесённый долг</b><br/>{row.note}<br/><small>Состав товаров не указан</small></>}</td>
            <td>{row.items.length ? row.items.map((item, index) => <div key={index}>{item.quantity} шт.</div>) : "—"}</td>
            <td>{row.items.length ? row.items.map((item, index) => <div key={index}>{money(item.price)}</div>) : "—"}</td>
            <td>{money(row.amount)}</td><td>{money(row.paid)}</td><td><b>{money(Math.max(0, row.amount - row.paid))}</b></td>
          </tr>)}</tbody>
        </table></div>
        <p><b>Общий долг: {money(total)}</b></p>
      </>}
    </section>
  </details>;
}

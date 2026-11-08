import {money} from "@/lib/money";
import Link from "next/link";
import AppNavigation from "./AppNavigation";
import ReportMonthPicker from "./ReportMonthPicker";
import {getInvestorFinance,investorBusinessDay,parseFinancialPeriod} from "@/lib/investor-finance";


const date=(value:string)=>new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));

const monthLabel = new Intl.DateTimeFormat("ru-RU", {
  month: "long", year: "numeric", timeZone: "UTC",
});

export default async function InvestorDashboard({user,tab,from,to}:{user:{name:string};tab:string;from?:string;to?:string}){
  const period=parseFinancialPeriod(from,to,"dushanbe"),data=await getInvestorFinance(period),activeTab=["finance","customers","reports"].includes(tab)?tab:"finance";
  const today = investorBusinessDay.format(new Date());
  const fromDay = investorBusinessDay.format(period.from);
  const toDay = investorBusinessDay.format(period.to);
  const months = [];
  for (const month = new Date(Date.UTC(2026, 8, 1)); month.toISOString().slice(0, 7) <= today.slice(0, 7); month.setUTCMonth(month.getUTCMonth() + 1)) {
    const value = month.toISOString().slice(0, 7);
    const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    months.push({value, label: monthLabel.format(month), from: value + "-01", to: value + "-" + lastDay});
  }
  const selectedMonth = months.find(month => month.from === fromDay
    && (month.to === toDay || (month.value === today.slice(0, 7) && toDay === today)))?.value || "";
  return <div className="shell"><AppNavigation tab={activeTab} user={{name:user.name,role:"INVESTOR"}}/><main>
    <header><div><p className="eyebrow">КАБИНЕТ ИНВЕСТОРА · ТОЛЬКО ПРОСМОТР</p><h1>{activeTab==="customers"?"Клиенты и долги":activeTab==="reports"?"Финансовый отчёт":"Финансы"}</h1></div></header>
    <section className="card"><form className="periodFilter" key={fromDay + ":" + toDay}><ReportMonthPicker months={months} selectedMonth={selectedMonth}/><label>С<input type="date" name="from" defaultValue={fromDay}/></label><label>По<input type="date" name="to" defaultValue={toDay}/></label><input type="hidden" name="tab" value={activeTab}/><button>Показать период</button><Link className="ghostButton" href={`/?tab=${activeTab}`}>Текущий месяц</Link></form></section>
    {data.investment&&<section className="card investmentCard"><div className="cardHead"><div><p className="eyebrow">ИНВЕСТИЦИЯ И ВЫКУП ДОЛИ</p><h3>{data.investment.investorName}</h3></div><span className="status">Только просмотр</span></div><section className="stats"><div className="stat"><small>Первоначально вложено</small><b>{money(data.investment.principal)}</b></div><div className="stat"><small>Уже выкуплено</small><b>{money(data.investment.repaid)}</b></div><div className="stat"><small>Осталось выкупить</small><b>{money(data.investment.remaining)}</b></div><div className="stat"><small>Текущая доля прибыли</small><b>{data.investment.currentShare.toFixed(2)}%</b><span>из первоначальных {data.investment.initialShare}%</span></div></section><div className="investmentProgress"><span style={{width:`${Math.min(100,data.investment.repaid/data.investment.principal*100)}%`}}/></div><p className="muted">Доля уменьшается автоматически пропорционально каждой фактической выплате. Сумма каждого выкупа может быть любой.</p>{data.investment.buybacks.length>0&&<div className="tableCard"><table><thead><tr><th>Дата выкупа</th><th>Сумма</th><th>Примечание</th></tr></thead><tbody>{data.investment.buybacks.map(row=><tr key={row.id}><td>{date(row.paidAt)}</td><td>{money(row.amount)}</td><td>{row.note||"—"}</td></tr>)}</tbody></table></div>}</section>}
    {activeTab!=="customers"&&<><section className="stats"><div className="stat"><small>Доходы</small><b>{money(data.summary.income)}</b></div><div className="stat"><small>Расходы</small><b>{money(data.summary.expenses)}</b></div><div className="stat"><small>Брак / списание</small><b className={data.summary.writeOffs.cost>0?"red":""}>{data.summary.writeOffs.quantity} шт.</b><span>потери {money(data.summary.writeOffs.cost)}</span></div><div className="stat"><small>Чистая прибыль за выбранный период</small><b className={data.selectedPeriod.profit<0?"red":""}>{money(data.selectedPeriod.profit)}</b></div><div className="stat"><small>Получено денег</small><b>{money(data.summary.received)}</b></div><div className="stat"><small>Нам должны</small><b>{money(data.summary.receivable)}</b></div><div className="stat"><small>Мы должны</small><b>{money(data.summary.payable)}</b></div><div className="stat"><small>Продано в долг</small><b>{money(data.summary.soldOnCredit)}</b></div><div className="stat investorEarning"><small>Инвестор заработал за выбранный период</small><b>{money(data.selectedPeriod.investorEarnings)}</b><span>{data.selectedPeriod.investmentActive?`${data.selectedPeriod.share.toFixed(2)}% от прибыли после даты начала`:`Начисление с ${data.selectedPeriod.officialStart?date(data.selectedPeriod.officialStart):"—"}`}</span></div></section>
    <section className="card tableCard"><h3>История оплат</h3><p className="muted">Одна строка — общая оплата клиента за день. Внутреннее распределение по долгам не дублируется.</p><table><thead><tr><th>Дата оплаты</th><th>Клиент</th><th>Накладные / основание</th><th>Способ</th><th>Получено</th></tr></thead><tbody>{data.payments.map(row=>{const reasons=[row.shipmentIds.length?"№ "+row.shipmentIds.join(", № "):"",row.hasOpeningDebt?"старый долг":"",row.hasAdvance?"аванс":""].filter(Boolean).join(" · ");return <tr key={row.id}><td>{date(row.date+"T12:00:00")}</td><td>{row.customer.name}</td><td>{reasons||"Оплата без привязки"}</td><td>{row.method==="CASH"?"Наличные":"Перевод"}</td><td><b>{money(row.amount)}</b></td></tr>})}</tbody></table></section>
    <section className="card tableCard"><h3>Расходы</h3><table><thead><tr><th>Дата</th><th>Категория</th><th>Описание</th><th>Сумма</th></tr></thead><tbody>{data.expenses.map(row=><tr key={row.id}><td>{date(row.date)}</td><td>{row.category}</td><td>{row.note||"—"}</td><td className="red">{money(row.amount)}</td></tr>)}</tbody></table></section></>}
    {activeTab==="customers"&&<><section className="card tableCard"><h3>Клиенты: покупки и задолженность</h3><table><thead><tr><th>Клиент</th><th>Телефон</th><th>Всего покупок</th><th>Долг</th></tr></thead><tbody>{data.customers.map(row=><tr key={row.id}><td><b>{row.name}</b></td><td>{row.phone||"—"}</td><td>{money(row.sales)}</td><td className={row.debt>0?"red":""}>{money(row.debt)}</td></tr>)}</tbody></table></section><section className="card tableCard"><h3>Кому должна пекарня</h3><table><thead><tr><th>Получатель</th><th>Сумма долга</th></tr></thead><tbody>{data.suppliers.map(row=><tr key={row.id}><td>{row.name}</td><td className="red">{money(row.debt)}</td></tr>)}</tbody></table></section></>}
  </main></div>;
}

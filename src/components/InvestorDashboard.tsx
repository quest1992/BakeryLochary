import {money} from "@/lib/money";
import Link from "next/link";
import AppNavigation from "./AppNavigation";
import InvestorWeekPicker from "./InvestorWeekPicker";
import {getInvestorFinance} from "@/lib/investor-finance";
import {getWeeklyInvestorTotals, investorWeeks} from "@/lib/investor-week";


const date=(value:string)=>new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));

export default async function InvestorDashboard({user,tab,week,owner=false}:{user:{name:string};tab:string;week?:string;owner?:boolean}){
  const activeTab = ["finance","customers","reports"].includes(tab) ? tab : "finance";
  const weeks = investorWeeks();
  const selected = weeks.find(option => option.value === week) ?? weeks[0];
  if (!selected) return <main><p>Недельные расчёты начнутся 1 ноября 2026 года.</p></main>;
  const data = await getInvestorFinance(selected.period);
  const weekly = activeTab === "customers" ? null : await getWeeklyInvestorTotals(
    selected.period, data.summary.expenses, data.summary.writeOffs.cost,
  );
  const currentWeekHref = "/?tab=" + activeTab + (owner ? "&view=investor" : "");
  return <div className="shell"><AppNavigation tab={activeTab} user={{name:user.name,role:owner?"OWNER":"INVESTOR"}}/><main>
    <header><div><p className="eyebrow">КАБИНЕТ ИНВЕСТОРА · ТОЛЬКО ПРОСМОТР</p><h1>{activeTab==="customers"?"Клиенты и долги":activeTab==="reports"?"Финансовый отчёт":"Финансы"}</h1></div></header>
    <section className="card"><div className="periodFilter">
      <InvestorWeekPicker weeks={weeks.map(({value,label}) => ({value,label}))} selected={selected.value}/>
      <Link className="ghostButton" href={currentWeekHref}>Текущая неделя</Link>
      {owner && <Link className="ghostButton" href="/?tab=finance">Назад в финансы</Link>}
    </div></section>
    {data.investment&&<section className="card investmentCard"><div className="cardHead"><div><p className="eyebrow">ИНВЕСТИЦИЯ И ВЫКУП ДОЛИ</p><h3>{data.investment.investorName}</h3></div><span className="status">Только просмотр</span></div><section className="stats"><div className="stat"><small>Первоначально вложено</small><b>{money(data.investment.principal)}</b></div><div className="stat"><small>Уже выкуплено</small><b>{money(data.investment.repaid)}</b></div><div className="stat"><small>Осталось выкупить</small><b>{money(data.investment.remaining)}</b></div><div className="stat"><small>Доля по договору выкупа</small><b>{data.investment.currentShare.toFixed(2)}%</b><span>из первоначальных {data.investment.initialShare}%</span></div></section><div className="investmentProgress"><span style={{width:`${Math.min(100,data.investment.repaid/data.investment.principal*100)}%`}}/></div><p className="muted">Доля по договору выкупа уменьшается пропорционально выплатам за выкуп. Для недельного расчёта применяется ставка 40%.</p>{data.investment.buybacks.length>0&&<div className="tableCard"><table><thead><tr><th>Дата выкупа</th><th>Сумма</th><th>Примечание</th></tr></thead><tbody>{data.investment.buybacks.map(row=><tr key={row.id}><td>{date(row.paidAt)}</td><td>{money(row.amount)}</td><td>{row.note||"—"}</td></tr>)}</tbody></table></div>}</section>}
    {weekly && <>
    <section className="stats">
      <div className="stat"><small>Получено в оплату заказов и долгов</small><b>{money(weekly.receipts)}</b></div>
      <div className="stat"><small>Себестоимость оплаченной продукции</small><b>{money(weekly.cost)}</b></div>
      <div className="stat"><small>Расходы, включая внесённую зарплату</small><b>{money(data.summary.expenses)}</b></div>
      <div className="stat"><small>Брак / списание</small><b>{money(data.summary.writeOffs.cost)}</b><span>{data.summary.writeOffs.quantity} шт.</span></div>
      <div className="stat"><small>Чистая прибыль за неделю</small><b className={weekly.profit<0?"red":""}>{money(weekly.profit)}</b></div>
      <div className="stat"><small>Доля пекарни · 60%</small><b>{money(weekly.ownerEarnings)}</b></div>
      <div className="stat investorEarning"><small>Инвестору к выплате · 40%</small><b>{money(weekly.investorEarnings)}</b>
        <span>{selected.end > selected.period.to ? "Предварительная сумма" : "Расчёт за завершённую неделю"}</span>
      </div>
      <div className="stat"><small>Нам должны</small><b>{money(data.summary.receivable)}</b></div>
      <div className="stat"><small>Мы должны</small><b>{money(data.summary.payable)}</b></div>
    </section>
    <section className="card tableCard"><h3>История оплат</h3><p className="muted">Одна строка — общая оплата клиента за день. Внутреннее распределение по долгам не дублируется.</p><table><thead><tr><th>Дата оплаты</th><th>Клиент</th><th>Накладные / основание</th><th>Способ</th><th>Получено</th></tr></thead><tbody>{data.payments.map(row=>{const reasons=[row.shipmentIds.length?"№ "+row.shipmentIds.join(", № "):"",row.hasOpeningDebt?"старый долг":"",row.hasAdvance?"аванс":""].filter(Boolean).join(" · ");return <tr key={row.id}><td>{date(row.date+"T12:00:00")}</td><td>{row.customer.name}</td><td>{reasons||"Оплата без привязки"}</td><td>{row.method==="CASH"?"Наличные":"Перевод"}</td><td><b>{money(row.amount)}</b></td></tr>})}</tbody></table></section>
    <section className="card tableCard"><h3>Расходы</h3><table><thead><tr><th>Дата</th><th>Категория</th><th>Описание</th><th>Сумма</th></tr></thead><tbody>{data.expenses.map(row=><tr key={row.id}><td>{date(row.date)}</td><td>{row.category}</td><td>{row.note||"—"}</td><td className="red">{money(row.amount)}</td></tr>)}</tbody></table></section></>}
    {activeTab==="customers"&&<><section className="card tableCard"><h3>Клиенты: покупки и задолженность</h3><table><thead><tr><th>Клиент</th><th>Телефон</th><th>Всего покупок</th><th>Долг</th></tr></thead><tbody>{data.customers.map(row=><tr key={row.id}><td><b>{row.name}</b></td><td>{row.phone||"—"}</td><td>{money(row.sales)}</td><td className={row.debt>0?"red":""}>{money(row.debt)}</td></tr>)}</tbody></table></section><section className="card tableCard"><h3>Кому должна пекарня</h3><table><thead><tr><th>Получатель</th><th>Сумма долга</th></tr></thead><tbody>{data.suppliers.map(row=><tr key={row.id}><td>{row.name}</td><td className="red">{money(row.debt)}</td></tr>)}</tbody></table></section></>}
  </main></div>;
}

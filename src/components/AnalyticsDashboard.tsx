type Period={name:string;sales:number;cogs:number;gross:number;expense:number;net:number;paid:number;made:number};
type Point={label:string;value:number};
const money=(value:number)=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(value)+" с.";
const BarList=({items,empty}:{items:Point[];empty:string})=>{const max=Math.max(1,...items.map(x=>x.value));return <div className="analyticsBars">{items.length?items.map((item,index)=><div className="analyticsBar" key={item.label}><div><span><i>{index+1}</i>{item.label}</span><b>{money(item.value)}</b></div><div className="analyticsTrack"><span style={{width:(item.value/max*100)+"%"}}/></div></div>):<p className="analyticsEmpty">{empty}</p>}</div>};
export default function AnalyticsDashboard({periods,dailySales,products,expenses,debts}:{periods:Period[];dailySales:Point[];products:Point[];expenses:Point[];debts:Point[]}){
 const maxDay=Math.max(1,...dailySales.map(x=>x.value));
 const month=periods.at(-1)!;
 const margin=month.sales?Math.round(month.net/month.sales*100):0;
 return <div className="analyticsDashboard">
  <section className="analyticsHero"><div><p className="eyebrow">КАРТИНА БИЗНЕСА</p><h2>{money(month.net)}</h2><span>чистая прибыль за текущий месяц</span></div><div className={margin<0?"analyticsMargin negative":"analyticsMargin"}><b>{margin}%</b><span>чистая маржа</span></div></section>
  <section className="reportGrid">{periods.map(r=><article className="report card" key={r.name}><p className="eyebrow">{r.name}</p><h3>{money(r.sales)}</h3><span>Продажи</span><dl><div><dt>Себестоимость</dt><dd>{money(r.cogs)}</dd></div><div><dt>Валовая прибыль</dt><dd>{money(r.gross)}</dd></div><div><dt>Расходы</dt><dd>{money(r.expense)}</dd></div><div className="netRow"><dt>Чистая прибыль</dt><dd className={r.net<0?"red":""}>{money(r.net)}</dd></div><div><dt>Получено денег</dt><dd>{money(r.paid)}</dd></div><div><dt>Произведено</dt><dd>{r.made} шт.</dd></div></dl></article>)}</section>
  <section className="card analyticsChart"><div className="analyticsTitle"><div><p className="eyebrow">ДИНАМИКА</p><h3>Продажи за 7 дней</h3></div><strong>{money(dailySales.reduce((sum,x)=>sum+x.value,0))}</strong></div><div className="dailyChart">{dailySales.map(x=><div className="dailyColumn" key={x.label}><b>{x.value?money(x.value):""}</b><div><span style={{height:Math.max(x.value?8:2,x.value/maxDay*100)+"%"}}/></div><small>{x.label}</small></div>)}</div></section>
  <div className="analyticsGrid"><section className="card"><div className="analyticsTitle"><div><p className="eyebrow">ПРОДУКЦИЯ</p><h3>Лидеры продаж</h3></div></div><BarList items={products} empty="Продаж продукции пока нет"/></section><section className="card"><div className="analyticsTitle"><div><p className="eyebrow">РАСХОДЫ</p><h3>По категориям</h3></div></div><BarList items={expenses} empty="Расходы пока не внесены"/></section></div>
  <section className="card"><div className="analyticsTitle"><div><p className="eyebrow">ДЕБИТОРКА</p><h3>Наибольшие долги клиентов</h3></div><strong>{money(debts.reduce((sum,x)=>sum+x.value,0))}</strong></div><BarList items={debts} empty="У клиентов нет долгов"/></section>
 </div>
}

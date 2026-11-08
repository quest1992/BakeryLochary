"use client";

import {useRouter} from "next/navigation";

type MonthOption = {value:string;label:string;from:string;to:string};

export default function ReportMonthPicker({months,selectedMonth}:{months:MonthOption[];selectedMonth:string}) {
  const router=useRouter();
  return <label>Месяц<select value={selectedMonth} onChange={event=>{
    const month=months.find(option=>option.value===event.target.value);
    if(!month)return;
    const params=new URLSearchParams(window.location.search);
    params.set("from",month.from);
    params.set("to",month.to);
    router.push(`${window.location.pathname}?${params.toString()}`);
  }}><option value="" disabled>Выберите месяц</option>{months.map(month=><option key={month.value} value={month.value}>{month.label}</option>)}</select></label>;
}

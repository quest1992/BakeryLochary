"use client";

import {useRouter} from "next/navigation";

export default function InvestorWeekPicker({weeks, selected}:{weeks:{value:string;label:string}[]; selected:string}) {
  const router = useRouter();
  return <label>Неделя<select value={selected} onChange={event => {
    const params = new URLSearchParams(window.location.search);
    params.set("week", event.target.value);
    params.delete("from");
    params.delete("to");
    router.push(window.location.pathname + "?" + params.toString());
  }}>{weeks.map(week => <option key={week.value} value={week.value}>{week.label}</option>)}</select></label>;
}

"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {AlertTriangle, ArrowLeft, Home, RefreshCw} from "lucide-react";
import {useEffect} from "react";

const explanations:Record<string,{title:string;description:string;checks:string[]}>={
 production:{title:"Не удалось выпустить партию",description:"Система остановила производство, чтобы остатки сырья не стали отрицательными.",checks:["Проверьте, хватает ли каждого ингредиента на всё количество продукции.","Убедитесь, что единицы рецептуры совпадают с единицами сырья.","Проверьте, что у продукции заполнена рецептура."]},
 ingredients:{title:"Не удалось сохранить сырьё",description:"Введённое изменение может нарушить существующую рецептуру или содержит недопустимое значение.",checks:["Единицу сырья из действующего рецепта нельзя менять напрямую.","Сначала удалите сырьё из рецептур, измените единицу и добавьте его обратно.","Количество, минимум, цель и цена не должны быть отрицательными."]},
 shipments:{title:"Не удалось сохранить отгрузку",description:"Отгрузка остановлена, чтобы склад и задолженность клиента остались правильными.",checks:["Количество не должно превышать остаток готовой продукции.","Оплата не может быть больше суммы отгрузки.","Проверьте выбранного клиента и состав отгрузки."]},
 expedition:{title:"Не удалось сохранить отгрузку",description:"Проверьте складской остаток и введённую оплату.",checks:["Количество не должно превышать остаток.","Оплата не должна быть больше общей суммы.","Все выбранные позиции должны быть активны."]},
 recipes:{title:"Не удалось сохранить рецептуру",description:"Проверьте продукт, ингредиент и количество.",checks:["Количество должно быть больше нуля.","Один ингредиент добавляется к продукту только один раз.","Единицы должны соответствовать карточке сырья."]},
 finance:{title:"Не удалось записать финансовую операцию",description:"Сумма или дата операции заполнены неверно.",checks:["Сумма должна быть больше нуля.","Проверьте клиента и дату.","Повторно проверьте способ оплаты."]},
 suppliers:{title:"Не удалось провести закупку",description:"Проверьте поставщика, количество и закупочную цену.",checks:["Количество должно быть больше нуля.","Цена не должна быть отрицательной.","Каждое сырьё можно добавить в закупку один раз."]}
};
const fallback={title:"Операцию не удалось выполнить",description:"Система остановила действие, чтобы не повредить данные учёта.",checks:["Проверьте заполненные поля и числовые значения.","Вернитесь в раздел и повторите действие.","Если ошибка повторится, сообщите технический код ниже."]};

export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 const params=useSearchParams(),tab=params.get("tab")||"dashboard",info=explanations[tab]||fallback;
 useEffect(()=>{console.error(error)},[error]);
 return <main className="friendlyError">
  <section className="friendlyErrorCard">
   <div className="errorIllustration"><AlertTriangle size={34}/></div>
   <p className="eyebrow">ОПЕРАЦИЯ ОСТАНОВЛЕНА</p>
   <h1>{info.title}</h1>
   <p className="errorLead">{info.description}</p>
   <div className="errorChecks"><b>Что проверить</b>{info.checks.map(x=><div key={x}><span>✓</span><p>{x}</p></div>)}</div>
   <div className="errorActions"><Link href={"/?tab="+tab}><ArrowLeft size={17}/>Вернуться в раздел</Link><button onClick={reset}><RefreshCw size={17}/>Повторить</button><Link className="secondary" href="/"><Home size={17}/>На главную</Link></div>
   {error.digest&&<small className="errorCode">Технический код: {error.digest}</small>}
  </section>
 </main>;
}

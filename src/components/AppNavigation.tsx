"use client";
import Link from "next/link";
import {useState} from "react";
import {LayoutDashboard,Package,Factory,Truck,Users,WalletCards,Wheat,ClipboardList,LogOut,ChevronDown,Building2,ShieldCheck,ShoppingCart,Menu,X,BookOpen,Settings2} from "lucide-react";
import {logoutAction} from "@/app/actions";

const groups=[
 {id:"work",label:"Работа сегодня",icon:LayoutDashboard,items:[["dashboard","Обзор",LayoutDashboard],["expedition","Экспедитор",Truck],["production","Производство",Factory],["shipments","Отгрузки",Truck],["procurement","Снабженец",ShoppingCart]]},
 {id:"catalog",label:"Склад и справочники",icon:BookOpen,items:[["stock","Готовая продукция",Package],["ingredients","Сырьё",Wheat],["products","Продукция",ClipboardList],["recipes","Рецептуры",BookOpen],["customers","Клиенты",Users],["suppliers","Поставщики",Building2]]},
 {id:"manage",label:"Управление",icon:Settings2,items:[["finance","Финансы",WalletCards],["reports","Отчёты",LayoutDashboard],["team","Команда и доступ",ShieldCheck]]}
] as const;
const ownerOnly=["finance","reports","products","recipes","suppliers","procurement"];

export default function AppNavigation({tab,user}:{tab:string;user:{name:string;role:string}}){
 const [mobileOpen,setMobileOpen]=useState(false);
 const activeGroup=groups.find(g=>g.items.some(i=>i[0]===tab))?.id||"work";
 const [opened,setOpened]=useState<Record<string,boolean>>({[activeGroup]:true});
 return <>
  <button className="mobileMenuButton" onClick={()=>setMobileOpen(true)} aria-label="Открыть меню"><Menu size={21}/><span>Меню</span></button>
  {mobileOpen&&<button className="navBackdrop" aria-label="Закрыть меню" onClick={()=>setMobileOpen(false)}/>}
  <aside className={mobileOpen?"navOpen":""}>
   <div className="logo"><span>Л</span><div><b>Нонвойхонаи Лочари</b><small>учёт пекарни</small></div><button className="mobileClose" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
   <nav>{groups.map(group=>{const visible=group.items.filter(i=>user.role==="OWNER"||!ownerOnly.includes(i[0]));if(!visible.length)return null;const isOpen=opened[group.id]||group.id===activeGroup;const GroupIcon=group.icon;return <section className="navGroup" key={group.id}>
    <button className="navGroupButton" onClick={()=>setOpened(v=>({...v,[group.id]:!isOpen}))}><GroupIcon size={16}/><span>{group.label}</span><ChevronDown size={15} className={isOpen?"rotated":""}/></button>
    <div className={isOpen?"navGroupItems expanded":"navGroupItems"}>{visible.map(([id,label,Icon])=><Link key={id} href={"/?tab="+id} className={tab===id?"active":""} onClick={()=>setMobileOpen(false)}><Icon size={18}/><span>{label}</span>{tab===id&&<i/>}</Link>)}</div>
   </section>})}</nav>
   <div className="profile"><div className="avatar">{user.name[0]}</div><div><b>{user.name}</b><small>{user.role==="OWNER"?"Владелец":"Сотрудник"}</small></div><form action={logoutAction}><button aria-label="Выйти"><LogOut size={18}/></button></form></div>
  </aside>
 </>;
}

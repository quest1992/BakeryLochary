import type{Metadata}from"next";import"./globals.css";
export const metadata:Metadata={
 title:{default:"Нонвойхонаи Лочари",template:"%s · Нонвойхонаи Лочари"},
 description:"Нонвойхонаи Лочари — система учёта производства, сырья, склада, отгрузок, клиентов и финансов пекарни.",
 applicationName:"Нонвойхонаи Лочари",
 keywords:["Нонвойхонаи Лочари","пекарня","учёт производства","склад","отгрузки"],
 openGraph:{title:"Нонвойхонаи Лочари",description:"Учёт производства, склада, отгрузок и финансов пекарни.",type:"website",locale:"ru_RU"},
 robots:{index:false,follow:false}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}

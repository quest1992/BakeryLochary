import type{Metadata}from"next";import"./globals.css";
export const metadata:Metadata={title:"Учёт Лочари",description:"Простой учёт производства, склада, отгрузок и финансов пекарни"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}

"use client";
import{Printer}from"lucide-react";export default function PrintButton(){return <button className="printButton" onClick={()=>window.print()}><Printer size={17}/>Печать / PDF</button>}
"use client";

export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <html lang="ru"><body><main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"#f7f2eb",fontFamily:"Arial"}}>
  <section style={{maxWidth:520,padding:32,borderRadius:18,background:"#fff",border:"1px solid #e4d2c0",textAlign:"center"}}>
   <h1 style={{fontFamily:"Georgia",color:"#39261c"}}>Приложение временно не ответило</h1>
   <p style={{color:"#786453",lineHeight:1.6}}>Ваши данные сохранены. Попробуйте открыть страницу ещё раз. Если ошибка повторится, сообщите код: {error.digest||"не указан"}.</p>
   <button onClick={reset} style={{padding:"12px 20px",border:0,borderRadius:10,background:"#bd6829",color:"#fff",fontWeight:700}}>Открыть снова</button>
  </section>
 </main></body></html>;
}

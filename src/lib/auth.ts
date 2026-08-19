import{cookies}from"next/headers";import{createHmac,timingSafeEqual}from"crypto";import{db}from"./db";import{assertBusinessWrite}from"./access-control";
const secret=process.env.SESSION_SECRET||"local-secret";
const sign=(v:string)=>createHmac("sha256",secret).update(v).digest("hex");
export async function setSession(id:number){const v=String(id),s=sign(v);(await cookies()).set("lochari_session",v+"."+s,{httpOnly:true,sameSite:"lax",maxAge:60*60*24*14,path:"/"});}
export async function clearSession(){(await cookies()).delete("lochari_session")}
export async function getUser(){const raw=(await cookies()).get("lochari_session")?.value;if(!raw)return null;const[v,s]=raw.split(".");if(!v||!s)return null;const a=Buffer.from(s),b=Buffer.from(sign(v));if(a.length!==b.length||!timingSafeEqual(a,b))return null;return db.user.findUnique({where:{id:Number(v)},select:{id:true,name:true,username:true,role:true}})}
export async function requireUser(){const u=await getUser();if(!u)throw new Error("AUTH");return u}
export async function requireOwner(){const u=await requireUser();if(u.role!=="OWNER")throw new Error("Только для владельца");return u}
export async function requireBusinessWriter(){const u=await requireUser();assertBusinessWrite(u.role);return u}

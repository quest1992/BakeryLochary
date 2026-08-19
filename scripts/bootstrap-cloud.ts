import{PrismaClient,Role}from"@prisma/client";import{hash}from"bcryptjs";
const db=new PrismaClient();
async function main(){
 const count=await db.user.count();
 if(!count){const username=process.env.ADMIN_USERNAME||"owner",password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME||"Владелец";if(!password||password.length<10)throw new Error("ADMIN_PASSWORD должен содержать минимум 10 символов");await db.user.create({data:{name,username,passwordHash:await hash(password,12),role:Role.OWNER}});console.log("Первый владелец создан")}
 const username=process.env.INVESTOR_USERNAME||"investor",password=process.env.INVESTOR_PASSWORD||"investor2026";
 const investor=await db.user.findUnique({where:{username}});
 if(!investor){await db.user.create({data:{name:"Инвестор",username,passwordHash:await hash(password,12),role:Role.INVESTOR}});console.log("Инвестор создан")}
 else if(investor.role!==Role.INVESTOR||!investor.active){await db.user.update({where:{id:investor.id},data:{role:Role.INVESTOR,active:true}});console.log("Доступ инвестора обновлён")}
 const officialStart=new Date(process.env.INVESTMENT_START_DATE||"2026-09-01T00:00:00+05:00"),agreement=await db.investmentAgreement.findUnique({where:{id:1},include:{buybacks:{select:{id:true}}}});
 if(!agreement){await db.investmentAgreement.create({data:{id:1,investorName:"Инвестор",principal:50000,initialShare:40,startedAt:officialStart,note:"Официальный расчёт доли с 01.09.2026"}});console.log("Условия инвестиции созданы")}
 else if(!agreement.buybacks.length&&agreement.note==="Выкуп доли гибкими платежами"){await db.investmentAgreement.update({where:{id:1},data:{startedAt:officialStart,note:"Официальный расчёт доли с 01.09.2026"}});console.log("Дата начала инвестиции обновлена")}
}
main().finally(()=>db.$disconnect());

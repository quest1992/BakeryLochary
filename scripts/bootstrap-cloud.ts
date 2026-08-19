import{PrismaClient,Role}from"@prisma/client";import{hash}from"bcryptjs";
const db=new PrismaClient();
async function main(){
 const count=await db.user.count();
 if(!count){const username=process.env.ADMIN_USERNAME||"owner",password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME||"Владелец";if(!password||password.length<10)throw new Error("ADMIN_PASSWORD должен содержать минимум 10 символов");await db.user.create({data:{name,username,passwordHash:await hash(password,12),role:Role.OWNER}});console.log("Первый владелец создан")}
 const username=process.env.INVESTOR_USERNAME||"investor",password=process.env.INVESTOR_PASSWORD||"investor2026";
 const investor=await db.user.findUnique({where:{username}});
 if(!investor){await db.user.create({data:{name:"Инвестор",username,passwordHash:await hash(password,12),role:Role.INVESTOR}});console.log("Инвестор создан")}
 else if(investor.role!==Role.INVESTOR||!investor.active){await db.user.update({where:{id:investor.id},data:{role:Role.INVESTOR,active:true}});console.log("Доступ инвестора обновлён")}
}
main().finally(()=>db.$disconnect());

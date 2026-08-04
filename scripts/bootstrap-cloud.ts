import{PrismaClient,Role}from"@prisma/client";import{hash}from"bcryptjs";
const db=new PrismaClient();
async function main(){if(await db.user.count())return;const username=process.env.ADMIN_USERNAME||"owner",password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME||"Владелец";if(!password||password.length<10)throw new Error("ADMIN_PASSWORD должен содержать минимум 10 символов");await db.user.create({data:{name,username,passwordHash:await hash(password,12),role:Role.OWNER}});console.log("Первый владелец создан")}
main().finally(()=>db.$disconnect());
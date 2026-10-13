import type {Prisma} from '@prisma/client';
export async function editExpense(tx:Prisma.TransactionClient,input:{id:number;amount:number;category:string;note:string;date:string;original:{amount:number;category:string;note:string|null;spentAt:Date}}){
 const {id,amount,category,note,date,original}=input;
 const spentAt=new Date(date+'T12:00:00+05:00');
 if(!Number.isSafeInteger(id)||id<1||!Number.isFinite(amount)||amount<=0||!category.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(spentAt.getTime())||spentAt.toISOString().slice(0,10)!==date)throw Error('Проверьте дату, категорию и сумму');
 const result=await tx.expense.updateMany({where:{id,...original},data:{amount,category:category.trim(),note,spentAt}});
 if(!result.count)throw Error('Расход уже изменён. Обновите страницу');
}

export function calculateInvestment(principal:number,initialShare:number,buybacks:number[]){
  const repaid=Math.min(principal,buybacks.reduce((sum,value)=>sum+Math.max(0,value),0));
  const remaining=Math.max(0,principal-repaid);
  const currentShare=principal>0?initialShare*(remaining/principal):0;
  return{repaid,remaining,currentShare};
}

export function calculateInvestorEarnings(netProfit:number,currentShare:number,isActive=true){return isActive?Math.max(0,netProfit)*Math.max(0,currentShare)/100:0}

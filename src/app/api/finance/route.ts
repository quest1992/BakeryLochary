import {NextRequest,NextResponse} from "next/server";
import {getUser} from "@/lib/auth";
import {canReadFinancials} from "@/lib/access-control";
import {getInvestorFinance,parseFinancialPeriod} from "@/lib/investor-finance";

export async function GET(request:NextRequest){const user=await getUser();if(!user||!canReadFinancials(user.role))return new NextResponse("Forbidden",{status:403});const data=await getInvestorFinance(parseFinancialPeriod(request.nextUrl.searchParams.get("from")||undefined,request.nextUrl.searchParams.get("to")||undefined));return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}})}
export async function POST(){return new NextResponse("Forbidden",{status:403})}
export async function PUT(){return new NextResponse("Forbidden",{status:403})}
export async function PATCH(){return new NextResponse("Forbidden",{status:403})}
export async function DELETE(){return new NextResponse("Forbidden",{status:403})}

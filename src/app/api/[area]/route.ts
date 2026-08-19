import {NextResponse} from "next/server";
import {getUser} from "@/lib/auth";
import {apiAreaStatus} from "@/lib/access-control";

async function unavailable(_:Request,{params}:{params:Promise<{area:string}>}){
  const user=await getUser(),{area}=await params;
  const status=user?apiAreaStatus(user.role,area):404;
  return new NextResponse(status===403?"Forbidden":"Not Found",{status});
}

export const GET=unavailable;
export const POST=unavailable;
export const PUT=unavailable;
export const PATCH=unavailable;
export const DELETE=unavailable;

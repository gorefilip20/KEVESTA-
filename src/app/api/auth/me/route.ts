import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/request-auth";
export async function GET(request: NextRequest) {
  try { return NextResponse.json({ user: await getRequestUser(request) }); }
  catch { return NextResponse.json({ user: null }); }
}

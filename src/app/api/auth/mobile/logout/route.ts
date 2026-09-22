import { NextRequest, NextResponse } from "next/server";
import { revokeMobileSession } from "@/lib/server/auth";
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]{20,})$/i);
  if (match) await revokeMobileSession(match[1]);
  return NextResponse.json({ success: true });
}

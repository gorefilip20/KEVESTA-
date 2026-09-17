import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, COOKIE, sameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import crypto from "node:crypto";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const token = request.cookies.get(COOKIE)?.value;
  if (token) await query("delete from sessions where token_hash = $1", [crypto.createHash("sha256").update(token).digest("hex")]);
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}

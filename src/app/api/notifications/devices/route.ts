import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, sameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

const platforms = new Set(["ios", "android", "web"]);

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.token !== "string" || body.token.length < 20 || body.token.length > 4096 || typeof body.platform !== "string" || !platforms.has(body.platform)) return NextResponse.json({ error: "A valid push token and platform are required." }, { status: 400 });
  await query("insert into push_devices (user_id, token, platform, enabled, last_seen_at) values ($1, $2, $3, true, now()) on conflict (token) do update set user_id = $1, platform = $3, enabled = true, last_seen_at = now()", [user.id, body.token, body.platform]);
  return NextResponse.json({ registered: true });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.token !== "string") return NextResponse.json({ error: "Token is required." }, { status: 400 });
  await query("update push_devices set enabled = false where user_id = $1 and token = $2", [user.id, body.token]);
  return NextResponse.json({ removed: true });
}

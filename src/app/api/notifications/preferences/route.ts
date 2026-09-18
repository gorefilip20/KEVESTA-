import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, sameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const result = await query("select phone_e164, sms_enabled, push_enabled, booking_updates, refund_updates from notification_preferences where user_id = $1", [user.id]);
  return NextResponse.json({ preferences: result.rows[0] || { phone_e164: null, sms_enabled: false, push_enabled: false, booking_updates: true, refund_updates: true } });
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const phone = body.phone_e164 === null || body.phone_e164 === "" ? null : typeof body.phone_e164 === "string" && /^\+[1-9]\d{7,14}$/.test(body.phone_e164) ? body.phone_e164 : undefined;
  if (phone === undefined) return NextResponse.json({ error: "Use a valid phone number in E.164 format, for example +14155552671." }, { status: 400 });
  const bool = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
  await query("insert into notification_preferences (user_id, phone_e164, sms_enabled, push_enabled, booking_updates, refund_updates) values ($1, $2, $3, $4, $5, $6) on conflict (user_id) do update set phone_e164 = $2, sms_enabled = $3, push_enabled = $4, booking_updates = $5, refund_updates = $6, updated_at = now()", [user.id, phone, bool(body.sms_enabled, false), bool(body.push_enabled, false), bool(body.booking_updates, true), bool(body.refund_updates, true)]);
  return NextResponse.json({ saved: true });
}

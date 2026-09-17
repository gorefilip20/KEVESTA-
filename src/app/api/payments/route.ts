import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createColumnPayment } from "@/lib/payments/column";
import { getCurrentUser, sameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json();
    const intentId = typeof body.intentId === "string" ? body.intentId : "";
    const intentResult = await query<{ id: string; item_title: string; amount_cents: number; currency: string }>("select id, item_title, amount_cents, currency from booking_intents where id = $1 and user_id = $2 and status = 'created' and expires_at > now()", [intentId, user.id]);
    const intent = intentResult.rows[0];
    if (!intent) return NextResponse.json({ error: "Booking intent is missing, expired, or not owned by this account." }, { status: 409 });
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : user.name;
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : user.email;
    if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail)) return NextResponse.json({ error: "A valid name and email are required." }, { status: 400 });
    const payment = await createColumnPayment({ amount: intent.amount_cents / 100, currency: intent.currency, customerName, customerEmail, description: intent.item_title, idempotencyKey: request.headers.get("Idempotency-Key") || crypto.randomUUID() });
    await query("update booking_intents set status = 'payment_pending' where id = $1 and status = 'created'", [intent.id]);
    return NextResponse.json({ success: true, payment, intent: { id: intent.id, amount: intent.amount_cents / 100, currency: intent.currency, title: intent.item_title } }, { status: payment.mode === "setup_required" ? 503 : 200 });
  } catch (error) {
    console.error("Payment initiation failed", error);
    return NextResponse.json({ error: "We could not start this payment. Please try again." }, { status: 503 });
  }
}

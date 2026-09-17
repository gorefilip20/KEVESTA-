import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser, sameOrigin } from "@/lib/server/auth";
import { query, withTransaction } from "@/lib/server/db";
import { sendRefundRequestedEmail } from "@/lib/server/email";
import { requestColumnRefund } from "@/lib/payments/refunds";

type BookingRow = { id: string; user_id: string; user_name: string; user_email: string; item_title: string; status: string; amount_cents: number; currency: string; intent_id: string };
type PaymentRow = { id: string; provider: string; provider_payment_id: string; status: string };
const money = (amount: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
const newReceiptNumber = () => `RF-${Date.now().toString(36).toUpperCase()}`;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  try {
    const result = await query<BookingRow>("select b.id, b.user_id, u.name as user_name, u.email as user_email, b.item_title, b.status, b.amount_cents, b.currency, b.intent_id from bookings b join users u on u.id = b.user_id where b.id = $1 and b.user_id = $2", [id, user.id]);
    const booking = result.rows[0];
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (["cancelled", "refunded", "refund_pending"].includes(booking.status)) return NextResponse.json({ error: "This booking is already being cancelled or refunded." }, { status: 409 });
    if (booking.status !== "paid") {
      await withTransaction(async (client) => { await client.query("update bookings set status = 'cancelled', status_rank = greatest(status_rank, 80), updated_at = now() where id = $1 and user_id = $2 and status not in ('paid', 'refunded', 'refund_pending')", [booking.id, user.id]); await client.query("update booking_intents set status = 'cancelled' where id = $1 and status <> 'paid'", [booking.intent_id]); });
      return NextResponse.json({ status: "cancelled", message: "Your unpaid booking was cancelled." });
    }
    const paymentResult = await query<PaymentRow>("select id, provider, provider_payment_id, status from payments where booking_id = $1 order by created_at desc limit 1", [booking.id]);
    const payment = paymentResult.rows[0];
    if (!payment) return NextResponse.json({ error: "This booking has no refundable payment record." }, { status: 409 });
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : "customer_requested";
    let receiptNumber = newReceiptNumber();
    if (payment.provider === "column") {
      const refund = await requestColumnRefund({ paymentId: payment.provider_payment_id, amountCents: booking.amount_cents, currency: booking.currency, reason, idempotencyKey: `refund-${booking.id}` });
      if (refund.mode === "setup_required") return NextResponse.json({ error: "Bank refunds are not connected for this staging environment." }, { status: 503 });
      await withTransaction(async (client) => { await client.query("insert into refund_requests (booking_id, payment_id, provider, provider_refund_id, status, reason) values ($1, $2, 'column', $3, 'submitted', $4) on conflict (booking_id) do update set updated_at = now()", [booking.id, payment.id, refund.refundId || null, reason]); await client.query("update bookings set status = 'refund_pending', status_rank = greatest(status_rank, 105), updated_at = now() where id = $1", [booking.id]); await client.query("update payments set status = 'refund_pending', status_rank = greatest(status_rank, 105), updated_at = now() where id = $1", [payment.id]); const receipt = await client.query<{ receipt_number: string }>("insert into financial_receipts (id, booking_id, payment_id, refund_request_id, receipt_type, receipt_number, amount_cents, currency, provider_reference) values ($1, $2, $3, (select id from refund_requests where booking_id = $2), 'refund_requested', $4, $5, $6, $7) on conflict (booking_id, receipt_type) do update set receipt_number = financial_receipts.receipt_number returning receipt_number", [crypto.randomUUID(), booking.id, payment.id, receiptNumber, booking.amount_cents, booking.currency, refund.refundId || null]); receiptNumber = receipt.rows[0]?.receipt_number || receiptNumber; });
      await sendRefundRequestedEmail(booking.user_email, booking.user_name, booking.item_title, money(booking.amount_cents, booking.currency), receiptNumber).catch((error) => console.error("Refund request email failed", error));
      return NextResponse.json({ status: "refund_pending", receiptNumber, message: "Your refund request was submitted. We will mark it complete when the bank confirms it." }, { status: 202 });
    }
    await withTransaction(async (client) => { await client.query("insert into refund_requests (booking_id, payment_id, provider, status, reason) values ($1, $2, 'crypto', 'pending', $3) on conflict (booking_id) do update set updated_at = now()", [booking.id, payment.id, reason]); await client.query("update bookings set status = 'refund_pending', status_rank = greatest(status_rank, 105), updated_at = now() where id = $1", [booking.id]); await client.query("update payments set status = 'refund_pending', status_rank = greatest(status_rank, 105), updated_at = now() where id = $1", [payment.id]); const receipt = await client.query<{ receipt_number: string }>("insert into financial_receipts (id, booking_id, payment_id, refund_request_id, receipt_type, receipt_number, amount_cents, currency) values ($1, $2, $3, (select id from refund_requests where booking_id = $2), 'refund_requested', $4, $5, $6) on conflict (booking_id, receipt_type) do update set receipt_number = financial_receipts.receipt_number returning receipt_number", [crypto.randomUUID(), booking.id, payment.id, receiptNumber, booking.amount_cents, booking.currency]); receiptNumber = receipt.rows[0]?.receipt_number || receiptNumber; });
    await sendRefundRequestedEmail(booking.user_email, booking.user_name, booking.item_title, money(booking.amount_cents, booking.currency), receiptNumber).catch((error) => console.error("Refund request email failed", error));
    return NextResponse.json({ status: "refund_pending", receiptNumber, manualRequired: true, message: "Your crypto refund request is recorded for secure manual review. KEVESTA will not send funds without an approved refund destination." }, { status: 202 });
  } catch (error) { console.error("Booking cancellation failed", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Cancellation could not be completed." }, { status: 503 }); }
}

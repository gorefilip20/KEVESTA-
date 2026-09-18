import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/server/db";
import { sendRefundCompletedEmail } from "@/lib/server/email";
import { notifyBookingEvent } from "@/lib/server/notifications";
import { query } from "@/lib/server/db";

type ColumnEvent = { id: string; type?: string; created_at?: string; data?: { id?: string; status?: string; transfer_id?: string; refund_id?: string; [key: string]: unknown } };
type RefundNotification = { userId: string; bookingId: string; email: string; name: string; title: string; amount: string; receiptNumber: string; providerReference: string };
type ReconciliationResult = { duplicate: boolean; matched: boolean; status?: string; refundNotification?: RefundNotification };

const statusFor = (event: ColumnEvent) => {
  const value = `${event.type || ""} ${event.data?.status || ""}`.toLowerCase();
  if (/(refund|refunded)/.test(value)) return { payment: "refunded", booking: "refunded", rank: 110, refund: true } as const;
  if (/(completed|complete|settled|succeeded|success)/.test(value)) return { payment: "paid", booking: "paid", rank: 100, refund: false } as const;
  if (/(failed|rejected|returned|cancelled|canceled)/.test(value)) return { payment: "failed", booking: "failed", rank: 90, refund: false } as const;
  return { payment: "processing", booking: "payment_pending", rank: 20, refund: false } as const;
};

async function claimEvent(client: PoolClient, event: ColumnEvent) {
  const existing = await client.query("select id from provider_events where provider = 'column' and event_id = $1", [event.id]);
  if (existing.rows.length > 0) return false;
  const result = await client.query("insert into provider_events (id, provider, event_id, event_type, payload) values ($1, 'column', $2, $3, $4) on conflict (provider, event_id) do nothing returning id", [crypto.randomUUID(), event.id, event.type || "unknown", JSON.stringify(event)]);
  return result.rows.length === 1;
}

export async function reconcileColumnEvent(event: ColumnEvent): Promise<ReconciliationResult> {
  const result = await withTransaction(async (client): Promise<ReconciliationResult> => {
    if (!(await claimEvent(client, event))) return { duplicate: true, matched: false };
    const mapped = statusFor(event);
    const providerPaymentId = mapped.refund ? (event.data?.transfer_id || event.data?.id) : event.data?.id;
    if (!providerPaymentId) {
      await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
      return { duplicate: false, matched: false };
    }
    const paymentResult = await client.query<{ id: string; booking_id: string; status_rank: number }>("select id, booking_id, status_rank from payments where provider = 'column' and provider_payment_id = $1 for update", [providerPaymentId]);
    const payment = paymentResult.rows[0];
    if (!payment) {
      await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
      return { duplicate: false, matched: false, status: mapped.payment };
    }
    let refundNotification: RefundNotification | undefined;
    if (mapped.refund) {
      const details = await client.query<{ user_id: string; email: string; name: string; item_title: string; amount_cents: number; currency: string; refund_request_id: string | null; receipt_number: string | null }>("select b.user_id, u.email, u.name, b.item_title, b.amount_cents, b.currency, rr.id as refund_request_id, fr.receipt_number from bookings b join users u on u.id = b.user_id left join refund_requests rr on rr.booking_id = b.id left join financial_receipts fr on fr.booking_id = b.id and fr.receipt_type = 'refund_completed' where b.id = $1", [payment.booking_id]);
      const booking = details.rows[0];
      const providerReference = event.data?.refund_id || event.data?.id || providerPaymentId;
      if (booking) {
        await client.query("update refund_requests set status = 'succeeded', provider_refund_id = coalesce(provider_refund_id, $1), updated_at = now() where booking_id = $2", [providerReference, payment.booking_id]);
        const receiptNumber = booking.receipt_number || `RF-${Date.now().toString(36).toUpperCase()}`;
        const receipt = await client.query<{ receipt_number: string }>("insert into financial_receipts (id, booking_id, payment_id, refund_request_id, receipt_type, receipt_number, amount_cents, currency, provider_reference) values ($1, $2, $3, (select id from refund_requests where booking_id = $2), 'refund_completed', $4, $5, $6, $7) on conflict (booking_id, receipt_type) do update set receipt_number = financial_receipts.receipt_number returning receipt_number", [crypto.randomUUID(), payment.booking_id, payment.id, receiptNumber, booking.amount_cents, booking.currency, providerReference]);
        refundNotification = { userId: booking.user_id, bookingId: payment.booking_id, email: booking.email, name: booking.name, title: booking.item_title, amount: new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(booking.amount_cents / 100), receiptNumber: receipt.rows[0]?.receipt_number || receiptNumber, providerReference };
      }
    }
    if (mapped.rank >= payment.status_rank) {
      await client.query("update payments set status = $1, status_rank = $2, updated_at = now() where id = $3", [mapped.payment, mapped.rank, payment.id]);
      await client.query("update bookings set status = $1, status_rank = $2, updated_at = now() where id = $3 and status_rank <= $2", [mapped.booking, mapped.rank, payment.booking_id]);
      await client.query("update booking_intents set status = case when $1 = 'paid' then 'paid' when $1 = 'failed' then 'cancelled' else 'payment_pending' end where id = (select intent_id from bookings where id = $2) and status <> 'paid'", [mapped.booking, payment.booking_id]);
    }
    await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
    return { duplicate: false, matched: true, status: mapped.payment, refundNotification };
  });
  if (result.refundNotification) {
    const notification = result.refundNotification;
    await sendRefundCompletedEmail(notification.email, notification.name, notification.title, notification.amount, notification.receiptNumber, notification.providerReference).catch((error) => console.error("Refund completion email failed", error));
    await notifyBookingEvent({ userId: notification.userId, bookingId: notification.bookingId, eventType: "refund_completed", title: "Refund complete", body: `${notification.title} · ${notification.amount} has been confirmed by the provider.` }).catch((error) => console.error("Refund completion notification failed", error));
  }
  if (result.matched && (result.status === "paid" || result.status === "failed") && event.data?.id) {
    const details = await query<{ user_id: string; booking_id: string; item_title: string; amount_cents: number; currency: string }>("select b.user_id, b.id as booking_id, b.item_title, b.amount_cents, b.currency from payments p join bookings b on b.id = p.booking_id where p.provider = 'column' and p.provider_payment_id = $1", [event.data.id]);
    const booking = details.rows[0];
    if (booking) await notifyBookingEvent({ userId: booking.user_id, bookingId: booking.booking_id, eventType: result.status === "paid" ? "booking_paid" : "booking_failed", title: result.status === "paid" ? "Booking confirmed" : "Payment needs attention", body: `${booking.item_title} · ${new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(booking.amount_cents / 100)}.` }).catch((error) => console.error("Booking status notification failed", error));
  }
  return result;
}

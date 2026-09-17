import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/server/db";

type ColumnEvent = { id: string; type?: string; created_at?: string; data?: { id?: string; status?: string; [key: string]: unknown } };
type ReconciliationResult = { duplicate: boolean; matched: boolean; status?: string };

const statusFor = (event: ColumnEvent) => {
  const value = `${event.type || ""} ${event.data?.status || ""}`.toLowerCase();
  if (/(refund|refunded)/.test(value)) return { payment: "refunded", booking: "refunded", rank: 110 } as const;
  if (/(completed|complete|settled|succeeded|success)/.test(value)) return { payment: "paid", booking: "paid", rank: 100 } as const;
  if (/(failed|rejected|returned|cancelled|canceled)/.test(value)) return { payment: "failed", booking: "failed", rank: 90 } as const;
  return { payment: "processing", booking: "payment_pending", rank: 20 } as const;
};

async function claimEvent(client: PoolClient, event: ColumnEvent) {
  const result = await client.query("insert into provider_events (provider, event_id, event_type, payload) values ('column', $1, $2, $3) on conflict (provider, event_id) do nothing returning id", [event.id, event.type || "unknown", JSON.stringify(event)]);
  return result.rowCount === 1;
}

export async function reconcileColumnEvent(event: ColumnEvent): Promise<ReconciliationResult> {
  return withTransaction(async (client) => {
    if (!(await claimEvent(client, event))) return { duplicate: true, matched: false };
    const providerPaymentId = event.data?.id;
    if (!providerPaymentId) {
      await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
      return { duplicate: false, matched: false };
    }
    const mapped = statusFor(event);
    const paymentResult = await client.query<{ booking_id: string; status_rank: number }>("select booking_id, status_rank from payments where provider = 'column' and provider_payment_id = $1 for update", [providerPaymentId]);
    const payment = paymentResult.rows[0];
    if (!payment) {
      await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
      return { duplicate: false, matched: false, status: mapped.payment };
    }
    if (mapped.rank >= payment.status_rank) {
      await client.query("update payments set status = $1, status_rank = $2, metadata = metadata || $3::jsonb, updated_at = now() where provider = 'column' and provider_payment_id = $4", [mapped.payment, mapped.rank, JSON.stringify({ lastEventId: event.id, lastEventType: event.type || "unknown" }), providerPaymentId]);
      await client.query("update bookings set status = $1, status_rank = $2, updated_at = now() where id = $3 and status_rank <= $2", [mapped.booking, mapped.rank, payment.booking_id]);
      await client.query("update booking_intents set status = case when $1 = 'paid' then 'paid' when $1 = 'failed' then 'cancelled' else 'payment_pending' end where id = (select intent_id from bookings where id = $2) and status <> 'paid'", [mapped.booking, payment.booking_id]);
    }
    await client.query("update provider_events set processed_at = now() where provider = 'column' and event_id = $1", [event.id]);
    return { duplicate: false, matched: true, status: mapped.payment };
  });
}

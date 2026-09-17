export async function requestColumnRefund(input: { paymentId: string; amountCents: number; currency: string; reason: string; idempotencyKey: string }) {
  const base = (process.env.COLUMN_API_BASE || "https://api.column.com").replace(/\/$/, "");
  const path = process.env.COLUMN_REFUND_PATH;
  if (!process.env.COLUMN_API_KEY || !path) return { mode: "setup_required" as const };
  const response = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, { method: "POST", headers: { Authorization: `Bearer ${process.env.COLUMN_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey }, body: JSON.stringify({ transfer_id: input.paymentId, amount: input.amountCents, currency: input.currency, reason: input.reason }), cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `Column refund request failed with HTTP ${response.status}`);
  return { mode: "submitted" as const, refundId: typeof payload?.id === "string" ? payload.id : undefined, provider: payload };
}

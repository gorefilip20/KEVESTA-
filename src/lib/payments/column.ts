import crypto from "node:crypto";

export type PaymentStatus = "pending" | "processing" | "confirmed" | "failed";

export function isColumnConfigured() {
  return Boolean(process.env.COLUMN_API_KEY && process.env.COLUMN_RECEIVING_ACCOUNT_ID);
}

export function createPaymentId() {
  return `KV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export function verifyColumnSignature(rawBody: string, signature: string | null) {
  const secret = process.env.COLUMN_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.replace(/^sha256=/, "");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function createColumnPayment(input: {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  description: string;
  idempotencyKey: string;
}) {
  if (!isColumnConfigured()) {
    return {
      mode: "setup_required" as const,
      status: "pending" as const,
      paymentId: createPaymentId(),
      message: "Column is not connected yet. Add the server-side Column credentials to enable bank payments.",
    };
  }

  const base = (process.env.COLUMN_API_BASE || "https://api.column.com").replace(/\/$/, "");
  const path = process.env.COLUMN_ACH_TRANSFER_PATH || "/v1/ach/transfers";
  const response = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.COLUMN_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receiving_account_id: process.env.COLUMN_RECEIVING_ACCOUNT_ID,
      customer: { name: input.customerName, email: input.customerEmail },
      description: input.description.slice(0, 200),
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.message === "string" ? payload.message : `Column returned HTTP ${response.status}`);
  }

  return {
    mode: "column" as const,
    status: (payload.status || "processing") as PaymentStatus,
    paymentId: payload.id || createPaymentId(),
    provider: payload,
  };
}

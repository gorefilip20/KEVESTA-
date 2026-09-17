import { NextRequest, NextResponse } from "next/server";
import { verifyColumnSignature } from "@/lib/payments/column";
import { recordPaymentMetric } from "@/lib/monitoring";
import { reconcileColumnEvent } from "@/lib/payments/reconciliation";

type ColumnEvent = { id?: string; type?: string; created_at?: string; data?: { id?: string; status?: string; [key: string]: unknown } };

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("Column-Signature");
  if (!verifyColumnSignature(rawBody, signature)) {
    recordPaymentMetric("column_webhook_invalid");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }
  try {
    const event = JSON.parse(rawBody) as ColumnEvent;
    if (!event.id || typeof event.id !== "string") return NextResponse.json({ error: "Webhook event ID is required" }, { status: 400 });
    const result = await reconcileColumnEvent({ id: event.id, type: event.type, created_at: event.created_at, data: event.data });
    if (result.duplicate) {
      recordPaymentMetric("column_webhook_duplicate", { eventId: event.id });
      return NextResponse.json({ received: true, duplicate: true });
    }
    recordPaymentMetric("column_webhook_received", { eventId: event.id, type: event.type || "unknown" });
    return NextResponse.json({ received: true, matched: result.matched, status: result.status });
  } catch (error) {
    console.error("Column webhook reconciliation failed", error);
    return NextResponse.json({ error: "Webhook processing unavailable" }, { status: 503 });
  }
}

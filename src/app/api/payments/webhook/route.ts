import { NextRequest, NextResponse } from "next/server";
import { claimWebhookEvent, verifyColumnSignature } from "@/lib/payments/column";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("Column-Signature");

  if (!verifyColumnSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { id?: string; type?: string; data?: unknown };
    if (!event.id || typeof event.id !== "string") {
      return NextResponse.json({ error: "Webhook event ID is required" }, { status: 400 });
    }
    if (!claimWebhookEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.info("Column payment event received", {
      id: event.id,
      type: event.type,
      receivedAt: new Date().toISOString(),
    });
    // Persist event.id with a unique constraint before mutating a booking.
    // Column may deliver events out of order, so booking transitions must be monotonic.
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}

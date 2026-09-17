import { NextRequest, NextResponse } from "next/server";
import { verifyColumnSignature } from "@/lib/payments/column";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-column-signature") || request.headers.get("x-webhook-signature");

  if (!verifyColumnSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { id?: string; type?: string; data?: unknown };
    console.info("Column payment event received", {
      id: event.id,
      type: event.type,
      receivedAt: new Date().toISOString(),
    });
    // Persist event + update booking status here once a database is connected.
    // Signature verification and idempotent event handling belong at this boundary.
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}

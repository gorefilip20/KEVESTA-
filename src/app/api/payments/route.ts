import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createColumnPayment } from "@/lib/payments/column";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "Kevesta booking";

    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
      return NextResponse.json({ error: "Amount must be between $1 and $100,000." }, { status: 400 });
    }
    if (!customerName || !customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return NextResponse.json({ error: "A valid name and email are required." }, { status: 400 });
    }

    const idempotencyKey = request.headers.get("Idempotency-Key") || crypto.randomUUID();
    const payment = await createColumnPayment({
      amount,
      currency: "USD",
      customerName,
      customerEmail,
      description,
      idempotencyKey,
    });

    return NextResponse.json({ success: true, payment }, { status: payment.mode === "setup_required" ? 503 : 200 });
  } catch (error) {
    console.error("Payment initiation failed", error);
    return NextResponse.json({ error: "We could not start this payment. Please try again." }, { status: 502 });
  }
}

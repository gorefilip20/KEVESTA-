import { NextRequest, NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/payments/crypto-quotes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const quote = typeof body.quoteId === "string" ? verifyQuoteToken(body.quoteId) : null;
    const txHash = typeof body.txHash === "string" ? body.txHash : "";
    if (!quote || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "Quote expired or transaction reference is invalid." }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: "pending_verification", quote, txHash });
  } catch {
    return NextResponse.json({ error: "Invalid crypto payment confirmation." }, { status: 400 });
  }
}

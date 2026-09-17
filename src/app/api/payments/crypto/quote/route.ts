import { NextRequest, NextResponse } from "next/server";
import { createCryptoQuote, type QuoteCurrency } from "@/lib/payments/crypto-quotes";

const currencies = new Set<QuoteCurrency>(["ETH", "USDC", "USDT"]);

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount"));
  const currency = request.nextUrl.searchParams.get("currency") as QuoteCurrency;
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000 || !currencies.has(currency)) {
    return NextResponse.json({ error: "A valid amount and supported currency are required." }, { status: 400 });
  }
  try {
    const quote = await createCryptoQuote(amount, currency);
    return NextResponse.json({ success: true, quote }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Crypto quote failed", error);
    return NextResponse.json({ error: "Live crypto pricing is temporarily unavailable." }, { status: 502 });
  }
}

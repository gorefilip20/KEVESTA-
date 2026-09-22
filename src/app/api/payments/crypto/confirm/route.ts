import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { verifyQuoteToken } from "@/lib/payments/crypto-quotes";
import { verifyCryptoSettlement } from "@/lib/payments/crypto-verification";
import { recordPaymentMetric } from "@/lib/monitoring";
import { sameOrigin } from "@/lib/server/auth";
import { getRequestUser } from "@/lib/server/request-auth";
import { query, withTransaction } from "@/lib/server/db";
import { syncConfirmedBooking } from "@/lib/server/calendar";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json();
    const quote = typeof body.quoteId === "string" ? verifyQuoteToken(body.quoteId) : null;
    const txHash = typeof body.txHash === "string" ? body.txHash : "";
    const walletAddress = typeof body.walletAddress === "string" && isAddress(body.walletAddress) ? body.walletAddress : "";
    const intentId = typeof body.intentId === "string" ? body.intentId : "";
    if (!quote || !/^0x[a-fA-F0-9]{64}$/.test(txHash) || !walletAddress || !intentId) {
      recordPaymentMetric("crypto_quote_expired");
      return NextResponse.json({ error: "Quote expired or crypto payment details are invalid." }, { status: 400 });
    }
    const intentResult = await query<{ id: string; item_type: string; item_id: string; item_title: string; amount_cents: number; currency: string }>("select id, item_type, item_id, item_title, amount_cents, currency from booking_intents where id = $1 and user_id = $2 and status = 'created' and expires_at > now()", [intentId, user.id]);
    const intent = intentResult.rows[0];
    if (!intent || intent.currency !== quote.fiatCurrency || intent.amount_cents !== Math.round(quote.fiatAmount * 100)) return NextResponse.json({ error: "Booking intent does not match the locked quote." }, { status: 409 });

    const settlement = await verifyCryptoSettlement({ txHash: txHash as `0x${string}`, currency: quote.currency, cryptoAmount: quote.cryptoAmount, walletAddress });
    let bookingId = "";
    await withTransaction(async (client) => {
      const bookingResult = await client.query<{ id: string }>("insert into bookings (user_id, intent_id, item_type, item_id, item_title, amount_cents, currency, status, status_rank) values ($1, $2, $3, $4, $5, $6, $7, 'paid', 100) on conflict (intent_id) do update set status = case when bookings.status_rank <= 100 then 'paid' else bookings.status end, status_rank = greatest(bookings.status_rank, 100), updated_at = now() returning id", [user.id, intent.id, intent.item_type, intent.item_id, intent.item_title, intent.amount_cents, intent.currency]);
      bookingId = bookingResult.rows[0].id;
      await client.query("insert into payments (booking_id, provider, provider_payment_id, amount_cents, currency, status, status_rank, metadata) values ($1, 'crypto', $2, $3, $4, 'paid', 100, $5)", [bookingResult.rows[0].id, txHash, intent.amount_cents, intent.currency, JSON.stringify({ walletAddress, cryptoCurrency: quote.currency, cryptoAmount: quote.cryptoAmount, chainId: settlement.chainId, tokenAddress: settlement.tokenAddress })]);
      await client.query("update booking_intents set status = 'paid' where id = $1 and status <> 'paid'", [intent.id]);
    });
    await syncConfirmedBooking(user.id, bookingId).catch((error) => console.error("Calendar sync failed", error));
    return NextResponse.json({ success: true, status: "paid", txHash, chainId: settlement.chainId });
  } catch (error) {
    console.error("Crypto settlement verification failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Crypto settlement could not be verified." }, { status: 409 });
  }
}

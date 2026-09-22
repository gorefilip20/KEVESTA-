import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/request-auth";
import { query } from "@/lib/server/db";
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const result = await query<{ id: string; item_type: string; item_id: string; item_title: string; amount_cents: number; currency: string; status: string; created_at: string; updated_at: string }>("select id, item_type, item_id, item_title, amount_cents, currency, status, created_at, updated_at from bookings where user_id = $1 order by updated_at desc", [user.id]);
  const bookings = await Promise.all(result.rows.map(async (booking) => {
    const payment = await query<{ provider: string; provider_payment_id: string; status: string }>("select provider, provider_payment_id, status from payments where booking_id = $1 order by created_at desc limit 1", [booking.id]);
    return { ...booking, amount: booking.amount_cents / 100, provider: payment.rows[0]?.provider || null, provider_payment_id: payment.rows[0]?.provider_payment_id || null, payment_status: payment.rows[0]?.status || null };
  }));
  return NextResponse.json({ bookings });
}

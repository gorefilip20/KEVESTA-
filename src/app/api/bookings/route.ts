import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const result = await query<{ id: string; item_type: string; item_id: string; item_title: string; amount_cents: number; currency: string; status: string; created_at: string; updated_at: string; provider: string | null; provider_payment_id: string | null; payment_status: string | null }>("select b.id, b.item_type, b.item_id, b.item_title, b.amount_cents, b.currency, b.status, b.created_at, b.updated_at, p.provider, p.provider_payment_id, p.status as payment_status from bookings b left join lateral (select provider, provider_payment_id, status from payments where booking_id = b.id order by created_at desc limit 1) p on true where b.user_id = $1 order by b.updated_at desc", [user.id]);
  return NextResponse.json({ bookings: result.rows.map((booking) => ({ ...booking, amount: booking.amount_cents / 100 })) });
}

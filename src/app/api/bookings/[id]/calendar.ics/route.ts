import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

const escape = (value: string) => value.replace(/[\\,;\n]/g, (character) => character === "\\" ? "\\\\" : character === "\n" ? "\\n" : `\\${character}`);
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const booking = (await query<{ item_title: string; created_at: string; status: string }>("select item_title, created_at, status from bookings where id = $1 and user_id = $2", [id, user.id])).rows[0];
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "paid") return NextResponse.json({ error: "Only confirmed bookings can be added to a calendar." }, { status: 409 });
  const start = new Date(booking.created_at); const end = new Date(start.getTime() + 3600000); const stamp = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KEVESTA//Booking//EN", "BEGIN:VEVENT", `UID:kevesta-${id}@kevesta`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, `DTEND:${end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`, `SUMMARY:${escape(`KEVESTA · ${booking.item_title}`)}`, "DESCRIPTION:Confirmed through KEVESTA", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  return new NextResponse(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="kevesta-booking-${id}.ics"`, "Cache-Control": "private, no-store" } });
}

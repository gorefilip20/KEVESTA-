import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/server/auth";
import { getRequestUser } from "@/lib/server/request-auth";
import { query } from "@/lib/server/db";
import { getApartmentById } from "@/data/apartments";
import { searchFlights } from "@/data/flights";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json();
    const itemType = body.itemType as "apartment" | "flight" | "service";
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    let title = "";
    let amount = 0;
    let metadata: Record<string, unknown> = {};

    if (itemType === "apartment") {
      const apartment = getApartmentById(itemId);
      if (!apartment) return NextResponse.json({ error: "Accommodation not found" }, { status: 404 });
      title = apartment.title;
      amount = Math.round(apartment.price * 1.05);
      metadata = { city: apartment.city, priceUnit: apartment.priceUnit };
    } else if (itemType === "flight") {
      const origin = typeof body.origin === "string" ? body.origin : "";
      const destination = typeof body.destination === "string" ? body.destination : "";
      const departDate = typeof body.departDate === "string" ? body.departDate : "";
      const cabinClass = typeof body.cabinClass === "string" ? body.cabinClass : "economy";
      const passengers = Number(body.passengers || 1);
      const flight = searchFlights(origin, destination, departDate, cabinClass, passengers).find((candidate) => candidate.id === itemId);
      if (!flight) return NextResponse.json({ error: "Flight quote is invalid or expired" }, { status: 409 });
      title = `${flight.airline} ${flight.flightNumber}: ${flight.origin.code} → ${flight.destination.code}`;
      amount = flight.price + Math.max(0, Number(body.seatPrice || 0));
      metadata = { origin, destination, departDate, cabinClass, passengers, seatPrice: Math.max(0, Number(body.seatPrice || 0)) };
    } else {
      return NextResponse.json({ error: "Unsupported booking type" }, { status: 400 });
    }

    const result = await query<{ id: string; expires_at: string }>("insert into booking_intents (user_id, item_type, item_id, item_title, amount_cents, currency, expires_at, metadata) values ($1, $2, $3, $4, $5, 'USD', now() + interval '15 minutes', $6) returning id, expires_at", [user.id, itemType, itemId, title, Math.round(amount * 100), JSON.stringify(metadata)]);
    return NextResponse.json({ intent: { id: result.rows[0].id, itemType, itemId, title, amount, currency: "USD", expiresAt: result.rows[0].expires_at } }, { status: 201 });
  } catch (error) {
    console.error("Booking intent creation failed", error);
    return NextResponse.json({ error: "Booking intent service is unavailable." }, { status: 503 });
  }
}

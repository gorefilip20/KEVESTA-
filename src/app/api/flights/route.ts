import { NextRequest, NextResponse } from "next/server";
import { fetchFlights, getAirportSuggestions, airports } from "@/lib/api/flights-client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "suggestions") {
    const query = searchParams.get("q") || "";
    return NextResponse.json({ airports: getAirportSuggestions(query) });
  }

  if (action === "airports") {
    return NextResponse.json({ airports });
  }

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departDate = searchParams.get("departDate") || "";
  const cabinClass = searchParams.get("cabinClass") || "economy";
  const passengers = Number(searchParams.get("passengers") || 1);

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: "origin, destination, and departDate are required" },
      { status: 400 }
    );
  }

  const { flights, source } = await fetchFlights(
    origin,
    destination,
    departDate,
    cabinClass,
    passengers
  );

  return NextResponse.json({
    flights,
    count: flights.length,
    source,
  });
}

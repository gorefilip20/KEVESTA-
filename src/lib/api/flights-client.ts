import { searchFlights as mockSearchFlights, getAirportSuggestions, airports } from "@/data/flights";
import type { FlightResult, Airport } from "@/types";

const AMADEUS_BASE = "https://api.amadeus.com";

interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AmadeusFlightOffer {
  id: string;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
      aircraft: { code: string };
      operating?: { carrierCode: string };
    }>;
  }>;
  price: {
    grandTotal: string;
    currency: string;
  };
  numberOfBookableSeats?: number;
  travelerPricings: Array<{
    fareDetailsBySegment: Array<{
      cabin: string;
      includedCheckedBags?: { weight?: number; weightUnit?: string; quantity?: number };
    }>;
  }>;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;

  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;

  const data: AmadeusTokenResponse = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

function parseAmadeusDuration(iso: string): string {
  const match = iso.match(/PT(\d+)H(\d+)?M?/);
  if (!match) return iso;
  const h = match[1] || "0";
  const m = match[2] || "0";
  return `${h}h ${m}m`;
}

function mapAmadeusToResult(offer: AmadeusFlightOffer, originAirport: Airport, destAirport: Airport): FlightResult {
  const itin = offer.itineraries[0];
  const firstSeg = itin.segments[0];
  const lastSeg = itin.segments[itin.segments.length - 1];
  const stops = itin.segments.length - 1;
  const stopCities = itin.segments.slice(0, -1).map((s) => s.arrival.iataCode);

  const fareDetail = offer.travelerPricings[0]?.fareDetailsBySegment[0];
  const cabin = fareDetail?.cabin || "ECONOMY";
  const bags = fareDetail?.includedCheckedBags;
  const baggageStr = bags?.weight
    ? `${bags.quantity || 1}x${bags.weight}${bags.weightUnit || "kg"}`
    : cabin === "ECONOMY" ? "1x23kg" : "2x32kg";

  return {
    id: `AMR-${offer.id}`,
    airline: firstSeg.carrierCode,
    airlineLogo: firstSeg.carrierCode,
    flightNumber: `${firstSeg.carrierCode}${firstSeg.number}`,
    origin: originAirport,
    destination: destAirport,
    departureTime: new Date(firstSeg.departure.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    arrivalTime: new Date(lastSeg.arrival.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    duration: parseAmadeusDuration(itin.duration),
    stops,
    stopCities,
    price: Math.round(parseFloat(offer.price.grandTotal)),
    currency: offer.price.currency,
    cabinClass: cabin.toLowerCase().replace("_", " "),
    seatsLeft: offer.numberOfBookableSeats,
    baggage: baggageStr,
    aircraft: firstSeg.aircraft?.code,
  };
}

export async function fetchFlights(
  origin: string,
  destination: string,
  departDate: string,
  cabinClass: string,
  passengers: number
): Promise<{ flights: FlightResult[]; source: "live" | "mock" }> {
  const token = await getAmadeusToken();

  if (!token) {
    return {
      flights: mockSearchFlights(origin, destination, departDate, cabinClass, passengers),
      source: "mock",
    };
  }

  try {
    const cabinMap: Record<string, string> = {
      economy: "ECONOMY",
      premium_economy: "PREMIUM_ECONOMY",
      business: "BUSINESS",
      first: "FIRST",
    };

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate,
      adults: String(passengers),
      travelClass: cabinMap[cabinClass] || "ECONOMY",
      max: "10",
      currencyCode: "USD",
    });

    const res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Amadeus API ${res.status}`);
    }

    const data = await res.json();
    const offers: AmadeusFlightOffer[] = data.data || [];

    const originAirport = airports.find((a) => a.code === origin) || { code: origin, name: origin, city: origin, country: "" };
    const destAirport = airports.find((a) => a.code === destination) || { code: destination, name: destination, city: destination, country: "" };

    return {
      flights: offers.map((o) => mapAmadeusToResult(o, originAirport, destAirport)).sort((a, b) => a.price - b.price),
      source: "live",
    };
  } catch {
    return {
      flights: mockSearchFlights(origin, destination, departDate, cabinClass, passengers),
      source: "mock",
    };
  }
}

export { getAirportSuggestions, airports };

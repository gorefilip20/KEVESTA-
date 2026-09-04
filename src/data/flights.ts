import type { Airport, FlightResult } from "@/types";

export const airports: Airport[] = [
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "US" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "US" },
  { code: "ORD", name: "O'Hare International", city: "Chicago", country: "US" },
  { code: "LHR", name: "Heathrow", city: "London", country: "GB" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "DE" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "JP" },
  { code: "HND", name: "Haneda", city: "Tokyo", country: "JP" },
  { code: "SIN", name: "Changi", city: "Singapore", country: "SG" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
  { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "AU" },
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "CA" },
  { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "NL" },
  { code: "ICN", name: "Incheon International", city: "Seoul", country: "KR" },
  { code: "GRU", name: "Guarulhos", city: "Sao Paulo", country: "BR" },
  { code: "MEX", name: "Benito Juarez", city: "Mexico City", country: "MX" },
  { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "IN" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
  { code: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "NG" },
  { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "ZA" },
  { code: "MAD", name: "Adolfo Suarez Madrid-Barajas", city: "Madrid", country: "ES" },
  { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "SE" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "CH" },
];

const airlines = [
  { name: "Emirates", logo: "EK" },
  { name: "Singapore Airlines", logo: "SQ" },
  { name: "British Airways", logo: "BA" },
  { name: "Lufthansa", logo: "LH" },
  { name: "Delta", logo: "DL" },
  { name: "United Airlines", logo: "UA" },
  { name: "Air France", logo: "AF" },
  { name: "KLM", logo: "KL" },
  { name: "Qatar Airways", logo: "QR" },
  { name: "ANA", logo: "NH" },
  { name: "Qantas", logo: "QF" },
  { name: "Turkish Airlines", logo: "TK" },
];

export function searchFlights(
  origin: string,
  destination: string,
  departDate: string,
  cabinClass: string,
  passengers: number
): FlightResult[] {
  const originAirport = airports.find((a) => a.code === origin);
  const destAirport = airports.find((a) => a.code === destination);

  if (!originAirport || !destAirport) return [];

  const seed = (origin + destination + departDate).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280;

  const numResults = 4 + Math.floor(rng(0) * 5);
  const results: FlightResult[] = [];

  for (let i = 0; i < numResults; i++) {
    const airline = airlines[Math.floor(rng(i + 1) * airlines.length)];
    const stops = rng(i + 2) > 0.6 ? 0 : rng(i + 3) > 0.4 ? 1 : 2;
    const baseDurationHrs = 2 + Math.floor(rng(i + 4) * 14);
    const durationMins = baseDurationHrs * 60 + Math.floor(rng(i + 5) * 55);
    const departHour = 5 + Math.floor(rng(i + 6) * 17);
    const departMin = Math.floor(rng(i + 7) * 4) * 15;
    const arriveTotal = departHour * 60 + departMin + durationMins;
    const arriveHour = arriveTotal % (24 * 60);

    const classMultiplier = cabinClass === "business" ? 3.2 : cabinClass === "premium_economy" ? 1.8 : cabinClass === "first" ? 5.5 : 1;
    const basePrice = 180 + Math.floor(rng(i + 8) * 600);
    const price = Math.round(basePrice * classMultiplier * passengers);

    const stopCities: string[] = [];
    if (stops > 0) {
      const transitAirports = airports.filter((a) => a.code !== origin && a.code !== destination);
      for (let s = 0; s < stops; s++) {
        const ta = transitAirports[Math.floor(rng(i + 10 + s) * transitAirports.length)];
        if (ta) stopCities.push(ta.city);
      }
    }

    results.push({
      id: `FL-${origin}${destination}-${i}-${seed}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber: `${airline.logo}${100 + Math.floor(rng(i + 9) * 900)}`,
      origin: originAirport,
      destination: destAirport,
      departureTime: `${String(departHour).padStart(2, "0")}:${String(departMin).padStart(2, "0")}`,
      arrivalTime: `${String(Math.floor(arriveHour / 60)).padStart(2, "0")}:${String(arriveHour % 60).padStart(2, "0")}`,
      duration: `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
      stops,
      stopCities,
      price,
      currency: "USD",
      cabinClass: cabinClass.replace("_", " "),
      seatsLeft: stops === 0 ? 2 + Math.floor(rng(i + 11) * 6) : undefined,
      baggage: cabinClass === "economy" ? "1x23kg" : "2x32kg",
      aircraft: ["Boeing 787", "Airbus A350", "Boeing 777", "Airbus A380"][Math.floor(rng(i + 12) * 4)],
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

export function getAirportSuggestions(query: string): Airport[] {
  const q = query.toLowerCase();
  return airports
    .filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    )
    .slice(0, 6);
}

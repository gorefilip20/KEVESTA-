"use client";

import { useState } from "react";
import {
  Plane,
  Search,
  ArrowRightLeft,
  Clock,
  Luggage,
  ChevronDown,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { airports, searchFlights, getAirportSuggestions } from "@/data/flights";
import type { Airport, FlightResult } from "@/types";

export default function FlightsPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [selectedDest, setSelectedDest] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("round_trip");
  const [results, setResults] = useState<FlightResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Airport[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "stops">("price");
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);

  function handleOriginInput(val: string) {
    setOrigin(val);
    setSelectedOrigin(null);
    if (val.length >= 2) {
      setOriginSuggestions(getAirportSuggestions(val));
      setShowOriginDropdown(true);
    } else {
      setShowOriginDropdown(false);
    }
  }

  function handleDestInput(val: string) {
    setDestination(val);
    setSelectedDest(null);
    if (val.length >= 2) {
      setDestSuggestions(getAirportSuggestions(val));
      setShowDestDropdown(true);
    } else {
      setShowDestDropdown(false);
    }
  }

  function selectOrigin(a: Airport) {
    setSelectedOrigin(a);
    setOrigin(`${a.city} (${a.code})`);
    setShowOriginDropdown(false);
  }

  function selectDest(a: Airport) {
    setSelectedDest(a);
    setDestination(`${a.city} (${a.code})`);
    setShowDestDropdown(false);
  }

  function swapAirports() {
    const tmpOrigin = selectedOrigin;
    const tmpOriginText = origin;
    setSelectedOrigin(selectedDest);
    setOrigin(destination);
    setSelectedDest(tmpOrigin);
    setDestination(tmpOriginText);
  }

  function handleSearch() {
    if (!selectedOrigin || !selectedDest || !departDate) return;
    const flightResults = searchFlights(
      selectedOrigin.code,
      selectedDest.code,
      departDate,
      cabinClass,
      passengers
    );
    setResults(flightResults);
    setSearched(true);
    setSelectedFlight(null);
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "stops") return a.stops - b.stops;
    const durA = parseInt(a.duration);
    const durB = parseInt(b.duration);
    return durA - durB;
  });

  const cabinOptions = [
    { value: "economy", label: "Economy" },
    { value: "premium_economy", label: "Premium Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
  ];

  const bookingSteps = ["Search", "Results", "Seat map", "Passenger", "Payment", "Boarding"];

  return (
    <AppShell title="Flights">
      <div className="p-6 space-y-6">
        <div className="mx-auto max-w-5xl overflow-x-auto rounded-2xl border px-4 py-3" style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border-light)" }}>
          <div className="flex min-w-[620px] items-center justify-between gap-3">
            {bookingSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: index === 0 ? "#2F72E8" : "var(--kv-bg-tertiary)", color: index === 0 ? "#fff" : "var(--kv-text-tertiary)" }}>
                  {index + 1}
                </span>
                <span className="whitespace-nowrap text-xs font-semibold" style={{ color: index === 0 ? "#2F72E8" : "var(--kv-text-tertiary)" }}>{step}</span>
                {index < bookingSteps.length - 1 && <span className="mx-1 h-px w-8" style={{ background: "var(--kv-border)" }} />}
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative overflow-hidden rounded-2xl border p-6 shadow-sm"
          style={{
            background: "#EEF3FB",
            borderColor: "#D9E3F4",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-70" aria-hidden="true" style={{ background: "radial-gradient(circle, rgba(47,114,232,0.16) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="h-5 w-5" style={{ color: "#2F72E8" }} />
              <span className="text-sm font-semibold" style={{ color: "#2F72E8" }}>Flight Search</span>
            </div>
            <h2 className="mb-4 text-2xl font-bold" style={{ color: "#17243A" }}>Find your next flight</h2>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setTripType("round_trip")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  tripType === "round_trip"
                    ? "bg-[#2F72E8] text-white"
                    : "bg-white text-[#52627A] hover:bg-white/80"
                )}
              >
                Round Trip
              </button>
              <button
                onClick={() => setTripType("one_way")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  tripType === "one_way"
                    ? "bg-[#2F72E8] text-white"
                    : "bg-white text-[#52627A] hover:bg-white/80"
                )}
              >
                One Way
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "#52627A" }}>From</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => handleOriginInput(e.target.value)}
                    onFocus={() => origin.length >= 2 && setShowOriginDropdown(true)}
                    onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                    placeholder="City or airport"
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm placeholder-[#9AA8BC] focus:outline-none focus:border-[#2F72E8]"
                    style={{ color: "#17243A", borderColor: "#D9E3F4" }}
                  />
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-50"
                      style={{ background: "var(--kv-surface)", border: "1px solid var(--kv-border)" }}
                    >
                      {originSuggestions.map((a) => (
                        <button
                          key={a.code}
                          onMouseDown={() => selectOrigin(a)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors"
                          style={{ color: "var(--kv-text)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                        >
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--kv-bg-tertiary)" }}>
                            {a.code}
                          </span>
                          <span>{a.city} &mdash; {a.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={swapAirports}
                  className="mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition-all hover:rotate-180"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>

                <div className="relative flex-1">
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "#52627A" }}>To</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => handleDestInput(e.target.value)}
                    onFocus={() => destination.length >= 2 && setShowDestDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                    placeholder="City or airport"
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm placeholder-[#9AA8BC] focus:outline-none focus:border-[#2F72E8]"
                    style={{ color: "#17243A", borderColor: "#D9E3F4" }}
                  />
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-50"
                      style={{ background: "var(--kv-surface)", border: "1px solid var(--kv-border)" }}
                    >
                      {destSuggestions.map((a) => (
                        <button
                          key={a.code}
                          onMouseDown={() => selectDest(a)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors"
                          style={{ color: "var(--kv-text)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                        >
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--kv-bg-tertiary)" }}>
                            {a.code}
                          </span>
                          <span>{a.city} &mdash; {a.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-xs font-semibold text-[#52627A]">Depart</label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#2F72E8] [color-scheme:light]"
                  />
                </div>
                {tripType === "round_trip" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block text-xs font-semibold text-[#52627A]">Return</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#2F72E8] [color-scheme:light]"
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-xs font-semibold text-[#52627A]">Passengers</label>
                  <div className="relative">
                    <select
                      value={passengers}
                      onChange={(e) => setPassengers(Number(e.target.value))}
                      className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#2F72E8]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n} className="text-black">
                          {n} {n === 1 ? "Passenger" : "Passengers"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-xs font-semibold text-[#52627A]">Class</label>
                  <div className="relative">
                    <select
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value)}
                      className="w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#2F72E8]"
                    >
                      {cabinOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-black">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={!selectedOrigin || !selectedDest || !departDate}
                  className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "#2F72E8" }}
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
                  {selectedOrigin?.city} → {selectedDest?.city}
                </h3>
                <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                  {results.length} flights found &middot; {departDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" style={{ color: "var(--kv-text-secondary)" }} />
                <span className="text-sm mr-2" style={{ color: "var(--kv-text-secondary)" }}>Sort:</span>
                {(["price", "duration", "stops"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    )}
                    style={{
                      background: sortBy === s ? "var(--kv-primary)" : "var(--kv-bg-tertiary)",
                      color: sortBy === s ? "#fff" : "var(--kv-text-secondary)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {sortedResults.map((flight) => (
                <div
                  key={flight.id}
                  onClick={() => setSelectedFlight(selectedFlight?.id === flight.id ? null : flight)}
                  className="rounded-xl border transition-all cursor-pointer"
                  style={{
                    background: "var(--kv-surface)",
                    borderColor: selectedFlight?.id === flight.id ? "var(--kv-primary)" : "var(--kv-border)",
                    boxShadow: selectedFlight?.id === flight.id ? "0 0 0 1px var(--kv-primary)" : "var(--kv-shadow-sm)",
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold"
                          style={{ background: "var(--kv-bg-tertiary)", color: "var(--kv-primary)" }}
                        >
                          {flight.airlineLogo}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
                            {flight.airline}
                          </p>
                          <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                            {flight.flightNumber} &middot; {flight.aircraft}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-center">
                        <div>
                          <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>
                            {flight.departureTime}
                          </p>
                          <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                            {flight.origin.code}
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                            {flight.duration}
                          </p>
                          <div className="flex items-center gap-1">
                            <div className="h-0.5 w-16 rounded" style={{ background: "var(--kv-border)" }} />
                            <Plane className="h-3 w-3" style={{ color: "var(--kv-primary)" }} />
                          </div>
                          <p className="text-xs font-medium" style={{
                            color: flight.stops === 0 ? "var(--kv-success)" : "var(--kv-secondary)"
                          }}>
                            {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>
                            {flight.arrivalTime}
                          </p>
                          <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                            {flight.destination.code}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold" style={{ color: "var(--kv-primary)" }}>
                          ${flight.price.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                          {flight.cabinClass} &middot; {passengers > 1 ? `${passengers} pax` : "per person"}
                        </p>
                        {flight.seatsLeft && (
                          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--kv-error)" }}>
                            {flight.seatsLeft} seats left
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedFlight?.id === flight.id && (
                    <div
                      className="border-t px-5 py-4"
                      style={{ borderColor: "var(--kv-border-light)", background: "var(--kv-bg-secondary)" }}
                    >
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Luggage className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                          <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                            Baggage: {flight.baggage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                          <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                            Duration: {flight.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                          <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                            Aircraft: {flight.aircraft}
                          </span>
                        </div>
                        {flight.stopCities && flight.stopCities.length > 0 && (
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                            <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                              Via: {flight.stopCities.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      <a
                        href={`/checkout?type=flight&id=${flight.id}&amount=${flight.price * passengers}&title=${encodeURIComponent(
                          `${flight.airline} ${flight.flightNumber} — ${flight.origin.code} to ${flight.destination.code}`
                        )}`}
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "var(--kv-primary)" }}
                      >
                        Book with Crypto
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { from: "New York", to: "London", fromCode: "JFK", toCode: "LHR", price: "$380+" },
              { from: "Tokyo", to: "Singapore", fromCode: "NRT", toCode: "SIN", price: "$290+" },
              { from: "Dubai", to: "Paris", fromCode: "DXB", toCode: "CDG", price: "$420+" },
            ].map((route) => (
              <button
                key={route.fromCode + route.toCode}
                onClick={() => {
                  const o = airports.find((a) => a.code === route.fromCode);
                  const d = airports.find((a) => a.code === route.toCode);
                  if (o && d) {
                    selectOrigin(o);
                    selectDest(d);
                  }
                }}
                className="group rounded-xl border p-5 text-left transition-all hover:shadow-md"
                style={{
                  background: "var(--kv-surface)",
                  borderColor: "var(--kv-border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ background: "var(--kv-bg-tertiary)", color: "var(--kv-primary)" }}>
                      {route.fromCode}
                    </span>
                    <ArrowRight className="h-3 w-3" style={{ color: "var(--kv-text-tertiary)" }} />
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ background: "var(--kv-bg-tertiary)", color: "var(--kv-primary)" }}>
                      {route.toCode}
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "var(--kv-primary)" }}>{route.price}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
                  {route.from} → {route.to}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--kv-text-tertiary)" }}>
                  Click to search this route
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

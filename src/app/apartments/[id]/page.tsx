"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  Bed,
  Bath,
  Users,
  Maximize,
  Shield,
  CheckCircle,
  Calendar,
  ArrowRight,
  Building2,
  Clock,
  Wifi,
  Heart,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { getApartmentById } from "@/data/apartments";

export default function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const apartment = getApartmentById(id);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!apartment) {
    return (
      <AppShell title="Not Found">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Building2 className="h-16 w-16 mb-4" style={{ color: "var(--kv-text-tertiary)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--kv-text)" }}>
            Property not found
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--kv-text-secondary)" }}>
            The property you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/apartments"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: "var(--kv-primary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
        </div>
      </AppShell>
    );
  }

  const gradientMatch = apartment.images[0]?.match(/gradient:(.+)/);
  const gradient = gradientMatch ? gradientMatch[1] : "from-gray-400 to-gray-500";

  const currencySymbol =
    apartment.currency === "USD" ? "$" :
    apartment.currency === "EUR" ? "€" :
    apartment.currency === "GBP" ? "£" :
    apartment.currency + " ";

  const safetyLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <AppShell title={apartment.title}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/apartments"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--kv-primary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all"
            style={{ borderColor: "var(--kv-border)", color: "var(--kv-text-secondary)" }}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            {isFavorite ? "Saved" : "Save"}
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden">
          <div className={`w-full h-72 md:h-96 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-20 w-20 text-white/20" />
            </div>
            <div className="absolute bottom-4 left-4 flex gap-2">
              {apartment.images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === 0 ? "w-8 bg-white" : "w-2 bg-white/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--kv-text)" }}>
                {apartment.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                  <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                    {apartment.location}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
                    {apartment.rating.toFixed(1)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--kv-text-tertiary)" }}>
                    ({apartment.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <Bed className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--kv-primary)" }} />
                  <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>{apartment.bedrooms}</p>
                  <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>Bedrooms</p>
                </div>
                <div className="text-center">
                  <Bath className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--kv-primary)" }} />
                  <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>{apartment.bathrooms}</p>
                  <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>Bathrooms</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--kv-primary)" }} />
                  <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>{apartment.maxGuests}</p>
                  <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>Max Guests</p>
                </div>
                <div className="text-center">
                  <Maximize className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--kv-primary)" }} />
                  <p className="text-lg font-bold" style={{ color: "var(--kv-text)" }}>{apartment.sqft.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>sq ft</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--kv-text)" }}>About this property</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--kv-text-secondary)" }}>
                {apartment.description}
              </p>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--kv-text)" }}>Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {apartment.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 py-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "var(--kv-success)" }} />
                    <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--kv-text)" }}>
                Safety & Neighborhood
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>Safety Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Shield
                          key={n}
                          className={cn(
                            "h-4 w-4",
                            n <= apartment.safetyRating
                              ? "text-emerald-500 fill-emerald-500"
                              : ""
                          )}
                          style={{ color: n > apartment.safetyRating ? "var(--kv-border)" : undefined }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>
                      {safetyLabels[apartment.safetyRating]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>Neighborhood</span>
                  <span className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>
                    {apartment.neighborhood}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--kv-text)" }}>Host</h3>
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "var(--kv-primary)" }}
                >
                  {apartment.host.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                      {apartment.host.name}
                    </span>
                    {apartment.host.verified && (
                      <CheckCircle className="h-4 w-4" style={{ color: "var(--kv-success)" }} />
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
                    Response rate: {apartment.host.responseRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div
              className="sticky top-24 rounded-xl border p-5 space-y-4"
              style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: "var(--kv-primary)" }}>
                  {currencySymbol}{apartment.price.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: "var(--kv-text-tertiary)" }}>
                  /{apartment.priceUnit}
                </span>
              </div>

              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--kv-border)" }}
              >
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--kv-border)" }}>
                  <div className="p-3">
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--kv-text-tertiary)" }}>
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-sm bg-transparent focus:outline-none"
                      style={{ color: "var(--kv-text)" }}
                    />
                  </div>
                  <div className="p-3">
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--kv-text-tertiary)" }}>
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm bg-transparent focus:outline-none"
                      style={{ color: "var(--kv-text)" }}
                    />
                  </div>
                </div>
                <div className="border-t p-3" style={{ borderColor: "var(--kv-border)" }}>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--kv-text-tertiary)" }}>
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm bg-transparent focus:outline-none appearance-none"
                    style={{ color: "var(--kv-text)" }}
                  >
                    {Array.from({ length: apartment.maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <a
                href={`/checkout?type=apartment&id=${apartment.id}&amount=${apartment.price}&title=${encodeURIComponent(apartment.title)}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--kv-primary)" }}
              >
                Book with Crypto
                <ArrowRight className="h-4 w-4" />
              </a>

              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                  Pay securely with BTC, ETH, USDT and more
                </p>
              </div>

              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: "var(--kv-bg-tertiary)" }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--kv-text-secondary)" }}>
                    {currencySymbol}{apartment.price} x 1 {apartment.priceUnit}
                  </span>
                  <span style={{ color: "var(--kv-text)" }}>
                    {currencySymbol}{apartment.price}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--kv-text-secondary)" }}>Service fee</span>
                  <span style={{ color: "var(--kv-text)" }}>
                    {currencySymbol}{Math.round(apartment.price * 0.05)}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between text-sm font-semibold pt-2 border-t"
                  style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }}
                >
                  <span>Total</span>
                  <span>{currencySymbol}{Math.round(apartment.price * 1.05).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Available {apartment.availableFrom} to {apartment.availableTo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

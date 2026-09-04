"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  MapPin,
  Star,
  Bed,
  Bath,
  Users,
  Shield,
  ChevronDown,
  Heart,
  Zap,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { apartments, searchApartments, getFeaturedApartments } from "@/data/apartments";
import type { Apartment } from "@/types";

const cities = [
  "All", "New York", "London", "Tokyo", "Paris", "Berlin", "Singapore",
  "Dubai", "Sydney", "Amsterdam", "Seoul", "Barcelona", "Zurich",
  "Bangkok", "Cape Town", "Mexico City",
];

const priceUnits = [
  { value: "", label: "Any duration" },
  { value: "night", label: "Per night" },
  { value: "week", label: "Per week" },
  { value: "month", label: "Per month" },
];

export default function ApartmentsPage() {
  const [searchCity, setSearchCity] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [priceUnit, setPriceUnit] = useState("");
  const [instantBookOnly, setInstantBookOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredApartments = useMemo(() => {
    let results = searchApartments({
      city: searchCity === "All" ? undefined : searchCity,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms || undefined,
      priceUnit: priceUnit || undefined,
      instantBook: instantBookOnly || undefined,
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.neighborhood.toLowerCase().includes(q)
      );
    }

    return results;
  }, [searchCity, searchQuery, minPrice, maxPrice, bedrooms, priceUnit, instantBookOnly]);

  const featured = useMemo(() => getFeaturedApartments().slice(0, 3), []);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function ApartmentCard({ apt }: { apt: Apartment }) {
    const gradientMatch = apt.images[0]?.match(/gradient:(.+)/);
    const gradient = gradientMatch ? gradientMatch[1] : "from-gray-400 to-gray-500";

    return (
      <Link
        href={`/apartments/${apt.id}`}
        className={cn(
          "group rounded-xl border overflow-hidden transition-all hover:shadow-lg",
          viewMode === "list" ? "flex" : "flex flex-col"
        )}
        style={{
          background: "var(--kv-surface)",
          borderColor: "var(--kv-border)",
        }}
      >
        <div className={cn(
          "relative overflow-hidden",
          viewMode === "list" ? "w-64 shrink-0" : "aspect-[16/10]"
        )}>
          <div className={`w-full h-full bg-gradient-to-br ${gradient} min-h-[180px]`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-white/30" />
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(apt.id);
            }}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
          >
            <Heart
              className={cn("h-4 w-4", favorites.has(apt.id) ? "fill-red-500 text-red-500" : "text-white")}
            />
          </button>
          {apt.instantBook && (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
              <Zap className="h-3 w-3" /> Instant Book
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--kv-text)" }}>
                {apt.title}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--kv-text-tertiary)" }} />
                <span className="text-xs truncate" style={{ color: "var(--kv-text-secondary)" }}>
                  {apt.location}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
                {apt.rating.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                ({apt.reviewCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" style={{ color: "var(--kv-text-tertiary)" }} />
              <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{apt.bedrooms} BR</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" style={{ color: "var(--kv-text-tertiary)" }} />
              <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{apt.bathrooms} BA</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" style={{ color: "var(--kv-text-tertiary)" }} />
              <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{apt.maxGuests} guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" style={{ color: apt.safetyRating >= 4 ? "var(--kv-success)" : "var(--kv-warning)" }} />
              <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{apt.safetyRating}/5</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-lg font-bold" style={{ color: "var(--kv-primary)" }}>
                {apt.currency === "USD" ? "$" : apt.currency === "EUR" ? "€" : apt.currency === "GBP" ? "£" : apt.currency + " "}
                {apt.price.toLocaleString()}
              </span>
              <span className="text-xs ml-1" style={{ color: "var(--kv-text-tertiary)" }}>
                /{apt.priceUnit}
              </span>
            </div>
            {apt.host.verified && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--kv-success)15", color: "var(--kv-success)" }}>
                Verified Host
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <AppShell title="Apartments">
      <div className="p-6 space-y-6">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-white/80" />
            <span className="text-sm font-medium text-white/80">Accommodation</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Find your perfect stay</h2>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, or neighborhood..."
                className="w-full rounded-xl bg-white/15 backdrop-blur-sm pl-10 pr-4 py-3 text-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all border",
                showFilters ? "bg-white text-orange-600 border-white" : "bg-white/15 text-white border-white/20 hover:bg-white/25"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <div>
                <label className="text-xs text-white/70 mb-1 block">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 border border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-xl bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 border border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/15 px-3 py-2.5 text-sm text-white border border-white/20 focus:outline-none appearance-none"
                >
                  <option value={0} className="text-black">Any</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n} className="text-black">{n}+</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/70 mb-1 block">Duration</label>
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="w-full rounded-xl bg-white/15 px-3 py-2.5 text-sm text-white border border-white/20 focus:outline-none appearance-none"
                >
                  {priceUnits.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantBookOnly}
                    onChange={(e) => setInstantBookOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-white">Instant Book</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSearchCity(city)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: searchCity === city ? "var(--kv-primary)" : "var(--kv-bg-tertiary)",
                color: searchCity === city ? "#fff" : "var(--kv-text-secondary)",
              }}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
            {filteredApartments.length} properties found
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className="p-2 rounded-lg transition-all"
              style={{
                background: viewMode === "grid" ? "var(--kv-primary)15" : "transparent",
                color: viewMode === "grid" ? "var(--kv-primary)" : "var(--kv-text-tertiary)",
              }}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-lg transition-all"
              style={{
                background: viewMode === "list" ? "var(--kv-primary)15" : "transparent",
                color: viewMode === "list" ? "var(--kv-primary)" : "var(--kv-text-tertiary)",
              }}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn(
          viewMode === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-3"
        )}>
          {filteredApartments.map((apt) => (
            <ApartmentCard key={apt.id} apt={apt} />
          ))}
        </div>

        {filteredApartments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--kv-text-tertiary)" }} />
            <p className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>No properties found</p>
            <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
              Try adjusting your filters or searching a different city
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

import {
  searchApartments as mockSearch,
  getApartmentById as mockGetById,
  getFeaturedApartments as mockFeatured,
} from "@/data/apartments";
import type { Apartment } from "@/types";

const RAPIDAPI_HOST_BOOKING = "booking-com15.p.rapidapi.com";

interface BookingProperty {
  hotel_id: number;
  hotel_name: string;
  city_trans: string;
  country_trans: string;
  address: string;
  min_total_price: number;
  currency_code: string;
  review_score: number;
  review_nr: number;
  accommodation_type_name: string;
  latitude: number;
  longitude: number;
  max_photo_url?: string;
  district?: string;
}

function mapBookingToApartment(prop: BookingProperty, idx: number): Apartment {
  const gradientColors = [
    "from-blue-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-orange-400 to-rose-500",
    "from-cyan-400 to-blue-500",
    "from-violet-400 to-fuchsia-500",
    "from-amber-400 to-orange-500",
  ];

  return {
    id: `BK-${prop.hotel_id}`,
    title: prop.hotel_name,
    location: prop.address || `${prop.district || ""}, ${prop.city_trans}`.replace(/^, /, ""),
    city: prop.city_trans,
    country: prop.country_trans,
    price: Math.round(prop.min_total_price || 0),
    currency: prop.currency_code || "USD",
    priceUnit: "night",
    images: prop.max_photo_url
      ? [prop.max_photo_url]
      : [`gradient:${gradientColors[idx % gradientColors.length]}`],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    sqft: 500,
    amenities: ["WiFi", "Air Conditioning", "Kitchen"],
    rating: (prop.review_score || 0) / 2,
    reviewCount: prop.review_nr || 0,
    host: { name: "Property Manager", verified: true, responseRate: 95 },
    safetyRating: 4,
    neighborhood: prop.district || prop.city_trans,
    description: `${prop.accommodation_type_name || "Property"} located in ${prop.city_trans}, ${prop.country_trans}.`,
    availableFrom: "2025-01-01",
    availableTo: "2026-12-31",
    instantBook: true,
  };
}

export async function fetchApartments(filters: {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  priceUnit?: string;
  instantBook?: boolean;
  checkIn?: string;
  checkOut?: string;
}): Promise<{ apartments: Apartment[]; source: "live" | "mock" }> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey || !filters.city) {
    return { apartments: mockSearch(filters), source: "mock" };
  }

  try {
    const params = new URLSearchParams({
      dest_type: "city",
      search_type: "CITY",
      order_by: "popularity",
      arrival_date: filters.checkIn || new Date().toISOString().split("T")[0],
      departure_date: filters.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      adults: "2",
      room_qty: "1",
      page_number: "1",
      units: "metric",
      temperature_unit: "c",
      languagecode: "en-us",
      currency_code: "USD",
    });

    if (filters.minPrice) params.set("price_min", String(filters.minPrice));
    if (filters.maxPrice) params.set("price_max", String(filters.maxPrice));

    const destRes = await fetch(
      `https://${RAPIDAPI_HOST_BOOKING}/api/v1/hotels/searchDestination?query=${encodeURIComponent(filters.city)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST_BOOKING,
        },
      }
    );

    if (!destRes.ok) throw new Error(`Destination lookup ${destRes.status}`);
    const destData = await destRes.json();
    const destId = destData?.data?.[0]?.dest_id;

    if (!destId) throw new Error("No destination found");

    params.set("dest_id", destId);

    const searchRes = await fetch(
      `https://${RAPIDAPI_HOST_BOOKING}/api/v1/hotels/searchHotels?${params}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST_BOOKING,
        },
      }
    );

    if (!searchRes.ok) throw new Error(`Search ${searchRes.status}`);
    const searchData = await searchRes.json();
    const properties: BookingProperty[] = searchData?.data?.hotels || [];

    return {
      apartments: properties.map((p, i) => mapBookingToApartment(p, i)),
      source: "live",
    };
  } catch {
    return { apartments: mockSearch(filters), source: "mock" };
  }
}

export async function fetchApartmentById(
  id: string
): Promise<{ apartment: Apartment | undefined; source: "live" | "mock" }> {
  return { apartment: mockGetById(id), source: "mock" };
}

export async function fetchFeaturedApartments(): Promise<{
  apartments: Apartment[];
  source: "live" | "mock";
}> {
  return { apartments: mockFeatured(), source: "mock" };
}

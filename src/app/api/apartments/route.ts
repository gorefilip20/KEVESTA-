import { NextRequest, NextResponse } from "next/server";
import {
  fetchApartments,
  fetchApartmentById,
  fetchFeaturedApartments,
} from "@/lib/api/apartments-client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "featured") {
    const { apartments, source } = await fetchFeaturedApartments();
    return NextResponse.json({ apartments, source });
  }

  if (action === "detail") {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const { apartment, source } = await fetchApartmentById(id);
    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }
    return NextResponse.json({ apartment, source });
  }

  const filters = {
    city: searchParams.get("city") || undefined,
    country: searchParams.get("country") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
    priceUnit: searchParams.get("priceUnit") || undefined,
    instantBook: searchParams.get("instantBook") === "true" ? true : undefined,
    checkIn: searchParams.get("checkIn") || undefined,
    checkOut: searchParams.get("checkOut") || undefined,
  };

  const { apartments, source } = await fetchApartments(filters);
  return NextResponse.json({ apartments, count: apartments.length, source });
}

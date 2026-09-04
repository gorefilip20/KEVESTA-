import { NextRequest, NextResponse } from "next/server";
import { searchApartments, getApartmentById, getFeaturedApartments } from "@/data/apartments";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "featured") {
    return NextResponse.json({ apartments: getFeaturedApartments() });
  }

  if (action === "detail") {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const apartment = getApartmentById(id);
    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }
    return NextResponse.json({ apartment });
  }

  const filters = {
    city: searchParams.get("city") || undefined,
    country: searchParams.get("country") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
    priceUnit: searchParams.get("priceUnit") || undefined,
    instantBook: searchParams.get("instantBook") === "true" ? true : undefined,
  };

  const results = searchApartments(filters);
  return NextResponse.json({ apartments: results, count: results.length });
}

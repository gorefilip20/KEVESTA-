import { NextRequest, NextResponse } from "next/server";
import { getServicesForCountry, getServicesByCategory } from "@/data/services";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "US";
  const category = searchParams.get("category");

  let services = getServicesForCountry(country);

  if (category) {
    services = services.filter((s) => s.category === category);
  }

  return NextResponse.json({
    success: true,
    country,
    count: services.length,
    services,
  });
}

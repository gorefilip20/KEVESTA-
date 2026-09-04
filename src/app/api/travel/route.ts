import { NextRequest, NextResponse } from "next/server";
import { countries, guidanceCategories } from "@/data/countries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const category = searchParams.get("category");

  if (country) {
    const countryData = countries.find((c) => c.code === country);
    if (!countryData) {
      return NextResponse.json(
        { error: "Country not found" },
        { status: 404 }
      );
    }

    const categories = category
      ? guidanceCategories.filter((c) => c.id === category)
      : guidanceCategories;

    return NextResponse.json({
      success: true,
      country: countryData,
      categories,
    });
  }

  return NextResponse.json({
    success: true,
    countries,
    categories: guidanceCategories,
  });
}

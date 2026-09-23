import { NextRequest, NextResponse } from "next/server";
import { getApartmentById } from "@/data/apartments";
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; const apartment = getApartmentById(id); if (!apartment) return NextResponse.json({ error: "Accommodation not found" }, { status: 404 }); return NextResponse.json({ apartment }); }

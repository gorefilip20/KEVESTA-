import { NextResponse } from "next/server";
import { saveCalendarConnection, verifyState } from "@/lib/server/calendar";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "outlook") return NextResponse.json({ error: "Unsupported calendar provider" }, { status: 400 });
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const verified = verifyState(state);
  const code = url.searchParams.get("code");
  if (!verified || verified.provider !== provider || !code) return NextResponse.redirect(new URL("/dashboard?calendar=error", process.env.NEXT_PUBLIC_APP_URL));
  try { await saveCalendarConnection(verified.userId, provider, code); return NextResponse.redirect(new URL("/dashboard?calendar=connected", process.env.NEXT_PUBLIC_APP_URL)); } catch (error) { console.error("Calendar OAuth callback failed", error); return NextResponse.redirect(new URL("/dashboard?calendar=error", process.env.NEXT_PUBLIC_APP_URL)); }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { calendarAuthUrl } from "@/lib/server/calendar";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", new URL(request.url).origin));
  const { provider } = await params;
  if (provider !== "google" && provider !== "outlook") return NextResponse.json({ error: "Unsupported calendar provider" }, { status: 400 });
  if (provider === "google" && (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET)) return NextResponse.json({ error: "Google Calendar is not configured." }, { status: 503 });
  if (provider === "outlook" && (!process.env.MICROSOFT_CALENDAR_CLIENT_ID || !process.env.MICROSOFT_CALENDAR_CLIENT_SECRET)) return NextResponse.json({ error: "Outlook Calendar is not configured." }, { status: 503 });
  return NextResponse.redirect(calendarAuthUrl(provider, user.id));
}

import crypto from "node:crypto";
import { query } from "@/lib/server/db";

const secret = () => process.env.CALENDAR_TOKEN_SECRET || process.env.CRYPTO_QUOTE_SECRET || "development-calendar-secret";
const key = () => crypto.createHash("sha256").update(secret()).digest();
export function encryptToken(value: string) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
export function decryptToken(value: string) { const [ivText, tagText, dataText] = value.split("."); const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url")); decipher.setAuthTag(Buffer.from(tagText, "base64url")); return Buffer.concat([decipher.update(Buffer.from(dataText, "base64url")), decipher.final()]).toString("utf8"); }

function signState(userId: string, provider: string) { const payload = Buffer.from(JSON.stringify({ userId, provider, exp: Date.now() + 10 * 60_000 })).toString("base64url"); const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); return `${payload}.${sig}`; }
export function verifyState(state: string) { const [payload, sig] = state.split("."); const expected = payload ? crypto.createHmac("sha256", secret()).update(payload).digest("base64url") : ""; if (!payload || !sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null; try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; provider: string; exp: number }; return data.exp > Date.now() ? data : null; } catch { return null; } }

export function calendarAuthUrl(provider: "google" | "outlook", userId: string) {
  const state = signState(userId, provider);
  if (provider === "google") return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || "", redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`, response_type: "code", access_type: "offline", prompt: "consent", scope: "https://www.googleapis.com/auth/calendar.events", state })}`;
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({ client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID || "", redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`, response_type: "code", response_mode: "query", scope: "offline_access Calendars.ReadWrite", state })}`;
}

async function exchange(provider: "google" | "outlook", code: string) {
  const google = provider === "google";
  const response = await fetch(google ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(google ? { code, client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || "", client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "", redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`, grant_type: "authorization_code" } : { code, client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID || "", client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET || "", redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`, grant_type: "authorization_code", scope: "offline_access Calendars.ReadWrite" }) });
  const data = await response.json();
  if (!response.ok || typeof data.access_token !== "string") throw new Error("Calendar authorization failed");
  return { accessToken: data.access_token as string, refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : null, expiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000) };
}

export async function saveCalendarConnection(userId: string, provider: "google" | "outlook", code: string) { const tokens = await exchange(provider, code); await query("insert into calendar_connections (user_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at) values ($1, $2, $3, $4, $5) on conflict (user_id, provider) do update set access_token_encrypted = $3, refresh_token_encrypted = coalesce($4, calendar_connections.refresh_token_encrypted), expires_at = $5, updated_at = now()", [userId, provider, encryptToken(tokens.accessToken), tokens.refreshToken ? encryptToken(tokens.refreshToken) : null, tokens.expiresAt]); }

async function createGoogle(accessToken: string, title: string, date: string) { const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ summary: title, description: "Confirmed through KEVESTA", start: { date }, end: { date: new Date(new Date(`${date}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) } }) }); const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message || `Google Calendar HTTP ${response.status}`); return String(data.id); }
async function createOutlook(accessToken: string, title: string, date: string) { const response = await fetch("https://graph.microsoft.com/v1.0/me/events", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ subject: title, body: { contentType: "Text", content: "Confirmed through KEVESTA" }, start: { dateTime: `${date}T09:00:00`, timeZone: "UTC" }, end: { dateTime: `${date}T10:00:00`, timeZone: "UTC" } }) }); const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message || `Microsoft Graph HTTP ${response.status}`); return String(data.id); }

export async function syncConfirmedBooking(userId: string, bookingId: string) {
  const booking = (await query<{ item_title: string; created_at: string }>("select item_title, created_at from bookings where id = $1 and user_id = $2 and status = 'paid'", [bookingId, userId])).rows[0];
  if (!booking) return;
  const date = new Date(booking.created_at).toISOString().slice(0, 10);
  const connections = await query<{ provider: "google" | "outlook"; access_token_encrypted: string }>("select provider, access_token_encrypted from calendar_connections where user_id = $1", [userId]);
  for (const connection of connections.rows) {
    const existing = await query("select id from calendar_sync_events where booking_id = $1 and provider = $2", [bookingId, connection.provider]);
    if (existing.rows.length) continue;
    try {
      const accessToken = decryptToken(connection.access_token_encrypted);
      const externalId = connection.provider === "google" ? await createGoogle(accessToken, `KEVESTA · ${booking.item_title}`, date) : await createOutlook(accessToken, `KEVESTA · ${booking.item_title}`, date);
      await query("insert into calendar_sync_events (id, user_id, booking_id, provider, external_event_id, status) values ($1, $2, $3, $4, $5, 'synced') on conflict (booking_id, provider) do nothing", [crypto.randomUUID(), userId, bookingId, connection.provider, externalId]);
    } catch (error) { await query("insert into calendar_sync_events (id, user_id, booking_id, provider, status, error) values ($1, $2, $3, $4, 'failed', $5) on conflict (booking_id, provider) do update set status = 'failed', error = $5, synced_at = now()", [crypto.randomUUID(), userId, bookingId, connection.provider, error instanceof Error ? error.message : "Calendar sync failed"]); }
  }
}

import crypto from "node:crypto";
import { query } from "@/lib/server/db";

type Event = { userId: string; bookingId?: string; eventType: "booking_paid" | "booking_failed" | "booking_cancelled" | "refund_requested" | "refund_completed"; title: string; body: string };

type DeliveryResult = { status: "sent" | "skipped" | "failed"; providerMessageId?: string; error?: string };

async function sendTwilioSms(to: string, body: string): Promise<DeliveryResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return { status: "skipped", error: "Twilio is not configured" };
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "failed", error: typeof payload?.message === "string" ? payload.message : `Twilio HTTP ${response.status}` };
  return { status: "sent", providerMessageId: typeof payload?.sid === "string" ? payload.sid : undefined };
}

let firebaseToken: { value: string; expiresAt: number } | null = null;
async function firebaseAccessToken() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  if (firebaseToken && firebaseToken.expiresAt > Date.now() + 60_000) return { ...firebaseToken, projectId };
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "RS256", typ: "JWT" });
  const claim = encode({ iss: clientEmail, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const signature = crypto.createSign("RSA-SHA256").update(`${header}.${claim}`).sign(privateKey, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claim}.${signature}` }), cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== "string") throw new Error("Firebase access token request failed");
  firebaseToken = { value: payload.access_token, expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 };
  return { ...firebaseToken, projectId };
}

async function sendFirebasePush(token: string, title: string, body: string): Promise<DeliveryResult> {
  const access = await firebaseAccessToken();
  if (!access) return { status: "skipped", error: "Firebase is not configured" };
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${access.projectId}/messages:send`, { method: "POST", headers: { Authorization: `Bearer ${access.value}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { token, notification: { title, body }, data: { source: "kevesta" } } }), cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "failed", error: typeof payload?.error?.message === "string" ? payload.error.message : `Firebase HTTP ${response.status}` };
  return { status: "sent", providerMessageId: typeof payload?.name === "string" ? payload.name : undefined };
}

async function record(event: Event, channel: "sms" | "push", destination: string, result: DeliveryResult) {
  await query("insert into notification_deliveries (id, user_id, booking_id, channel, event_type, destination, status, provider_message_id, error, idempotency_key) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) on conflict (idempotency_key) do nothing", [crypto.randomUUID(), event.userId, event.bookingId || null, channel, event.eventType, destination, result.status, result.providerMessageId || null, result.error || null, `${event.eventType}:${event.bookingId || "account"}:${channel}:${destination}`]);
}

export async function notifyBookingEvent(event: Event) {
  const preferences = await query<{ phone_e164: string | null; sms_enabled: boolean; push_enabled: boolean; booking_updates: boolean; refund_updates: boolean }>("select phone_e164, sms_enabled, push_enabled, booking_updates, refund_updates from notification_preferences where user_id = $1", [event.userId]);
  const preference = preferences.rows[0];
  if (!preference) return;
  const allowed = event.eventType.startsWith("refund") ? preference.refund_updates : preference.booking_updates;
  if (!allowed) return;
  if (preference.sms_enabled && preference.phone_e164) {
    const result = await sendTwilioSms(preference.phone_e164, `${event.title}: ${event.body}`);
    await record(event, "sms", preference.phone_e164, result);
  }
  if (preference.push_enabled) {
    const devices = await query<{ token: string }>("select token from push_devices where user_id = $1 and enabled = true", [event.userId]);
    for (const device of devices.rows) {
      const result = await sendFirebasePush(device.token, event.title, event.body);
      await record(event, "push", device.token, result);
    }
  }
}

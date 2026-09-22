import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
export type Country = { code: string; name: string; flag: string; currency: string; language: string };
export type GuidanceCategory = { id: string; title: string; icon: string; description: string; items: { id: string; title: string; content: string; tags: string[] }[] };
export type Apartment = { id: string; title: string; location: string; city: string; country: string; price: number; currency: string; priceUnit: string; images: string[]; bedrooms: number; bathrooms: number; maxGuests: number; rating: number; reviewCount: number; amenities: string[]; featured?: boolean };
export type Flight = { id: string; airline: string; flightNumber: string; origin: { code: string; city: string }; destination: { code: string; city: string }; departureTime: string; arrivalTime: string; duration: string; stops: number; price: number; currency: string; baggage: string };
export type User = { id: string; email: string; name: string } | null;
export type Booking = { id: string; item_type: string; item_id: string; item_title: string; amount: number; currency: string; status: string; payment_status: string | null; created_at: string; updated_at: string };
export type BookingIntent = { id: string; itemType: string; itemId: string; title: string; amount: number; currency: string; expiresAt: string };
export type Payment = { mode: "column" | "setup_required"; status: string; paymentId: string; message?: string };
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const TOKEN_KEY = "kevesta_mobile_token";
async function getToken() { return Platform.OS === "web" ? (typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY)) : SecureStore.getItemAsync(TOKEN_KEY); }
async function saveToken(token: string) { if (Platform.OS === "web") localStorage.setItem(TOKEN_KEY, token); else await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); }
async function clearToken() { if (Platform.OS === "web") localStorage.removeItem(TOKEN_KEY); else await SecureStore.deleteItemAsync(TOKEN_KEY); }
async function request<T>(path: string, init?: RequestInit, authenticated = false): Promise<T> {
  const token = authenticated ? await getToken() : null;
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers || {}) } });
  const data = await response.json();
  if (response.status === 401 && authenticated) await clearToken();
  if (!response.ok) throw new Error(data?.error || "Something went wrong");
  return data as T;
}
export const api = {
  login: async (email: string, password: string) => { const data = await request<{ token: string; expiresAt: string; user: Exclude<User, null> }>("/api/auth/mobile/login", { method: "POST", body: JSON.stringify({ email, password }) }); await saveToken(data.token); return data; },
  logout: async () => { try { await request("/api/auth/mobile/logout", { method: "POST" }, true); } finally { await clearToken(); } },
  hasToken: async () => Boolean(await getToken()),
  getUser: () => request<{ user: User }>("/api/auth/me", undefined, true),
  getTravel: (country?: string) => request<{ countries: Country[]; categories: GuidanceCategory[]; country?: Country }>(`/api/travel${country ? `?country=${country}` : ""}`),
  getFeaturedStays: () => request<{ apartments: Apartment[] }>("/api/apartments?action=featured"),
  getFlights: (origin: string, destination: string) => request<{ flights: Flight[] }>(`/api/flights?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departDate=${new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}&passengers=1&cabinClass=economy`),
  chat: (message: string, country: string, conversationHistory: { role: string; content: string }[] = []) => request<{ response: string }>("/api/chat", { method: "POST", body: JSON.stringify({ message, country, type: "travel", conversationHistory }) }),
  getBookings: () => request<{ bookings: Booking[] }>("/api/bookings", undefined, true),
  createIntent: (body: { itemType: "apartment" | "flight"; itemId: string; origin?: string; destination?: string; departDate?: string; cabinClass?: string; passengers?: number; seatPrice?: number }) => request<{ intent: BookingIntent }>("/api/bookings/intents", { method: "POST", body: JSON.stringify(body) }, true),
  startBankPayment: (intentId: string, customerName: string, customerEmail: string, idempotencyKey: string) => request<{ payment: Payment; intent: { id: string; amount: number; currency: string; title: string } }>("/api/payments", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ intentId, customerName, customerEmail }) }, true),
};

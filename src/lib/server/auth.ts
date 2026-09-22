import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query } from "@/lib/server/db";

const scrypt = promisify(crypto.scrypt);
const COOKIE = "kevesta_session";
const SESSION_DAYS = 30;
const MOBILE_SESSION_DAYS = 30;
type User = { id: string; email: string; name: string };

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [, salt, expectedHex] = stored.split("$");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
export function validatePassword(password: unknown) { return typeof password === "string" && password.length >= 12 && password.length <= 128; }
export function normalizeEmail(email: unknown) { return typeof email === "string" ? email.trim().toLowerCase() : ""; }
function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query("insert into sessions (user_id, token_hash, expires_at) values ($1, $2, $3)", [userId, tokenHash(token), expiresAt]);
  return token;
}
export async function createMobileSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query("insert into mobile_sessions (user_id, token_hash, expires_at, last_used_at) values ($1, $2, $3, now())", [userId, tokenHash(token), expiresAt]);
  return { token, expiresAt };
}
export async function revokeMobileSession(token: string) { await query("update mobile_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null", [tokenHash(token)]); }
export async function setSessionCookie(token: string) { const store = await cookies(); store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 24 * 60 * 60 }); }
export async function clearSessionCookie() { const store = await cookies(); store.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const result = await query<User>("select u.id, u.email, u.name from sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()", [tokenHash(token)]);
  return result.rows[0] || null;
}
export async function getCurrentMobileUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]{20,})$/i);
  if (!match) return null;
  const hash = tokenHash(match[1]);
  const result = await query<User>("select u.id, u.email, u.name from mobile_sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()", [hash]);
  if (!result.rows[0]) return null;
  await query("update mobile_sessions set last_used_at = now() where token_hash = $1", [hash]);
  return result.rows[0];
}
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }
export { COOKIE };

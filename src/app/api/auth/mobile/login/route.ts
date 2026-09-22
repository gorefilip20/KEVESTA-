import { NextRequest, NextResponse } from "next/server";
import { createMobileSession, normalizeEmail, verifyPassword } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const result = await query<{ id: string; email: string; name: string; password_hash: string; email_verified_at: string | null }>("select id, email, name, password_hash, email_verified_at from users where email = $1", [email]);
    const user = result.rows[0];
    if (!user || typeof body.password !== "string" || !(await verifyPassword(body.password, user.password_hash))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    if (!user.email_verified_at) return NextResponse.json({ error: "Please verify your email before signing in.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    const session = await createMobileSession(user.id);
    return NextResponse.json({ token: session.token, expiresAt: session.expiresAt.toISOString(), user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) { console.error("Mobile login failed", error); return NextResponse.json({ error: "Login is unavailable." }, { status: 503 }); }
}

import { NextRequest, NextResponse } from "next/server";
import { createSession, normalizeEmail, sameOrigin, setSessionCookie, verifyPassword } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const result = await query<{ id: string; email: string; name: string; password_hash: string }>("select id, email, name, password_hash from users where email = $1", [email]);
    const user = result.rows[0];
    if (!user || typeof body.password !== "string" || !(await verifyPassword(body.password, user.password_hash))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    await setSessionCookie(await createSession(user.id));
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login is unavailable." }, { status: 503 });
  }
}

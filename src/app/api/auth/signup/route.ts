import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, normalizeEmail, sameOrigin, setSessionCookie, validatePassword } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !name || !validatePassword(body.password)) return NextResponse.json({ error: "Name, valid email, and a password of at least 12 characters are required." }, { status: 400 });
    const result = await query<{ id: string }>("insert into users (email, name, password_hash) values ($1, $2, $3) returning id", [email, name, await hashPassword(body.password)]);
    await setSessionCookie(await createSession(result.rows[0].id));
    return NextResponse.json({ user: { id: result.rows[0].id, email, name } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as Error & { code?: string }).code === "23505") return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Account creation is unavailable." }, { status: 503 });
  }
}

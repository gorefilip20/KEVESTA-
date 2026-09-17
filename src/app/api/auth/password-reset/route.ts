import { NextRequest, NextResponse } from "next/server";
import { hashPassword, normalizeEmail, sameOrigin, validatePassword } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { consumeEmailToken, issueEmailToken, sendPasswordResetEmail } from "@/lib/server/email";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.token === "string" && body.token.length > 20) {
      if (!validatePassword(body.password)) return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
      const userId = await consumeEmailToken(body.token, "password_reset");
      if (!userId) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
      await query("update users set password_hash = $1 where id = $2", [await hashPassword(body.password), userId]);
      await query("delete from sessions where user_id = $1", [userId]);
      return NextResponse.json({ reset: true });
    }
    const email = normalizeEmail(body.email);
    const result = await query<{ id: string; name: string }>("select id, name from users where email = $1", [email]);
    if (result.rows[0]) await sendPasswordResetEmail(email, result.rows[0].name, await issueEmailToken(result.rows[0].id, "password_reset"));
    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Password reset is unavailable." }, { status: 503 });
  }
}

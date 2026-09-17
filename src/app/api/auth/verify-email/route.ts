import { NextRequest, NextResponse } from "next/server";
import { issueEmailToken, consumeEmailToken, sendVerificationEmail } from "@/lib/server/email";
import { normalizeEmail, sameOrigin } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.token === "string" && body.token.length > 20) {
      const userId = await consumeEmailToken(body.token, "verification");
      if (!userId) return NextResponse.json({ error: "This verification link is invalid or expired." }, { status: 400 });
      await query("update users set email_verified_at = coalesce(email_verified_at, now()) where id = $1", [userId]);
      return NextResponse.json({ verified: true });
    }
    const email = normalizeEmail(body.email);
    const result = await query<{ id: string; name: string }>("select id, name from users where email = $1 and email_verified_at is null", [email]);
    if (result.rows[0]) await sendVerificationEmail(email, result.rows[0].name, await issueEmailToken(result.rows[0].id, "verification"));
    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "Email verification is unavailable." }, { status: 503 });
  }
}

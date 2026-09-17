import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { query } from "@/lib/server/db";
import { passwordResetEmail, verificationEmail } from "@/lib/server/email-templates";

function tokenHash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

function transporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
}

export async function issueEmailToken(userId: string, type: "verification" | "password_reset") {
  const token = crypto.randomBytes(32).toString("base64url");
  await query("delete from auth_email_tokens where user_id = $1 and token_type = $2 and consumed_at is null", [userId, type]);
  await query("insert into auth_email_tokens (user_id, token_hash, token_type, expires_at) values ($1, $2, $3, now() + ($4 * interval '1 minute'))", [userId, tokenHash(token), type, type === "verification" ? 60 : 30]);
  return token;
}

export async function consumeEmailToken(token: string, type: "verification" | "password_reset") {
  const result = await query<{ user_id: string }>("update auth_email_tokens set consumed_at = now() where token_hash = $1 and token_type = $2 and consumed_at is null and expires_at > now() returning user_id", [tokenHash(token), type]);
  return result.rows[0]?.user_id || null;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${encodeURIComponent(token)}`;
  const message = verificationEmail(name, url);
  return sendMail(to, message.subject, message.html, url);
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}`;
  const message = passwordResetEmail(name, url);
  return sendMail(to, message.subject, message.html, url);
}

async function sendMail(to: string, subject: string, html: string, developmentUrl: string) {
  const mailer = transporter();
  if (!mailer) {
    if (process.env.NODE_ENV !== "production") console.info(`[email:development] ${developmentUrl}`);
    return false;
  }
  await mailer.sendMail({ from: process.env.EMAIL_FROM || `KEVESTA <${process.env.SMTP_USER}>`, to, subject, html, text: `${subject}\n\nOpen this link to continue: ${developmentUrl}` });
  return true;
}

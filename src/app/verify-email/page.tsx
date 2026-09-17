"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  useEffect(() => { const token = new URLSearchParams(window.location.search).get("token"); fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then((response) => setState(response.ok ? "success" : "error")).catch(() => setState("error")); }, []);
  return <AppShell title="Verify email"><div className="mx-auto max-w-md px-5 py-20 text-center"><div className="rounded-3xl border bg-white p-8 shadow-sm" style={{ borderColor: "var(--kv-border-light)" }}>{state === "loading" ? <Loader2 className="mx-auto h-9 w-9 animate-spin" style={{ color: "var(--kv-primary)" }} /> : state === "success" ? <><CheckCircle2 className="mx-auto h-12 w-12 text-[#1B8A57]" /><h1 className="heritage-heading mt-5 text-3xl font-semibold" style={{ color: "var(--kv-text)" }}>Email verified</h1><p className="mt-3 text-sm leading-6" style={{ color: "var(--kv-text-secondary)" }}>Your KEVESTA account is ready. You can now sign in and secure your booking.</p><Link href="/login" className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--kv-primary)" }}>Continue to sign in</Link></> : <><CircleAlert className="mx-auto h-12 w-12 text-[#B7791F]" /><h1 className="heritage-heading mt-5 text-3xl font-semibold" style={{ color: "var(--kv-text)" }}>Link expired</h1><p className="mt-3 text-sm leading-6" style={{ color: "var(--kv-text-secondary)" }}>Request a new verification email and we will send a fresh secure link.</p><Link href="/login" className="mt-6 inline-flex rounded-xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }}>Back to account</Link></>}</div></div></AppShell>;
}

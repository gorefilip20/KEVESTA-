"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Authentication failed.");
      router.push(returnTo);
    } catch (authError) { setError(authError instanceof Error ? authError.message : "Authentication failed."); } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-md px-5 py-12 lg:py-20"><div className="rounded-3xl border bg-white p-7 shadow-sm sm:p-9" style={{ borderColor: "var(--kv-border-light)" }}><div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#EDF3FF", color: "var(--kv-primary)" }}><LockKeyhole className="h-6 w-6" /></div><p className="heritage-caption mt-6" style={{ color: "var(--kv-primary)" }}>{mode === "login" ? "Welcome back" : "Start your journey"}</p><h1 className="heritage-heading mt-2 text-4xl font-semibold" style={{ color: "var(--kv-text)" }}>{mode === "login" ? "Sign in to Kevesta" : "Create your account"}</h1><p className="mt-3 text-sm leading-6" style={{ color: "var(--kv-text-secondary)" }}>{mode === "login" ? "Your trips, payment references, and booking intents stay connected to your account." : "Create a secure account before you reserve a flight, stay, or service."}</p><form onSubmit={submit} className="mt-7 space-y-4">{mode === "signup" && <label className="block text-sm font-semibold" style={{ color: "var(--kv-text)" }}>Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" style={{ borderColor: "var(--kv-border)" }} placeholder="Alex Morgan" /></label>}<label className="block text-sm font-semibold" style={{ color: "var(--kv-text)" }}>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" style={{ borderColor: "var(--kv-border)" }} placeholder="alex@example.com" /></label><label className="block text-sm font-semibold" style={{ color: "var(--kv-text)" }}>Password<input required minLength={12} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal" style={{ borderColor: "var(--kv-border)" }} placeholder="At least 12 characters" /></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--kv-primary)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight className="h-4 w-4" /></>}</button></form><button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="mt-5 w-full text-center text-sm font-semibold" style={{ color: "var(--kv-primary)" }}>{mode === "login" ? "New to Kevesta? Create an account" : "Already have an account? Sign in"}</button><p className="mt-6 text-center text-xs leading-5" style={{ color: "var(--kv-text-tertiary)" }}>Passwords are hashed server-side. Sessions use httpOnly, SameSite cookies.</p></div></div>;
}

export default function LoginPage() { return <AppShell title="Account"><Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}><LoginContent /></Suspense></AppShell>; }

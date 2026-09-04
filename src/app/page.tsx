"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Globe,
  Compass,
  MapPin,
  Headphones,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Destination Intelligence",
    description:
      "Expert-curated travel guidance spanning transport, payments, cultural etiquette, safety protocols, and essential local services for every destination.",
    color: "#3D2B5A",
  },
  {
    icon: MapPin,
    title: "Curated Local Directory",
    description:
      "Handpicked recommendations for ride-hailing, accommodation, dining, and financial services, refined to match your location and personal preferences.",
    color: "#C49A6C",
  },
  {
    icon: Headphones,
    title: "Concierge & Resolution",
    description:
      "Thoughtful AI-powered complaint resolution with sentiment analysis, automated remediation, and intelligent escalation when personal attention is warranted.",
    color: "#4A7C6F",
  },
];

const stats = [
  { value: "20+", label: "Destinations Curated" },
  { value: "50+", label: "Vetted Partners" },
  { value: "99.5%", label: "Response Fidelity" },
  { value: "< 2s", label: "Response Cadence" },
];

const capabilities = [
  "Contextual destination awareness",
  "RAG-verified factual responses",
  "Multi-language fluency",
  "Sentiment-aware support",
  "Precision service matching",
  "GDPR & CCPA adherent",
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "var(--kv-bg)" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "var(--kv-bg)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--kv-border)" : "none",
          boxShadow: scrolled ? "var(--kv-shadow)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--kv-primary)" }}
            >
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span
              className="heritage-heading text-lg font-semibold tracking-wide"
              style={{ color: "var(--kv-text)" }}
            >
              KEVESTA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Architecture", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--kv-text-secondary)" }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--kv-text)" }}
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--kv-primary)" }}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-32 pb-20">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(61,43,90,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              borderColor: "var(--kv-border)",
              background: "var(--kv-surface)",
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "var(--kv-secondary)" }} />
            <span className="heritage-caption" style={{ color: "var(--kv-text-secondary)" }}>
              Editorial Travel Intelligence
            </span>
          </div>

          <h1
            className="heritage-heading mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            style={{ color: "var(--kv-text)" }}
          >
            Your Companion for{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--kv-primary), var(--kv-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Every
            </span>{" "}
            Destination
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--kv-text-secondary)" }}
          >
            Kevesta weaves together intelligent travel guidance, curated local
            recommendations, and dedicated concierge support into one refined AI
            assistant. Navigate any country with clarity and confidence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 shadow-lg"
              style={{
                background: "var(--kv-primary)",
                boxShadow: "0 4px 20px rgba(61,43,90,0.3)",
              }}
            >
              Begin Your Journey
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/travel-assistant"
              className="inline-flex items-center gap-2 rounded-xl border px-8 py-3.5 text-base font-semibold transition-all hover:shadow-md"
              style={{
                borderColor: "var(--kv-border)",
                color: "var(--kv-text)",
              }}
            >
              Meet the Guide
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p
                  className="heritage-heading text-3xl font-bold"
                  style={{ color: "var(--kv-primary)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24" style={{ background: "var(--kv-bg-secondary)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p
              className="heritage-caption mb-3"
              style={{ color: "var(--kv-secondary)" }}
            >
              Core Modules
            </p>
            <h2
              className="heritage-heading text-3xl font-bold md:text-4xl"
              style={{ color: "var(--kv-text)" }}
            >
              Three Pillars, One Platform
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-lg"
              style={{ color: "var(--kv-text-secondary)" }}
            >
              Three focused AI modules working in concert to make your travel and
              relocation experience seamless and considered.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border p-8 transition-all hover:shadow-lg"
                style={{
                  background: "var(--kv-surface)",
                  borderColor: "var(--kv-border)",
                }}
              >
                <div
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ background: feature.color + "15" }}
                >
                  <feature.icon className="h-7 w-7" style={{ color: feature.color }} />
                </div>
                <h3
                  className="heritage-heading text-xl font-semibold"
                  style={{ color: "var(--kv-text)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--kv-text-secondary)" }}
                >
                  {feature.description}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-colors"
                  style={{ color: feature.color }}
                >
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p
              className="heritage-caption mb-3"
              style={{ color: "var(--kv-secondary)" }}
            >
              Under the Hood
            </p>
            <h2
              className="heritage-heading text-3xl font-bold md:text-4xl"
              style={{ color: "var(--kv-text)" }}
            >
              Refined by Intelligent Architecture
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-lg"
              style={{ color: "var(--kv-text-secondary)" }}
            >
              Built on a robust technical foundation designed for accuracy,
              security, and scale across international markets.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div
              className="rounded-2xl border p-8"
              style={{
                background: "var(--kv-surface)",
                borderColor: "var(--kv-border)",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--kv-primary)" + "15" }}
              >
                <Zap className="h-6 w-6" style={{ color: "var(--kv-primary)" }} />
              </div>
              <h3
                className="heritage-heading text-lg font-semibold"
                style={{ color: "var(--kv-text)" }}
              >
                LLM Core + RAG
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                Retrieval-Augmented Generation grounds every response in verified
                data, eliminating hallucinations and ensuring factual accuracy
                for country-specific guidance.
              </p>
            </div>

            <div
              className="rounded-2xl border p-8"
              style={{
                background: "var(--kv-surface)",
                borderColor: "var(--kv-border)",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--kv-accent)" + "15" }}
              >
                <Globe className="h-6 w-6" style={{ color: "var(--kv-accent)" }} />
              </div>
              <h3
                className="heritage-heading text-lg font-semibold"
                style={{ color: "var(--kv-text)" }}
              >
                Country-Specific Knowledge
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                Dynamic prompts adapt to your geographic context, drawing from
                structured databases of local regulations, cultural norms, and
                service availability.
              </p>
            </div>

            <div
              className="rounded-2xl border p-8"
              style={{
                background: "var(--kv-surface)",
                borderColor: "var(--kv-border)",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--kv-success)" + "15" }}
              >
                <Shield className="h-6 w-6" style={{ color: "var(--kv-success)" }} />
              </div>
              <h3
                className="heritage-heading text-lg font-semibold"
                style={{ color: "var(--kv-text)" }}
              >
                Security & Compliance
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                End-to-end encryption, GDPR and CCPA compliance, and a modular
                microservices architecture built to scale across international
                markets.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {capabilities.map((cap) => (
              <div
                key={cap}
                className="flex items-center gap-2 rounded-full border px-4 py-2"
                style={{
                  borderColor: "var(--kv-border)",
                  background: "var(--kv-surface)",
                }}
              >
                <Check className="h-4 w-4" style={{ color: "var(--kv-success)" }} />
                <span className="text-sm" style={{ color: "var(--kv-text)" }}>
                  {cap}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" style={{ background: "var(--kv-sidebar-bg)" }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="heritage-heading text-3xl font-bold text-white md:text-4xl">
            Your Next Chapter Begins Here
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Join thousands of travelers and expats who trust Kevesta to make
            informed, confident decisions in new destinations.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "var(--kv-primary)",
                boxShadow: "0 4px 20px rgba(61,43,90,0.4)",
              }}
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer
        className="border-t py-12"
        style={{
          background: "var(--kv-bg)",
          borderColor: "var(--kv-border)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--kv-primary)" }}
              >
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span
                className="heritage-heading text-sm font-semibold tracking-wide"
                style={{ color: "var(--kv-text)" }}
              >
                KEVESTA
              </span>
            </div>
            <div className="flex gap-8">
              {["Privacy", "Terms", "Contact", "Help"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm transition-colors hover:opacity-70"
                  style={{ color: "var(--kv-text-secondary)" }}
                >
                  {item}
                </a>
              ))}
            </div>
            <p className="text-sm" style={{ color: "var(--kv-text-tertiary)" }}>
              &copy; {new Date().getFullYear()} Kevesta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

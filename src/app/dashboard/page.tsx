"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Compass,
  MapPin,
  Headphones,
  Globe,
  MessageCircle,
  Star,
  ArrowRight,
  Activity,
  Clock,
  Sparkles,
  Plane,
  Building2,
  CheckCircle2,
  CircleAlert,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import { useAppStore } from "@/lib/store";
import { countries } from "@/data/countries";

type Booking = { id: string; item_type: string; item_title: string; amount: number; currency: string; status: string; updated_at: string; provider: string | null; provider_payment_id: string | null; payment_status: string | null };

const statusCopy: Record<string, { label: string; tone: string }> = {
  paid: { label: "Confirmed", tone: "var(--kv-success)" },
  payment_pending: { label: "Payment pending", tone: "var(--kv-warning)" },
  failed: { label: "Payment failed", tone: "var(--kv-error)" },
  cancelled: { label: "Cancelled", tone: "var(--kv-text-tertiary)" },
  refunded: { label: "Refunded", tone: "var(--kv-primary-light)" },
  intent_created: { label: "Ready to pay", tone: "var(--kv-warning)" },
};

const quickActions = [
  {
    href: "/travel-assistant",
    icon: Compass,
    label: "Destination Guide",
    description: "Curated travel insights",
    color: "#3D2B5A",
  },
  {
    href: "/flights",
    icon: Plane,
    label: "Flight Reservations",
    description: "Search & book securely",
    color: "#5B4180",
  },
  {
    href: "/apartments",
    icon: Building2,
    label: "Curated Stays",
    description: "Handpicked accommodations",
    color: "#C49A6C",
  },
  {
    href: "/services",
    icon: MapPin,
    label: "Local Directory",
    description: "Vetted recommendations",
    color: "#5D8A6E",
  },
  {
    href: "/support",
    icon: Headphones,
    label: "Concierge Desk",
    description: "Dedicated AI support",
    color: "#4A7C6F",
  },
];

export default function DashboardPage() {
  const { currentCountry } = useAppStore();
  const country = countries.find((c) => c.code === currentCountry);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Trips are unavailable.");
        setBookings(payload.bookings || []);
      })
      .catch((error) => setBookingsError(error instanceof Error ? error.message : "Trips are unavailable."))
      .finally(() => setBookingsLoading(false));
  }, []);

  return (
    <AppShell title="Overview">
      <div className="p-6 space-y-6">
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--kv-primary), var(--kv-primary-dark))",
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-white/80" />
              <span className="heritage-caption text-white/80">Welcome back</span>
            </div>
            <h2 className="heritage-heading text-2xl font-bold text-white mb-1">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}.
            </h2>
            <p className="text-white/70 max-w-lg">
              Your travel companion is ready. Currently configured for{" "}
              <span className="font-semibold text-white">
                {country?.flag} {country?.name}
              </span>
              . Ask anything about your destination or explore curated local services.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/25 backdrop-blur-sm"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-64 opacity-10"
            style={{
              background: "radial-gradient(circle at 80% 50%, white, transparent 70%)",
            }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Queries"
            value="128"
            change="+12% this week"
            changeType="positive"
            icon={<MessageCircle className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />}
            iconBg="var(--kv-primary)15"
          />
          <StatCard
            label="Destinations Explored"
            value="8"
            change="+2 this month"
            changeType="positive"
            icon={<Globe className="h-5 w-5" style={{ color: "var(--kv-secondary)" }} />}
            iconBg="var(--kv-secondary)15"
          />
          <StatCard
            label="Services Curated"
            value="34"
            change="Across 6 categories"
            changeType="neutral"
            icon={<Star className="h-5 w-5" style={{ color: "var(--kv-accent)" }} />}
            iconBg="var(--kv-accent)15"
          />
          <StatCard
            label="Issues Resolved"
            value="12"
            change="95% auto-resolved"
            changeType="positive"
            icon={<Activity className="h-5 w-5" style={{ color: "var(--kv-success)" }} />}
            iconBg="var(--kv-success)15"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border" style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--kv-border)" }}>
              <div>
                <h3 className="heritage-heading font-semibold" style={{ color: "var(--kv-text)" }}>My Trips</h3>
                <p className="mt-0.5 text-xs" style={{ color: "var(--kv-text-secondary)" }}>Your booking and payment status, in one place.</p>
              </div>
              <Link href="/flights" className="text-sm font-medium" style={{ color: "var(--kv-primary)" }}>Plan a trip</Link>
            </div>
            {bookingsLoading ? (
              <div className="flex items-center gap-2 px-5 py-10 text-sm" style={{ color: "var(--kv-text-secondary)" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading your trips…</div>
            ) : bookingsError ? (
              <div className="m-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--kv-border)", color: "var(--kv-text-secondary)" }}><p>{bookingsError}</p><Link href="/login" className="mt-2 inline-block font-semibold" style={{ color: "var(--kv-primary)" }}>Sign in to view trips</Link></div>
            ) : bookings.length === 0 ? (
              <div className="px-5 py-10"><p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>Your next chapter starts here.</p><p className="mt-1 max-w-md text-sm" style={{ color: "var(--kv-text-secondary)" }}>Book a flight, stay, or local service and KEVESTA will keep the payment status and next steps connected.</p><Link href="/flights" className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "var(--kv-primary)" }}>Explore flights <ArrowRight className="h-4 w-4" /></Link></div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--kv-border-light)" }}>
                {bookings.slice(0, 5).map((booking) => {
                  const status = statusCopy[booking.status] || { label: booking.status, tone: "var(--kv-text-secondary)" };
                  const Icon = booking.status === "paid" ? CheckCircle2 : booking.status === "failed" ? CircleAlert : Clock;
                  return <div key={booking.id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${status.tone}18`, color: status.tone }}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" style={{ color: "var(--kv-text)" }}>{booking.item_title}</p><p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{booking.provider ? `${booking.provider.toUpperCase()} · ` : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: booking.currency }).format(booking.amount)} · {new Date(booking.updated_at).toLocaleDateString()}</p></div><div className="text-right"><span className="text-xs font-semibold" style={{ color: status.tone }}>{status.label}</span>{booking.status === "failed" && <Link href="/support" className="mt-1 block text-xs font-medium" style={{ color: "var(--kv-primary)" }}>Get help</Link>}</div></div>;
                })}
              </div>
            )}
          </div>

          <div
            className="rounded-xl border"
            style={{
              background: "var(--kv-surface)",
              borderColor: "var(--kv-border)",
            }}
          >
            <div
              className="border-b px-5 py-4"
              style={{ borderColor: "var(--kv-border)" }}
            >
              <h3 className="heritage-heading font-semibold" style={{ color: "var(--kv-text)" }}>
                Quick Explore
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--kv-text-secondary)" }}>
                Popular destinations
              </p>
            </div>
            <div className="p-3 space-y-2">
              {[
                { code: "JP", name: "Japan", queries: 42 },
                { code: "DE", name: "Germany", queries: 35 },
                { code: "SG", name: "Singapore", queries: 28 },
                { code: "GB", name: "United Kingdom", queries: 24 },
                { code: "AU", name: "Australia", queries: 18 },
              ].map((dest) => {
                const c = countries.find((co) => co.code === dest.code);
                return (
                  <Link
                    key={dest.code}
                    href="/travel-assistant"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span className="text-xl">{c?.flag}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>
                        {dest.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                        {dest.queries} queries
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 rounded-xl border p-5 transition-all hover:shadow-md"
              style={{
                background: "var(--kv-surface)",
                borderColor: "var(--kv-border)",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: action.color + "15" }}
              >
                <action.icon className="h-6 w-6" style={{ color: action.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: "var(--kv-text)" }}>
                  {action.label}
                </h3>
                <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                  {action.description}
                </p>
              </div>
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                style={{ color: "var(--kv-text-tertiary)" }}
              />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

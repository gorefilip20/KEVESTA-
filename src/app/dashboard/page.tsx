"use client";

import Link from "next/link";
import {
  Compass,
  MapPin,
  Headphones,
  TrendingUp,
  Globe,
  MessageCircle,
  Star,
  ArrowRight,
  Activity,
  Users,
  Clock,
  Sparkles,
  Plane,
  Building2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import { useAppStore } from "@/lib/store";
import { countries } from "@/data/countries";

const recentActivities = [
  {
    icon: "✈️",
    title: "Flight to London",
    description: "JFK → LHR booked with ETH",
    time: "1 hour ago",
    type: "flight",
  },
  {
    icon: "🇯🇵",
    title: "Japan Travel Guide",
    description: "Explored transport and cultural norms",
    time: "2 hours ago",
    type: "travel",
  },
  {
    icon: "🏠",
    title: "Apartment in Paris",
    description: "Cozy 2BR Loft in Arts District saved",
    time: "4 hours ago",
    type: "apartment",
  },
  {
    icon: "🚕",
    title: "Ride-Hailing in Singapore",
    description: "Got recommendations for Grab and local options",
    time: "5 hours ago",
    type: "services",
  },
  {
    icon: "💬",
    title: "Account Support",
    description: "Password reset resolved automatically",
    time: "1 day ago",
    type: "support",
  },
];

const quickActions = [
  {
    href: "/travel-assistant",
    icon: Compass,
    label: "Travel Guide",
    description: "Get destination insights",
    color: "#6C3CE1",
  },
  {
    href: "/flights",
    icon: Plane,
    label: "Book Flights",
    description: "Search & pay with crypto",
    color: "#4F46E5",
  },
  {
    href: "/apartments",
    icon: Building2,
    label: "Find Stays",
    description: "Apartments worldwide",
    color: "#F97316",
  },
  {
    href: "/services",
    icon: MapPin,
    label: "Find Services",
    description: "Local recommendations",
    color: "#10B981",
  },
  {
    href: "/support",
    icon: Headphones,
    label: "Get Support",
    description: "AI-powered help",
    color: "#06B6D4",
  },
];

export default function DashboardPage() {
  const { currentCountry } = useAppStore();
  const country = countries.find((c) => c.code === currentCountry);

  return (
    <AppShell title="Dashboard">
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
              <span className="text-sm font-medium text-white/80">Welcome back</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}!
            </h2>
            <p className="text-white/70 max-w-lg">
              Your AI travel companion is ready. Currently configured for{" "}
              <span className="font-semibold text-white">
                {country?.flag} {country?.name}
              </span>
              . Ask anything about your destination or explore local services.
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
            label="Countries Explored"
            value="8"
            change="+2 this month"
            changeType="positive"
            icon={<Globe className="h-5 w-5" style={{ color: "var(--kv-secondary)" }} />}
            iconBg="var(--kv-secondary)15"
          />
          <StatCard
            label="Services Found"
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
          <div
            className="lg:col-span-2 rounded-xl border"
            style={{
              background: "var(--kv-surface)",
              borderColor: "var(--kv-border)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--kv-border)" }}
            >
              <h3 className="font-semibold" style={{ color: "var(--kv-text)" }}>
                Recent Activity
              </h3>
              <button
                className="text-sm font-medium"
                style={{ color: "var(--kv-primary)" }}
              >
                View all
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--kv-border-light)" }}>
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                  style={{}}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: "var(--kv-bg-tertiary)" }}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>
                      {activity.title}
                    </p>
                    <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" style={{ color: "var(--kv-text-tertiary)" }} />
                    <span className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
              <h3 className="font-semibold" style={{ color: "var(--kv-text)" }}>
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

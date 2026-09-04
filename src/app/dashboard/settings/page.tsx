"use client";

import { useState } from "react";
import { User, Globe, Bell, Shield, Palette, Save, Check } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAppStore } from "@/lib/store";
import { countries } from "@/data/countries";

export default function SettingsPage() {
  const { currentCountry, setCurrentCountry, theme, setTheme } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "Kevesta User",
    email: "user@kevesta.app",
    language: "en",
    notifications: true,
    emailUpdates: true,
    travelStyle: "moderate",
    dietaryRestrictions: "",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div
          className="rounded-xl border"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--kv-border)" }}>
            <User className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--kv-text)" }}>Profile</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--kv-primary), var(--kv-secondary))" }}
              >
                KV
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--kv-text)" }}>Kevesta User</p>
                <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>Free Plan</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--kv-text-secondary)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "var(--kv-border)",
                    background: "var(--kv-bg-secondary)",
                    color: "var(--kv-text)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--kv-text-secondary)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "var(--kv-border)",
                    background: "var(--kv-bg-secondary)",
                    color: "var(--kv-text)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--kv-border)" }}>
            <Globe className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--kv-text)" }}>Travel Preferences</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--kv-text-secondary)" }}>
                Default Country
              </label>
              <select
                value={currentCountry}
                onChange={(e) => setCurrentCountry(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{
                  borderColor: "var(--kv-border)",
                  background: "var(--kv-bg-secondary)",
                  color: "var(--kv-text)",
                }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--kv-text-secondary)" }}>
                Travel Style
              </label>
              <div className="flex gap-3">
                {["budget", "moderate", "premium"].map((style) => (
                  <button
                    key={style}
                    onClick={() => setFormData({ ...formData, travelStyle: style })}
                    className="flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-all"
                    style={{
                      borderColor: formData.travelStyle === style ? "var(--kv-primary)" : "var(--kv-border)",
                      background: formData.travelStyle === style ? "var(--kv-primary)10" : "var(--kv-bg-secondary)",
                      color: formData.travelStyle === style ? "var(--kv-primary)" : "var(--kv-text)",
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--kv-text-secondary)" }}>
                Dietary Restrictions
              </label>
              <input
                type="text"
                value={formData.dietaryRestrictions}
                onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                placeholder="e.g., Vegetarian, Halal, Gluten-free"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{
                  borderColor: "var(--kv-border)",
                  background: "var(--kv-bg-secondary)",
                  color: "var(--kv-text)",
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--kv-border)" }}>
            <Palette className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--kv-text)" }}>Appearance</h2>
          </div>
          <div className="p-5">
            <div className="flex gap-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="flex-1 rounded-lg border px-3 py-3 text-sm font-medium capitalize transition-all"
                  style={{
                    borderColor: theme === t ? "var(--kv-primary)" : "var(--kv-border)",
                    background: theme === t ? "var(--kv-primary)10" : "var(--kv-bg-secondary)",
                    color: theme === t ? "var(--kv-primary)" : "var(--kv-text)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--kv-border)" }}>
            <Bell className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--kv-text)" }}>Notifications</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: "notifications", label: "Push Notifications", desc: "Get notified about travel updates and alerts" },
              { key: "emailUpdates", label: "Email Updates", desc: "Receive weekly travel digests and tips" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })}
                  className="relative h-6 w-11 rounded-full transition-all"
                  style={{
                    background: formData[item.key as keyof typeof formData] ? "var(--kv-primary)" : "var(--kv-border)",
                  }}
                >
                  <div
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-sm"
                    style={{
                      left: formData[item.key as keyof typeof formData] ? 22 : 2,
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--kv-border)" }}>
            <Shield className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--kv-text)" }}>Privacy & Security</h2>
          </div>
          <div className="p-5 space-y-3">
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: "var(--kv-bg-secondary)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>Data Encryption</p>
                <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>End-to-end encryption for all conversations</p>
              </div>
              <Check className="h-5 w-5" style={{ color: "var(--kv-success)" }} />
            </div>
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: "var(--kv-bg-secondary)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>GDPR Compliant</p>
                <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>Your data is handled per EU regulations</p>
              </div>
              <Check className="h-5 w-5" style={{ color: "var(--kv-success)" }} />
            </div>
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: "var(--kv-bg-secondary)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>CCPA Compliant</p>
                <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>California Consumer Privacy Act compliant</p>
              </div>
              <Check className="h-5 w-5" style={{ color: "var(--kv-success)" }} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--kv-primary)" }}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

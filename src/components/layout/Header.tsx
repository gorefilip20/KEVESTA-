"use client";

import { useState } from "react";
import { Search, Bell, Sun, Moon, Globe } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { countries } from "@/data/countries";

export default function Header({ title }: { title: string }) {
  const { currentCountry, setCurrentCountry, theme, setTheme, sidebarOpen } = useAppStore();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = countries.find((c) => c.code === currentCountry);

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6"
      style={{
        background: "var(--kv-bg)",
        borderColor: "var(--kv-border)",
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
          style={{
            borderColor: "var(--kv-border)",
            background: "var(--kv-bg-secondary)",
          }}
        >
          <Search className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search..."
            className="w-48 bg-transparent text-sm outline-none"
            style={{ color: "var(--kv-text)" }}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCountryPicker(!showCountryPicker)}
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--kv-border)",
              background: "var(--kv-bg-secondary)",
              color: "var(--kv-text)",
            }}
          >
            <span className="text-base">{selectedCountry?.flag}</span>
            <span className="hidden sm:inline">{selectedCountry?.name}</span>
            <Globe className="h-3.5 w-3.5" style={{ color: "var(--kv-text-tertiary)" }} />
          </button>

          {showCountryPicker && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-lg overflow-hidden"
              style={{
                background: "var(--kv-surface)",
                borderColor: "var(--kv-border)",
                boxShadow: "var(--kv-shadow-lg)",
              }}
            >
              <div className="p-3 border-b" style={{ borderColor: "var(--kv-border)" }}>
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "var(--kv-border)",
                    background: "var(--kv-bg-secondary)",
                    color: "var(--kv-text)",
                  }}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setCurrentCountry(country.code);
                      setShowCountryPicker(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{
                      color: "var(--kv-text)",
                      background:
                        country.code === currentCountry
                          ? "var(--kv-bg-tertiary)"
                          : undefined,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        country.code === currentCountry ? "var(--kv-bg-tertiary)" : "transparent";
                    }}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{country.name}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                        {country.currency}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
          style={{
            borderColor: "var(--kv-border)",
            background: "var(--kv-bg-secondary)",
            color: "var(--kv-text)",
          }}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
          style={{
            borderColor: "var(--kv-border)",
            background: "var(--kv-bg-secondary)",
            color: "var(--kv-text)",
          }}
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: "var(--kv-error)" }}
          />
        </button>
      </div>
    </header>
  );
}

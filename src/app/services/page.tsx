"use client";

import { useState, useCallback } from "react";
import { Star, ExternalLink, MapPin, Filter, Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ChatInterface from "@/components/chat/ChatInterface";
import { useAppStore } from "@/lib/store";
import { countries } from "@/data/countries";
import { serviceCategories, getServicesForCountry, getServicesByCategory } from "@/data/services";
import { generateServiceResponse } from "@/lib/ai-engine";
import { generateId } from "@/lib/utils";
import type { Message, ServiceRecommendation } from "@/types";

const suggestions = [
  "Best ride-hailing apps here?",
  "Find me accommodation",
  "Food delivery options?",
  "Recommend a digital bank",
];

function ServiceCard({ service }: { service: ServiceRecommendation }) {
  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md"
      style={{
        background: "var(--kv-surface)",
        borderColor: "var(--kv-border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold" style={{ color: "var(--kv-text)" }}>
            {service.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  fill={i < Math.floor(service.rating) ? "var(--kv-warning)" : "none"}
                  style={{
                    color: i < Math.floor(service.rating) ? "var(--kv-warning)" : "var(--kv-border)",
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
              {service.rating}
            </span>
            {service.priceRange && (
              <span
                className="text-xs font-medium rounded px-1.5 py-0.5"
                style={{
                  background: "var(--kv-bg-tertiary)",
                  color: "var(--kv-text-secondary)",
                }}
              >
                {service.priceRange}
              </span>
            )}
          </div>
        </div>
        {service.url && (
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{
              background: "var(--kv-bg-tertiary)",
              color: "var(--kv-text-secondary)",
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--kv-text-secondary)" }}>
        {service.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {service.features.slice(0, 4).map((feature) => (
          <span
            key={feature}
            className="rounded-full px-2.5 py-1 text-xs"
            style={{
              background: "var(--kv-primary)" + "10",
              color: "var(--kv-primary)",
            }}
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { currentCountry } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const country = countries.find((c) => c.code === currentCountry);
  const countryServices = getServicesForCountry(currentCountry);

  const filteredServices = activeCategory
    ? countryServices.filter((s) => s.category === activeCategory)
    : countryServices;

  const searchedServices = searchQuery
    ? filteredServices.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredServices;

  const handleSendMessage = useCallback(
    async (content: string) => {
      setShowChat(true);
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await generateServiceResponse(content, currentCountry);
        setMessages((prev) => [...prev, response]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentCountry]
  );

  return (
    <AppShell title="Local Services">
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--kv-text)" }}>
                  Services in {country?.flag} {country?.name}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--kv-text-secondary)" }}>
                  {countryServices.length} services available in your area
                </p>
              </div>
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "var(--kv-secondary)" }}
              >
                <MapPin className="h-4 w-4" />
                {showChat ? "Browse Services" : "Ask AI"}
              </button>
            </div>

            <div className="flex gap-3 mb-4 items-center">
              <div
                className="flex flex-1 items-center gap-2 rounded-xl border px-4 py-2.5"
                style={{
                  borderColor: "var(--kv-border)",
                  background: "var(--kv-surface)",
                }}
              >
                <Search className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--kv-text)" }}
                />
              </div>
              <div className="flex gap-2">
                <Filter className="h-4 w-4" style={{ color: "var(--kv-text-tertiary)" }} />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: !activeCategory ? "var(--kv-primary)" : "var(--kv-surface)",
                  color: !activeCategory ? "#fff" : "var(--kv-text)",
                  border: `1px solid ${!activeCategory ? "var(--kv-primary)" : "var(--kv-border)"}`,
                }}
              >
                All ({countryServices.length})
              </button>
              {serviceCategories.map((cat) => {
                const count = countryServices.filter((s) => s.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all"
                    style={{
                      background: activeCategory === cat.id ? "var(--kv-primary)" : "var(--kv-surface)",
                      color: activeCategory === cat.id ? "#fff" : "var(--kv-text)",
                      border: `1px solid ${activeCategory === cat.id ? "var(--kv-primary)" : "var(--kv-border)"}`,
                    }}
                  >
                    {cat.icon} {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {showChat ? (
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: "var(--kv-border)",
                height: "calc(100vh - 20rem)",
              }}
            >
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={`Find services in ${country?.name}...`}
                suggestions={suggestions}
                accentColor="var(--kv-secondary)"
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {searchedServices.length > 0 ? (
                searchedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : (
                <div
                  className="col-span-2 rounded-xl border p-12 text-center"
                  style={{
                    background: "var(--kv-surface)",
                    borderColor: "var(--kv-border)",
                  }}
                >
                  <MapPin
                    className="mx-auto mb-3 h-10 w-10"
                    style={{ color: "var(--kv-text-tertiary)" }}
                  />
                  <h3 className="font-semibold" style={{ color: "var(--kv-text)" }}>
                    No services found
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--kv-text-secondary)" }}>
                    Try a different search or category, or ask the AI assistant for recommendations.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useState, useCallback } from "react";
import { MapPin, Info } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ChatInterface from "@/components/chat/ChatInterface";
import CategoryCard from "@/components/ui/CategoryCard";
import { useAppStore } from "@/lib/store";
import { countries, guidanceCategories } from "@/data/countries";
import { generateTravelResponse } from "@/lib/ai-engine";
import { generateId } from "@/lib/utils";
import type { Message } from "@/types";

const suggestions = [
  "What transport options are available?",
  "How do payments work here?",
  "Tell me about local customs",
  "What should I know about safety?",
  "What local services are useful?",
];

export default function TravelAssistantPage() {
  const { currentCountry } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const country = countries.find((c) => c.code === currentCountry);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await generateTravelResponse(content, currentCountry, messages);
        setMessages((prev) => [...prev, response]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentCountry, messages]
  );

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const category = guidanceCategories.find((c) => c.id === categoryId);
    if (category) {
      handleSendMessage(`Tell me about ${category.title.toLowerCase()} in ${country?.name || "this country"}`);
    }
  };

  return (
    <AppShell title="AI Travel Assistant">
      <div className="flex h-[calc(100vh-4rem)]">
        <div
          className="hidden lg:flex w-80 flex-col border-r overflow-y-auto"
          style={{
            background: "var(--kv-bg)",
            borderColor: "var(--kv-border)",
          }}
        >
          <div className="p-4 space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--kv-primary)" + "08" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--kv-primary)" + "20" }}
                >
                  <MapPin className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
                    {country?.flag} {country?.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
                    {country?.currency} · {country?.language}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Info className="h-3 w-3" style={{ color: "var(--kv-text-tertiary)" }} />
                <span className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                  Change country in the header to switch context
                </span>
              </div>
            </div>

            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
                style={{ color: "var(--kv-text-tertiary)" }}
              >
                Guidance Categories
              </h3>
              <div className="space-y-2">
                {guidanceCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    icon={category.icon}
                    title={category.title}
                    description={category.description}
                    active={activeCategory === category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    count={category.items.length}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={`Ask about ${country?.name || "your destination"}...`}
            suggestions={suggestions}
            accentColor="var(--kv-primary)"
          />
        </div>
      </div>
    </AppShell>
  );
}

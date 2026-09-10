"use client";

import { useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Zap,
  Shield,
  Brain,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ChatInterface from "@/components/chat/ChatInterface";
import { generateSupportResponse } from "@/lib/ai-engine";
import { generateId } from "@/lib/utils";
import type { Message } from "@/types";

interface TicketSummary {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "escalated" | "resolved";
  priority: "low" | "medium" | "high";
  time: string;
  sentiment: string;
}

const mockTickets: TicketSummary[] = [
  { id: "T-001", subject: "Password reset assistance", status: "resolved", priority: "low", time: "2h ago", sentiment: "neutral" },
  { id: "T-002", subject: "Service recommendation issue", status: "resolved", priority: "medium", time: "1d ago", sentiment: "negative" },
  { id: "T-003", subject: "Account update request", status: "in_progress", priority: "medium", time: "3h ago", sentiment: "neutral" },
  { id: "T-004", subject: "Billing question", status: "resolved", priority: "low", time: "2d ago", sentiment: "positive" },
];

const supportFeatures = [
  {
    icon: Brain,
    title: "NLP Understanding",
    description: "Understands intent, tone, and urgency instantly",
    color: "var(--kv-primary)",
  },
  {
    icon: Zap,
    title: "Auto-Resolution",
    description: "Resolves common issues like password resets automatically",
    color: "var(--kv-secondary)",
  },
  {
    icon: Shield,
    title: "Smart Escalation",
    description: "Routes complex cases with full context to human support",
    color: "var(--kv-accent)",
  },
];

const suggestions = [
  "I need to reset my password",
  "Check my account status",
  "I have a billing issue",
  "Update my contact information",
];

const statusConfig = {
  open: { label: "Open", color: "var(--kv-warning)", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "var(--kv-accent)", icon: Clock },
  escalated: { label: "Escalated", color: "var(--kv-error)", icon: ArrowUpRight },
  resolved: { label: "Resolved", color: "var(--kv-success)", icon: CheckCircle },
};

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supportInfo, setSupportInfo] = useState<{
    sentiment: string;
    urgency: string;
    canAutoResolve: boolean;
  } | null>(null);

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
        const result = await generateSupportResponse(content, messages);
        setMessages((prev) => [...prev, result.message]);
        setSupportInfo({
          sentiment: result.sentiment,
          urgency: result.urgency,
          canAutoResolve: result.canAutoResolve,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <AppShell title="Support Center">
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Describe your issue or ask a question..."
            suggestions={suggestions}
            accentColor="var(--kv-accent)"
          />
        </div>

        <div
          className="hidden lg:flex w-80 flex-col border-l overflow-y-auto"
          style={{
            background: "var(--kv-bg)",
            borderColor: "var(--kv-border)",
          }}
        >
          <div className="p-4 space-y-4">
            {supportInfo && (
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: "var(--kv-border)",
                  background: "var(--kv-surface)",
                }}
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--kv-text-tertiary)" }}>
                  Analysis
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>Sentiment</span>
                    <span
                      className="text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        background:
                          supportInfo.sentiment === "positive"
                            ? "var(--kv-success)15"
                            : supportInfo.sentiment === "negative"
                            ? "var(--kv-error)15"
                            : "var(--kv-bg-tertiary)",
                        color:
                          supportInfo.sentiment === "positive"
                            ? "var(--kv-success)"
                            : supportInfo.sentiment === "negative"
                            ? "var(--kv-error)"
                            : "var(--kv-text-secondary)",
                      }}
                    >
                      {supportInfo.sentiment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>Urgency</span>
                    <span
                      className="text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        background:
                          supportInfo.urgency === "high"
                            ? "var(--kv-error)15"
                            : supportInfo.urgency === "medium"
                            ? "var(--kv-warning)15"
                            : "var(--kv-bg-tertiary)",
                        color:
                          supportInfo.urgency === "high"
                            ? "var(--kv-error)"
                            : supportInfo.urgency === "medium"
                            ? "var(--kv-warning)"
                            : "var(--kv-text-secondary)",
                      }}
                    >
                      {supportInfo.urgency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>Auto-resolvable</span>
                    <span
                      className="text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        background: supportInfo.canAutoResolve ? "var(--kv-success)15" : "var(--kv-bg-tertiary)",
                        color: supportInfo.canAutoResolve ? "var(--kv-success)" : "var(--kv-text-secondary)",
                      }}
                    >
                      {supportInfo.canAutoResolve ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "var(--kv-text-tertiary)" }}>
                AI Capabilities
              </h4>
              <div className="space-y-3">
                {supportFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: "var(--kv-surface)" }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: feature.color + "15" }}
                    >
                      <feature.icon className="h-4 w-4" style={{ color: feature.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--kv-text)" }}>
                        {feature.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--kv-text-secondary)" }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "var(--kv-text-tertiary)" }}>
                Recent Tickets
              </h4>
              <div className="space-y-2">
                {mockTickets.map((ticket) => {
                  const config = statusConfig[ticket.status];
                  return (
                    <div
                      key={ticket.id}
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: "var(--kv-border-light)",
                        background: "var(--kv-surface)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono" style={{ color: "var(--kv-text-tertiary)" }}>
                          {ticket.id}
                        </span>
                        <div className="flex items-center gap-1">
                          <config.icon className="h-3 w-3" style={{ color: config.color }} />
                          <span className="text-xs font-medium" style={{ color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium" style={{ color: "var(--kv-text)" }}>
                        {ticket.subject}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--kv-text-tertiary)" }}>
                        {ticket.time}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

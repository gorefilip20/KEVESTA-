"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Sparkles, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import type { Message } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestions?: string[];
  accentColor?: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
        style={{ background: "var(--kv-primary)", color: "#fff" }}
      >
        K
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: "var(--kv-chat-ai)" }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{
                background: "var(--kv-primary)",
                animation: `typing-dot 1.4s infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        "animate-fade-in"
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
        style={{
          background: isUser ? "var(--kv-secondary)" : "var(--kv-primary)",
          color: "#fff",
        }}
      >
        {isUser ? "Y" : "K"}
      </div>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser ? "rounded-tr-sm" : "rounded-tl-sm"
          )}
          style={{
            background: isUser ? "var(--kv-chat-user)" : "var(--kv-chat-ai)",
            color: isUser ? "#fff" : "var(--kv-text)",
          }}
        >
          {message.content.split("\n").map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-semibold mb-1">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (line.startsWith("• ") || line.startsWith("- ")) {
              return (
                <p key={i} className="ml-3 mb-0.5">
                  {line}
                </p>
              );
            }
            if (line.startsWith("---")) {
              return <hr key={i} className="my-2 border-current opacity-20" />;
            }
            if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
              return (
                <p key={i} className="text-xs opacity-70 mt-1 italic">
                  {line.replace(/\*/g, "")}
                </p>
              );
            }
            if (line.match(/^\d+\./)) {
              return (
                <p key={i} className="ml-3 mb-0.5">
                  {line}
                </p>
              );
            }
            return line ? (
              <p key={i} className="mb-1">
                {line}
              </p>
            ) : (
              <br key={i} />
            );
          })}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
            {formatDate(message.timestamp)}
          </span>
          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="rounded p-1 transition-colors hover:opacity-70"
                style={{ color: "var(--kv-text-tertiary)" }}
                title="Copy"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                className="rounded p-1 transition-colors hover:opacity-70"
                style={{ color: "var(--kv-text-tertiary)" }}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                className="rounded p-1 transition-colors hover:opacity-70"
                style={{ color: "var(--kv-text-tertiary)" }}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
              {message.metadata?.confidence && (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-xs"
                  style={{
                    background: "var(--kv-bg-tertiary)",
                    color: "var(--kv-text-secondary)",
                  }}
                >
                  {Math.round(message.metadata.confidence * 100)}% confident
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  suggestions = [],
  accentColor,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${accentColor || "var(--kv-primary)"}15` }}
            >
              <Sparkles className="h-8 w-8" style={{ color: accentColor || "var(--kv-primary)" }} />
            </div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
              How can I help you today?
            </h3>
            <p className="mb-6 max-w-md text-sm" style={{ color: "var(--kv-text-secondary)" }}>
              Ask me anything about your destination, local services, or get support with any issues.
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(suggestion)}
                    className="rounded-full border px-4 py-2 text-sm transition-all hover:shadow-md"
                    style={{
                      borderColor: "var(--kv-border)",
                      color: "var(--kv-text)",
                      background: "var(--kv-surface)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = accentColor || "var(--kv-primary)";
                      (e.currentTarget as HTMLElement).style.color = accentColor || "var(--kv-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--kv-border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--kv-text)";
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <div
        className="border-t p-4"
        style={{
          background: "var(--kv-bg)",
          borderColor: "var(--kv-border)",
        }}
      >
        <div
          className="flex items-end gap-3 rounded-xl border p-3 transition-all focus-within:ring-2"
          style={{
            borderColor: "var(--kv-border)",
            background: "var(--kv-surface)",
          }}
        >
          <button
            className="shrink-0 rounded-lg p-2 transition-colors hover:opacity-70"
            style={{ color: "var(--kv-text-tertiary)" }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none"
            style={{
              color: "var(--kv-text)",
              minHeight: "24px",
              maxHeight: "120px",
            }}
          />
          <button
            className="shrink-0 rounded-lg p-2 transition-colors hover:opacity-70"
            style={{ color: "var(--kv-text-tertiary)" }}
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-lg p-2 text-white transition-all disabled:opacity-40"
            style={{
              background: accentColor || "var(--kv-primary)",
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
          Kevesta AI may produce inaccurate information. Verify important details.
        </p>
      </div>
    </div>
  );
}

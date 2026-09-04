"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
  iconBg?: string;
}

export default function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBg,
}: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "var(--kv-success)"
      : changeType === "negative"
      ? "var(--kv-error)"
      : "var(--kv-text-tertiary)";

  return (
    <div
      className="rounded-xl border p-5 transition-all hover:shadow-md"
      style={{
        background: "var(--kv-surface)",
        borderColor: "var(--kv-border)",
        boxShadow: "var(--kv-shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--kv-text-secondary)" }}>
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold" style={{ color: "var(--kv-text)" }}>
            {value}
          </p>
          {change && (
            <p className="mt-1 text-xs font-medium" style={{ color: changeColor }}>
              {change}
            </p>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: iconBg || "var(--kv-primary)" + "15" }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

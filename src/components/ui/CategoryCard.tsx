"use client";

interface CategoryCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
  active?: boolean;
  count?: number;
}

export default function CategoryCard({
  icon,
  title,
  description,
  onClick,
  active = false,
  count,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md w-full"
      style={{
        background: active ? `var(--kv-primary)08` : "var(--kv-surface)",
        borderColor: active ? "var(--kv-primary)" : "var(--kv-border)",
        boxShadow: active ? "var(--kv-shadow)" : "var(--kv-shadow-sm)",
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{
          background: active ? "var(--kv-primary)" + "20" : "var(--kv-bg-tertiary)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>
            {title}
          </h3>
          {count !== undefined && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: "var(--kv-primary)" + "15",
                color: "var(--kv-primary)",
              }}
            >
              {count}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--kv-text-secondary)" }}>
          {description}
        </p>
      </div>
    </button>
  );
}

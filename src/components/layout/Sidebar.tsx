"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Headphones,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/travel-assistant", label: "Travel Assistant", icon: Compass },
  { href: "/services", label: "Local Services", icon: MapPin },
  { href: "/support", label: "Support", icon: Headphones },
];

const bottomItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20"
      )}
      style={{ background: "var(--kv-sidebar-bg)" }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--kv-primary)" }}
          >
            <Globe className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-white tracking-tight">
              KEVESTA
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {sidebarOpen && (
        <div className="mx-4 mb-4 rounded-xl p-3" style={{ background: "var(--kv-sidebar-hover)" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--kv-secondary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--kv-sidebar-text)" }}>
              AI-Powered Assistant
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white shadow-lg"
                  : "hover:text-white"
              )}
              style={{
                background: isActive ? "var(--kv-sidebar-active)" : undefined,
                color: isActive ? "#fff" : "var(--kv-sidebar-text)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--kv-sidebar-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-4">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive ? "text-white" : ""
              )}
              style={{
                background: isActive ? "var(--kv-sidebar-active)" : undefined,
                color: isActive ? "#fff" : "var(--kv-sidebar-text)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--kv-sidebar-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}

        {sidebarOpen && (
          <div className="mt-3 rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                KV
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Kevesta User</p>
                <p className="text-xs truncate" style={{ color: "var(--kv-sidebar-text)" }}>Free Plan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

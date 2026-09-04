"use client";

import { useAppStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 256 : 80 }}
      >
        <Header title={title} />
        <main
          className="flex-1"
          style={{ background: "var(--kv-bg-secondary)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

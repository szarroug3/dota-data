"use client";
import { useSidebar } from "@/contexts/sidebar-context";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { collapsed } = useSidebar();
  // Always have minimum left padding (pl-16), increase to pl-64 when sidebar is expanded
  const className = `flex-1 p-6 bg-background transition-all duration-300 ${collapsed ? "pl-20" : "pl-64"}`;

  return (
    <main className={className}>
      <div className="dashboard-content">
        {children}
      </div>
    </main>
  );
}

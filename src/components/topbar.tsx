"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState } from "react";

export function TopBar() {
  const { preferredSite, setPreferredSite } = useSidebar();
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-background border-b shadow-sm sticky top-0 z-30">
      <span className="text-lg font-bold tracking-tight">
        Dota Drafting Assistant
      </span>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreferredSite('dotabuff')}
            className={`rounded-full p-1 border-2 transition-colors ${preferredSite === 'dotabuff' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-transparent'}`}
            title="Use Dotabuff"
            onMouseEnter={() => setHovered('dotabuff')}
            onMouseLeave={() => setHovered(null)}
          >
            <img
              src="https://www.dotabuff.com/favicon.ico"
              alt="Dotabuff"
              className="w-6 h-6"
              style={{ filter: preferredSite === 'dotabuff' || hovered === 'dotabuff' ? '' : 'grayscale(1) opacity(0.5)' }}
            />
          </button>
          <button
            onClick={() => setPreferredSite('opendota')}
            className={`rounded-full p-1 border-2 transition-colors ${preferredSite === 'opendota' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900' : 'border-transparent'}`}
            title="Use OpenDota"
            onMouseEnter={() => setHovered('opendota')}
            onMouseLeave={() => setHovered(null)}
          >
            <img
              src="https://www.opendota.com/assets/images/icons/icon-72x72.png"
              alt="OpenDota"
              className="w-6 h-6"
              style={{ filter: preferredSite === 'opendota' || hovered === 'opendota' ? '' : 'grayscale(1) opacity(0.5)' }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { logWithTimestamp } from '@/lib/utils';
import type { PreferredSite } from "@/types/contexts";
import {
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  Home,
  LineChart,
  Moon,
  Share2,
  Sun,
  Sword,
  Users
} from "lucide-react";
import { useTheme } from 'next-themes';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ComponentType, useEffect, useRef, useState } from "react";
import { Dota2ProTrackerIcon, DotabuffIcon, OpenDotaIcon, StratzIcon } from "./icons/ExternalSiteIcons";

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home className="w-5 h-5 text-blue-500" />,
  },
  {
    href: "/dashboard/team-analysis",
    label: "Team Analysis",
    icon: <Users className="w-5 h-5 text-green-500" />,
  },
  {
    href: "/dashboard/draft-suggestions",
    label: "Draft Suggestions",
    icon: <Sword className="w-5 h-5 text-red-500" />,
  },
  {
    href: "/dashboard/player-stats",
    label: "Player Stats",
    icon: <BarChart2 className="w-5 h-5 text-yellow-500" />,
  },
  {
    href: "/dashboard/match-history",
    label: "Match History",
    icon: <Calendar className="w-5 h-5 text-purple-500" />,
  },
  {
    href: "/dashboard/meta-insights",
    label: "Meta Insights",
    icon: <LineChart className="w-5 h-5 text-orange-500" />,
  },
  {
    href: "/dashboard/team-management",
    label: "Team Management",
    icon: <Users className="w-5 h-5 text-gray-500" />,
  },
];

interface DashboardConfig {
  filters: { role: string; patch: string };
  layout: string;
  timestamp: number;
}

function hashConfig(config: DashboardConfig): string {
  // Simple hash function for demo (not cryptographically secure)
  const str = JSON.stringify(config);
  let hash = 0,
    i,
    chr;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Helper for safe className merge
function mergeIconClassName(icon: React.ReactElement, extra: string): string {
  // Type guard for className property
  const orig = (icon && icon.props && typeof (icon.props as { className?: string }).className === 'string')
    ? (icon.props as { className?: string }).className
    : '';
  return `${orig} ${extra}`.trim();
}

type ExternalResourceLink = {
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
};

// ExternalResources: external resource links
function ExternalResources({ collapsed }: { collapsed: boolean }) {
  const externalResourceLinks: ExternalResourceLink[] = [
    { label: 'Dotabuff', url: 'https://www.dotabuff.com/', icon: DotabuffIcon, iconClass: 'text-red-500' },
    { label: 'OpenDota', url: 'https://www.opendota.com/', icon: OpenDotaIcon, iconClass: 'text-green-500' },
    { label: 'Dota2ProTracker', url: 'https://www.dota2protracker.com/', icon: Dota2ProTrackerIcon, iconClass: 'text-orange-500' },
    { label: 'STRATZ', url: 'https://www.stratz.com/', icon: StratzIcon, iconClass: 'text-blue-500' },
  ];
  return (
    <nav className="flex flex-col gap-1 px-2 mt-0 mb-2">
      {externalResourceLinks.map((link, idx) => (
        <a
          key={link.url || link.label || idx}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center h-10 rounded transition-colors font-medium text-sm hover:bg-accent/40 text-muted-foreground gap-3 px-3 relative`}
          title={collapsed ? link.label : undefined}
        >
          <span className="absolute left-3 w-5 h-5 flex items-center justify-center" data-icon-debug={link.label.replace(/[^a-zA-Z0-9]/g, '')}>
            {typeof link.icon === 'function' ? (
              React.createElement(link.icon, { className: `w-5 h-5 ${link.iconClass} text-neutral-800 dark:text-white` })
            ) : null}
          </span>
          <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
        </a>
      ))}
    </nav>
  );
}

// ThemeAndSiteToggle: theme and preferred site toggles
function Settings({ collapsed, theme, setTheme, preferredSite, setPreferredSite }: {
  collapsed: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  preferredSite: PreferredSite;
  setPreferredSite: (site: PreferredSite) => void;
}) {
  return !collapsed ? (
    <div className="px-3 mb-4 flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-2 h-10">
        <Sun className="w-5 h-5" />
        <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} className="" />
        <Moon className="w-5 h-5" />
      </div>
      <div className="flex items-center justify-center gap-2 h-10">
        <DotabuffIcon className="w-5 h-5 text-red-500" />
        <Switch checked={preferredSite === 'opendota'} onCheckedChange={(checked) => setPreferredSite(checked ? 'opendota' : 'dotabuff')} className="" />
        <OpenDotaIcon className="w-5 h-5 text-green-500" />
      </div>
    </div>
  ) : (
    <div className="px-3 mb-4 flex flex-col items-center gap-4">
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="flex items-center justify-center w-10 h-10 rounded hover:bg-accent/40"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
      <button
        onClick={() => setPreferredSite(preferredSite === 'dotabuff' ? 'opendota' : 'dotabuff')}
        className="flex items-center justify-center w-10 h-10 rounded hover:bg-accent/40"
        aria-label="Toggle preferred site"
      >
        {preferredSite === 'dotabuff' ? (
          <OpenDotaIcon className="w-5 h-5 text-green-500" />
        ) : (
          <DotabuffIcon className="w-5 h-5 text-red-500" />
        )}
      </button>
    </div>
  );
}

// SidebarHeader: title and collapse button
function SidebarHeader({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (c: boolean) => void }) {
  return (
    <div
      className="flex items-center w-full flex-shrink-0 justify-between px-3"
      style={{ height: 56, minHeight: 56, maxHeight: 56 }}
    >
      {/* Only render title when not collapsed */}
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight transition-all duration-300 break-words min-w-max">
          Dota Data Assistant
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full p-2 hover:bg-accent/40 transition-colors ${collapsed ? "mx-auto" : "ml-2"}`}
        aria-label="Collapse sidebar"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}

// ShareButton: share config logic and UI
function ShareButton({
  collapsed,
  dashboardConfig
}: {
  collapsed: boolean;
  dashboardConfig: DashboardConfig;
}) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Save config and generate shareable link
  const saveConfig = async () => {
    const configToHash = { ...dashboardConfig };
    const { timestamp: _timestamp, ...configToHashNoTimestamp } = configToHash;
    const id = hashConfig(configToHashNoTimestamp as DashboardConfig);
    // Check if config already exists
    const res = await fetch(`/api/configs/${id}`);
    if (res.ok) {
      // Config exists, just use the link
      const url = `${window.location.origin}/dashboard?config=${id}`;
      setShareLink(url);
      setShowShare(true);
      return;
    }
    // Save new config
    await fetch(`/api/configs/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboardConfig),
    });
    const url = `${window.location.origin}/dashboard?config=${id}`;
    setShareLink(url);
    setShowShare(true);
  };

  const copyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="px-3 mb-2">
      {!collapsed ? (
        <>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-start"
            onClick={saveConfig}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          {showShare && shareLink && (
            <div className="mt-2 p-2 rounded bg-muted text-xs text-foreground shadow-lg">
              <div className="mb-1 font-semibold">Shareable link:</div>
              <a
                href={shareLink}
                className="underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {shareLink}
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 flex items-center gap-1"
                onClick={copyLink}
              >
                {copied ? (
                  <ClipboardCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => setShowShare(false)}
              >
                Close
              </Button>
            </div>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="w-full"
          onClick={saveConfig}
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// MainNavLinks: main navigation links
function MainNavLinks({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 px-2 my-2">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center h-10 rounded transition-colors font-medium text-sm hover:bg-accent/40 ${pathname === link.href ? "bg-accent/60 text-primary" : "text-muted-foreground"} gap-3 px-3 relative`}
        >
          <span className="absolute left-3 w-5 h-5 flex items-center justify-center" data-icon-debug={link.label.replace(/[^a-zA-Z0-9]/g, '')}>
            {React.isValidElement(link.icon)
              ? React.cloneElement(link.icon, { className: mergeIconClassName(link.icon, 'w-5 h-5') } as React.HTMLAttributes<HTMLElement>)
              : null}
          </span>
          <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// QuickLinks: external quick links
function QuickLinks({ collapsed, externalLinks }: { collapsed: boolean; externalLinks: { href?: string; label?: string; icon?: React.ReactElement }[] }) {
  if (!externalLinks || externalLinks.length === 0) return null;
  return (
    <nav className="flex flex-col gap-1 px-2 mt-0 mb-2">
      {externalLinks.map((link, idx) => (
        <a
          key={link.href || link.label || idx}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center h-10 rounded transition-colors font-medium text-sm hover:bg-accent/40 text-muted-foreground gap-3 px-3 relative`}
          style={{ textDecoration: 'none', listStyle: 'none' }}
          title={collapsed ? link.label : undefined}
        >
          <span className="absolute left-3 w-5 h-5 flex items-center justify-center" data-icon-debug={link.label?.replace(/[^a-zA-Z0-9]/g, '') || ''}>
            {React.isValidElement(link.icon)
              ? React.cloneElement(link.icon, { className: mergeIconClassName(link.icon, 'w-5 h-5') } as React.HTMLAttributes<HTMLElement>)
              : null}
          </span>
          <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
        </a>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const { collapsed, setCollapsed, preferredSite, setPreferredSite } =
    useSidebar();
  const pathname = usePathname();
  const { getExternalLinks } = useTeam();
  const externalLinks = getExternalLinks();
  const { theme, setTheme } = useTheme();

  // Adaptive polling state
  const pollingState = useRef({
    intervalMs: 1000,
    lastActive: false,
    destroyed: false,
    timeoutId: undefined as undefined | NodeJS.Timeout,
    active: false,
  });

  useEffect(() => {
    const currentPollingState = pollingState.current;
    currentPollingState.active = true;
    currentPollingState.destroyed = false;
    logWithTimestamp('log', '[Sidebar][Polling] Polling loop started');
    return () => {
      currentPollingState.destroyed = true;
      currentPollingState.active = false;
      if (currentPollingState.timeoutId) clearTimeout(currentPollingState.timeoutId);
      logWithTimestamp('log', '[Sidebar][Polling] Polling loop stopped');
    };
  }, []);

  // Mock dashboard config object
  const dashboardConfig: DashboardConfig = {
    filters: { role: "carry", patch: "7.36" },
    layout: "compact",
    timestamp: 0, // Don't include timestamp in hash for idempotency
  };

  // Log icon absolute positions during animation
  useEffect(() => {
    const logIconPositions = () => {
      const icons = document.querySelectorAll('[data-icon-debug]');
      logWithTimestamp('log', `[Sidebar] Icon absolute positions (collapsed: ${collapsed}):`);
      logWithTimestamp('log', `[Sidebar] Found ${icons.length} icons with data-icon-debug`);
      if (icons.length === 0) {
        logWithTimestamp('log', '[Sidebar] No icons found with data-icon-debug attribute');
        return;
      }
    };
    // Log immediately when collapsed state changes
    logIconPositions();
    // Log during animation (multiple times)
    const intervals: NodeJS.Timeout[] = [];
    for (let i = 1; i <= 10; i++) {
      intervals.push(setTimeout(logIconPositions, i * 20)); // Log every 20ms for 200ms
    }
    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [collapsed]);

  return (
    <aside
      className={`bg-card text-card-foreground border-r border-border flex flex-col transition-all duration-200 ease-in-out ${collapsed ? "w-16" : "w-64"} h-screen fixed top-0 left-0 z-40 min-h-0 overflow-x-hidden`}
      style={{ minWidth: collapsed ? 64 : 256 }}
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col relative overflow-x-hidden">
          <SidebarHeader collapsed={collapsed} setCollapsed={setCollapsed} />
          <div className={`border-b border-border mx-3 mb-2 ${collapsed ? "border-transparent" : ""}`} />
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <ShareButton collapsed={collapsed} dashboardConfig={dashboardConfig} />
            <MainNavLinks collapsed={collapsed} pathname={pathname} />
            <div className="border-t border-border mx-3 my-2" />
            <ExternalResources collapsed={collapsed} />
            <div className="border-t border-border mx-3 my-2" />
            <QuickLinks collapsed={collapsed} externalLinks={externalLinks} />
            <div className="flex-1" />
            <div className="border-t border-border mx-3 my-2" />
            <Settings
              collapsed={collapsed}
              theme={theme}
              setTheme={setTheme}
              preferredSite={preferredSite}
              setPreferredSite={setPreferredSite}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
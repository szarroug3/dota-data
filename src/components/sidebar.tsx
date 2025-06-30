"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { getQueueStatsFromAPI } from "@/lib/api";
import { logWithTimestamp } from '@/lib/utils';
import {
  Activity,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clipboard,
  ClipboardCheck,
  Clock,
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

// Minimal outline SVGs for external resources
const DotabuffIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#ef4444" fill="none" strokeWidth={2.5} />
    <text
      x="12"
      y="13.5"
      textAnchor="middle"
      fontSize="11"
      fill="#ef4444"
      fontFamily="Arial, sans-serif"
      dominantBaseline="middle"
      fontWeight="normal"
    >
      D
    </text>
  </svg>
);
const OpenDotaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outer circle (O) - explicit theme color, drawn first */}
    <circle cx="9" cy="10" r="7" stroke="#000" className="dark:stroke-white" fill="none" strokeWidth={1.5} />
    {/* D's vertical line (taller than the O) - green, drawn after O */}
    <line x1="9" y1="1" x2="9" y2="19" stroke="#22c55e" strokeWidth={1.5} />
    {/* D's bowl (wraps around outside of O, does not overlap) - green, drawn after O */}
    <path d="M9 1 a8.5 8.5 0 0 1 0 18" stroke="#22c55e" fill="none" strokeWidth={1.5} />
  </svg>
);
const StratzIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="27" fill="none" stroke="url(#circleOutline)" strokeWidth="6" />
    <path fillRule="evenodd" d="M56.72 30C56.72 15.253 44.747 3.28 30 3.28S3.279 15.253 3.279 30 15.252 56.721 30 56.721 56.72 44.748 56.72 30z" fill="none"></path>
    <path d="M39.071 36.287a.72.72 0 01.53.22c.146.147.22.324.22.532a.72.72 0 01-.22.531c-.147.146-.323.219-.53.219s-.385-.073-.532-.219a.72.72 0 01-.22-.531c0-.208.073-.385.22-.532s.324-.22.532-.22zm.001.118a.61.61 0 00-.635.634c0 .175.062.324.186.447a.61.61 0 00.449.185.609.609 0 00.446-.185.61.61 0 00.185-.447.61.61 0 00-.185-.448.609.609 0 00-.446-.185zm-.026.148c.111 0 .197.023.257.07s.091.11.091.19c0 .065-.021.121-.064.167s-.102.077-.178.093v.004c.053.012.105.071.158.177l.125.254h-.173l-.104-.229c-.053-.115-.109-.173-.17-.173h-.065v.402h-.146v-.955h.269zm-.029.124h-.094v.307h.118c.132 0 .198-.051.198-.154 0-.059-.018-.099-.053-.121s-.092-.032-.168-.032z" fill="url(#circledR)"/>
    <path d="M30.291 19.96l8.88 5.894v.723l-.603-.134-1.273 11.978s6.028 1.201 9.712 3.87c0 0-6.686-2.636-13.718-2.769V32.4h1.424l-4.42-3.303V19.96zm0-4.691l1.381 1.177v2.941l1.42 1.117.422-2.687 2.142 1.88v2.532l1.243.896.488-2.267 1.731 1.294-.4 2.875-8.427-5.816v-3.942z" fill="url(#rightCastle)"/>
    <path d="M29.727 19.96v9.136l-4.42 3.303h1.424v7.123c-7.032.134-13.718 2.769-13.718 2.769 3.684-2.669 9.711-3.87 9.711-3.87L21.45 26.444l-.602.134v-.723l8.879-5.894zm0-4.691v3.942l-8.428 5.816-.399-2.875 1.731-1.294.488 2.267 1.243-.896v-2.532l2.141-1.88.422 2.687 1.421-1.117v-2.941l1.381-1.177z" fill="url(#leftCastle)"/>
    <defs>
      <linearGradient id="circleOutline" x1="18.486" y1="30" x2="60.25" y2="59.097" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9"></stop>
        <stop offset="1" stopColor="#0369a1"></stop>
      </linearGradient>
      <linearGradient id="circledR" x1="38.319" y1="36.287" x2="39.821" y2="37.788" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8"></stop>
        <stop offset="1" stopColor="#0ea5e9"></stop>
      </linearGradient>
      <linearGradient id="rightCastle" x1="30.291" y1="15.269" x2="54.47" y2="30.225" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8"></stop>
        <stop offset="1" stopColor="#0ea5e9"></stop>
      </linearGradient>
      <linearGradient id="leftCastle" x1="18.162" y1="28.78" x2="32.737" y2="35.061" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9"></stop>
        <stop offset="1" stopColor="#0369a1"></stop>
      </linearGradient>
    </defs>
  </svg>
);
const Dota2ProTrackerIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <mask id="aegis-cutout-mask">
        <rect width="32" height="32" fill="black"/>
        <circle cx="8" cy="23" r="6" fill="white"/>
        <circle cx="3.5" cy="27" r="2" fill="black"/>
        <circle cx="12.5" cy="27" r="2" fill="black"/>
        <path d="M6 22.5 l2 2 l3 -3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </mask>
      <mask id="dota-logo-cutout-mask">
        <rect x="2" y="1" width="12" height="12" fill="white"/>
        <polygon points="2,1 5,1 14,10 14,13 11,13 2,4" fill="black"/>
        <polygon points="8,2 13,2 13,7" fill="black"/>
        <polygon points="3,12 8,12 3,7" fill="black"/>
      </mask>
    </defs>
    {/* Dota logo with cutouts (top left) */}
    <rect x="2" y="1" width="12" height="12" stroke="#3b82f6" strokeWidth="2" fill="#3b82f6" mask="url(#dota-logo-cutout-mask)"/>
    <rect x="2" y="1" width="12" height="12" fill="none" stroke="#3b82f6" strokeWidth="2" pointerEvents="none"/>
    {/* 2 (top right) - moved down and left for proper margin */}
    <text x="24" y="8.5" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fill="#3b82f6" textAnchor="middle" dominantBaseline="middle">2</text>
    {/* Masked Aegis (bottom left) - moved up for proper margin */}
    <g>
      <circle cx="8" cy="23" r="6" fill="#3b82f6" mask="url(#aegis-cutout-mask)"/>
    </g>
    {/* T (bottom right) - checked for proper bottom/right margin */}
    <text x="24" y="24" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#3b82f6" textAnchor="middle" dominantBaseline="middle">T</text>
  </svg>
);

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

function hashConfig(config: any): string {
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
function mergeIconClassName(icon: any, extra: string) {
  const orig = (icon && icon.props && typeof icon.props.className === 'string') ? icon.props.className : '';
  return `${orig} ${extra}`.trim();
}

// External resource links with explicit typing for icon
const externalResourceLinks: {
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
}[] = [
  { label: 'Dotabuff', url: 'https://www.dotabuff.com/', icon: DotabuffIcon, iconClass: 'text-red-500' },
  { label: 'OpenDota', url: 'https://www.opendota.com/', icon: OpenDotaIcon, iconClass: 'text-green-500' },
  { label: 'Dota2ProTracker', url: 'https://www.dota2protracker.com/', icon: Dota2ProTrackerIcon, iconClass: 'text-orange-500' },
  { label: 'STRATZ', url: 'https://www.stratz.com/', icon: StratzIcon, iconClass: 'text-blue-500' },
];

export function Sidebar() {
  const { collapsed, setCollapsed, preferredSite, setPreferredSite } =
    useSidebar();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queueStats, setQueueStats] = useState<Record<string, { length: number; processing: boolean }>>({});
  const [showQueueDebug, setShowQueueDebug] = useState(false);
  const activeIconRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const { getExternalLinks, currentTeam } = useTeam();
  const { toast } = useToast();
  const externalLinks = getExternalLinks();
  const { theme, setTheme } = useTheme();

  // Update queue stats every second
  useEffect(() => {
    const updateQueueStats = async () => {
      try {
        const stats = await getQueueStatsFromAPI();
        setQueueStats(stats.queueStats || {});
      } catch (error) {
        console.error('[Sidebar] Error updating queue stats:', error);
      }
    };

    updateQueueStats();
    const interval = setInterval(updateQueueStats, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mock dashboard config object
  const dashboardConfig = {
    filters: { role: "carry", patch: "7.36" },
    layout: "compact",
    timestamp: 0, // Don't include timestamp in hash for idempotency
  };

  // Save config and generate shareable link
  const saveConfig = async () => {
    const configToHash = { ...dashboardConfig };
    const { timestamp, ...configToHashNoTimestamp } = configToHash;
    const id = hashConfig(configToHashNoTimestamp);
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

  // Log collapsed state changes
  useEffect(() => {
    logWithTimestamp('log', '[Sidebar] Collapsed state changed:', collapsed);
  }, [collapsed]);

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
      Array.from(icons).forEach((icon, index) => {
        const rect = icon.getBoundingClientRect();
        const sanitizedLabel = icon.getAttribute('data-icon-debug') || `icon-${index}`;
        // Get the original label from the parent element for display
        const parentElement = icon.closest('a, [href]');
        const originalLabel = parentElement?.getAttribute('title') || parentElement?.textContent?.trim() || sanitizedLabel;
        // Get absolute position by adding scroll offsets
        const absoluteX = rect.x + window.scrollX;
        const absoluteY = rect.y + window.scrollY;
        logWithTimestamp('log', `[Sidebar] ${originalLabel}: absoluteX=${Math.round(absoluteX)}, absoluteY=${Math.round(absoluteY)}, viewportX=${Math.round(rect.x)}, viewportY=${Math.round(rect.y)}`);
      });
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
          {/* Top section: title and collapse button */}
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
          {/* Divider under title/collapse - always reserve space */}
          <div className={`border-b border-border mx-3 mb-2 ${collapsed ? "border-transparent" : ""}`} />
          
          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {/* Share Button */}
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

            {/* Main Navigation Links */}
            <nav className="flex flex-col gap-1 px-2 my-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center h-10 rounded transition-colors font-medium text-sm hover:bg-accent/40 ${pathname === link.href ? "bg-accent/60 text-primary" : "text-muted-foreground"} gap-3 px-3 relative`}
                >
                  <span className="absolute left-3 w-5 h-5 flex items-center justify-center" data-icon-debug={link.label.replace(/[^a-zA-Z0-9]/g, '')}>
                    {React.isValidElement(link.icon)
                      ? React.cloneElement(link.icon, { className: mergeIconClassName(link.icon, 'w-5 h-5') })
                      : null}
                  </span>
                  <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-border mx-3 my-2" />

            {/* Quick Links (if any) - use same nav structure as above */}
            {externalLinks && externalLinks.length > 0 && (
              <nav className="flex flex-col gap-1 px-2 mt-0 mb-2">
                {externalLinks.map((link: any, idx: number) => (
                  <a
                    key={link.href || link.label || idx}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center h-10 rounded transition-colors font-medium text-sm hover:bg-accent/40 text-muted-foreground gap-3 px-3 relative`}
                    style={{ textDecoration: 'none', listStyle: 'none' }}
                    title={collapsed ? link.label : undefined}
                  >
                    <span className="absolute left-3 w-5 h-5 flex items-center justify-center" data-icon-debug={link.label.replace(/[^a-zA-Z0-9]/g, '')}>
                      {React.isValidElement(link.icon)
                        ? React.cloneElement(link.icon, { className: mergeIconClassName(link.icon, 'w-5 h-5') })
                        : null}
                    </span>
                    <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
                  </a>
                ))}
              </nav>
            )}

            {/* Separator between quick links and external resources */}
            <div className="border-t border-border mx-3 my-2" />

            {/* External Resources - use same nav structure as above */}
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
                    {/* @ts-expect-error: Icon components accept className, TS inference is wrong here */}
                    {React.createElement(link.icon as ComponentType<any>, { className: `w-5 h-5 ${link.iconClass} text-neutral-800 dark:text-white` })}
                  </span>
                  <span className={`transition-opacity duration-200 ml-8 whitespace-nowrap ${collapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>{link.label}</span>
                </a>
              ))}
            </nav>

            {/* Extra space below external resources */}
            <div className="flex-1" />

            {/* Queue Status */}
            {Object.values(queueStats).some(stats => (stats.length ?? 0) > 0 || stats.processing) && (
              <>
                <div className="border-t border-border mx-3 my-2" />
                <div className="px-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Queue Status
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQueueDebug(!showQueueDebug)}
                      className="h-6 w-6 p-0"
                    >
                      {showQueueDebug ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  {showQueueDebug && (
                    <div className="space-y-2">
                      <div className="flex gap-2 text-xs">
                        {Object.entries(queueStats).map(([service, stats]) => (
                          <div key={service} className="flex items-center gap-1">
                            {stats.processing ? (
                              <Activity className="w-3 h-3 text-green-500" />
                            ) : stats.length > 0 ? (
                              <Clock className="w-3 h-3 text-yellow-500" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="font-medium capitalize">{service}:</span>
                            <span>{stats.length}</span>
                          </div>
                        ))}
                        {Object.keys(queueStats).length === 0 && (
                          <div className="flex items-center gap-1">
                            <Circle className="w-3 h-3 text-gray-400" />
                            <span className="text-muted-foreground">No active requests</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Theme Toggle and Preferred Site Switch - now inside scrollable area */}
            <div className="border-t border-border mx-3 my-2" />
            {!collapsed ? (
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
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
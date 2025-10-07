'use client';

import {
  BarChart,
  Building,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clipboard,
  Link,
  Moon,
  Sun,
  Trophy,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import React, { Suspense } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { Serializable } from '@/frontend/contexts/share-context';
import { useShareContext } from '@/frontend/contexts/share-context';
import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data-types';
import { useAppData } from '@/hooks/use-app-data';

import { Dota2ProTrackerIcon, DotabuffIcon, OpenDotaIcon } from '../icons/ExternalSiteIcons';
/**
 * Sidebar title component that shows the app name when expanded
 * and only the toggle button when collapsed
 */
const Title = ({ open }: { open: boolean }) => {
  return (
    <SidebarHeader>
      {open ? (
        <div className="flex items-center justify-between gap-3 overflow-hidden transition-all duration-200">
          <h1 className="transition-opacity duration-200 truncate">Dota Scouting Assistant</h1>
          <Toggle />
        </div>
      ) : (
        <div className="flex items-center justify-center transition-all duration-200">
          {' '}
          <Toggle />{' '}
        </div>
      )}
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
    </SidebarHeader>
  );
};

/**
 * Navigation section with main app navigation items
 */
const NavigationContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isShareMode, shareKey } = useShareContext();
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Building />, path: '/dashboard' },
    { id: 'match-history', label: 'Match History', icon: <Clock />, path: '/match-history' },
    { id: 'player-stats', label: 'Player Stats', icon: <BarChart />, path: '/player-stats' },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          const handleClick = () => {
            if (isShareMode && shareKey) {
              const params = new URLSearchParams(searchParams.toString());
              params.set('config', shareKey);
              router.push(`${item.path}?${params.toString()}`);
            } else {
              router.push(item.path);
            }
          };
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton onClick={handleClick} className={isActive ? 'bg-accent' : ''} tooltip={item.label}>
                {React.cloneElement(item.icon, {
                  className: isActive ? 'text-primary' : '',
                })}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

/**
 * Navigation section wrapped in Suspense boundary
 */
const Navigation = () => {
  return (
    <Suspense
      fallback={
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu className="overflow-hidden">
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Building className="animate-pulse" />
                <span className="truncate">Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <NavigationContent />
    </Suspense>
  );
};

/**
 * External sites section for Dota 2 resources
 */
const ExternalSites = () => {
  const externalSites = [
    { id: 'dotabuff', label: 'Dotabuff', icon: <DotabuffIcon />, url: 'https://dotabuff.com' },
    { id: 'opendota', label: 'OpenDota', icon: <OpenDotaIcon />, url: 'https://opendota.com' },
    {
      id: 'dota2protracker',
      label: 'Dota2ProTracker',
      icon: <Dota2ProTrackerIcon />,
      url: 'https://dota2protracker.com',
    },
  ];

  return (
    <SidebarGroup>
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        External Sites
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {externalSites.map((site) => (
          <SidebarMenuItem key={site.id}>
            <SidebarMenuButton onClick={() => window.open(site.url, '_blank')} tooltip={site.label}>
              {site.icon} <span className="truncate">{site.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

/**
 * Quick links section for external team and league pages
 */
const QuickLinks = () => {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const activeTeam = appData.getTeam(selectedTeamId);

  if (!activeTeam) {
    throw new Error(`Selected team ${selectedTeamId} not found`);
  }

  // Don't show quick links for the global team
  if (activeTeam.isGlobal) return null;

  const quickLinks = [
    {
      id: 'team-page',
      label: 'Team Page',
      icon: <Users />,
      url: `https://dotabuff.com/teams/${activeTeam.teamId}`,
    },
    {
      id: 'league-page',
      label: 'League Page',
      icon: <Trophy />,
      url: `https://dotabuff.com/esports/leagues/${activeTeam.leagueId}`,
    },
  ];

  return (
    <SidebarGroup>
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        Quick Links
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {quickLinks.map((link) => (
          <SidebarMenuItem key={link.id}>
            <SidebarMenuButton onClick={() => window.open(link.url, '_blank')} tooltip={link.label}>
              {link.icon} <span className="truncate">{link.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

/**
 * Theme toggle switch component
 */
const ThemeSwitch = ({ open }: { open: boolean }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Only render after client-side mount to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <SidebarMenuItem>
        {open ? (
          <div className="flex items-center space-x-2 transition-all duration-200">
            <Sun className="w-5 h-5" />
            <div className="w-8 h-4 rounded-full animate-pulse" />
            <Moon className="w-5 h-5" />
          </div>
        ) : (
          <SidebarMenuButton tooltip="Loading theme...">
            <div className="w-5 h-5 rounded animate-pulse" />
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    );
  }

  const handleThemeChange = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <SidebarMenuItem>
      {open ? (
        <div className="flex items-center space-x-2 transition-all duration-200">
          <Sun className="w-5 h-5" />
          <Switch id="theme" checked={resolvedTheme === 'dark'} onCheckedChange={handleThemeChange} />
          <Moon className="w-5 h-5" />
        </div>
      ) : (
        <SidebarMenuButton onClick={handleThemeChange} tooltip="Toggle theme">
          {resolvedTheme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

/**
 * Preferred external site toggle switch component
 */
const PreferredSiteSwitch = ({ open }: { open: boolean }) => {
  const { config, updateConfig } = useConfigContext();
  const preferredSite = config.preferredExternalSite;

  const handlePreferredSiteChange = () => {
    const newSite = preferredSite === 'dotabuff' ? 'opendota' : 'dotabuff';
    updateConfig({ preferredExternalSite: newSite as 'opendota' | 'dotabuff' });
  };

  return (
    <SidebarMenuItem>
      {open ? (
        <div className="flex items-center space-x-2 transition-all duration-200">
          <DotabuffIcon className="w-5 h-5" />
          <Switch
            id="preferred-site"
            checked={preferredSite === 'opendota'}
            onCheckedChange={handlePreferredSiteChange}
          />
          <OpenDotaIcon className="w-5 h-5" />
        </div>
      ) : (
        <SidebarMenuButton onClick={handlePreferredSiteChange} tooltip="Toggle preferred site">
          {preferredSite === 'dotabuff' ? <DotabuffIcon className="w-5 h-5" /> : <OpenDotaIcon className="w-5 h-5" />}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

/**
 * Settings section containing theme and site preferences
 */
const Settings = ({ open }: { open: boolean }) => {
  const { createShare } = useShareContext();
  const { getTeams, activeTeam } = useConfigContext();
  const appData = useAppData();
  const [copied, setCopied] = React.useState(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = async () => {
    const teamsMap = getTeams();
    const teamsObject: Record<string, Serializable> = {};
    teamsMap.forEach((value, key) => {
      // Use unknown intermediate step for safer type narrowing
      const serializedValue: unknown = JSON.parse(JSON.stringify(value));
      const serializableValue = serializedValue as unknown as Serializable;

      // Basic validation - ensure the serialized value is valid
      if (serializableValue !== null && typeof serializableValue === 'object') {
        teamsObject[key] = serializableValue;
      } else {
        console.warn(`Failed to serialize team data for key ${key}`);
      }
    });

    // Get global manual items from the global team in appData
    const globalTeam = appData.getTeam(GLOBAL_TEAM_KEY);
    if (!globalTeam) {
      throw new Error('Global team not found - this should never happen');
    }
    const data = {
      teams: teamsObject,
      activeTeam: activeTeam || null,
      globalManualMatches: Array.from(globalTeam.matches.entries())
        .filter(([, matchData]) => matchData.isManual)
        .map(([matchId]) => matchId),
      globalManualPlayers: Array.from(globalTeam.players.entries())
        .filter(([, playerData]) => playerData.isManual)
        .map(([playerId]) => playerId),
    };
    const key = await createShare(data);
    if (key) {
      const url = new URL(window.location.href);
      url.searchParams.set('config', key);
      const text = url.toString();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SidebarGroup>
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        Settings
      </SidebarGroupLabel>
      <SidebarMenu className="flex flex-col items-center gap-2 overflow-hidden">
        <ThemeSwitch open={open} />
        <PreferredSiteSwitch open={open} />
        <SidebarMenuItem>
          {open ? (
            <SidebarMenuButton onClick={handleShare} tooltip={copied ? 'Copied!' : 'Share'}>
              {copied ? <Clipboard className="w-5 h-5 text-emerald-500" /> : <Link className="w-5 h-5" />}
              <span className="truncate">{copied ? 'Copied' : 'Share'}</span>
              <span className="sr-only" role="status" aria-live="polite">
                {copied ? 'Link copied to clipboard' : ''}
              </span>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton onClick={handleShare} tooltip={copied ? 'Copied!' : 'Share'}>
              {copied ? <Clipboard className="w-5 h-5 text-emerald-500" /> : <Link className="w-5 h-5" />}
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

/**
 * Sidebar toggle button component
 */
function Toggle() {
  const { toggleSidebar, open, openMobile, state, isMobile } = useSidebar();

  // Use the correct state based on whether we're on mobile or desktop
  const isOpen = isMobile ? openMobile : open;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={toggleSidebar}>{isOpen ? <ChevronLeft /> : <ChevronRight />}</button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile}>
        {isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Main sidebar component with navigation, quick links, external sites, and settings
 */
export function AppSidebar() {
  const { open, openMobile, isMobile } = useSidebar();

  // On mobile, always show the full version when the sidebar is open
  // On desktop, use the regular open state
  const shouldShowFullVersion = isMobile ? openMobile : open;

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <Title open={shouldShowFullVersion} />
      <SidebarContent className="overflow-hidden">
        <Navigation />
        <ExternalSites />
        <QuickLinks />
      </SidebarContent>
      <SidebarFooter className="overflow-hidden">
        <Settings open={shouldShowFullVersion} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

'use client';

import { BarChart, Building, ChevronLeft, ChevronRight, Clock, Moon, Sun, Target, Trophy, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import React from "react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { useConfigContext } from "@/contexts/config-context";
import { useTeamContext } from "@/contexts/team-context";

import { Dota2ProTrackerIcon, DotabuffIcon, OpenDotaIcon } from "../icons/ExternalSiteIcons";
import { Switch } from "../ui/switch";
/**
 * Sidebar title component that shows the app name when expanded
 * and only the toggle button when collapsed
 */
const Title = ({ open }: { open: boolean }) => {
  return (
    <SidebarHeader>
      {open ? <div className="flex items-center justify-between gap-3 overflow-hidden transition-all duration-200">
        <h1 className="transition-opacity duration-200 truncate">Dota Scouting Assistant</h1>
        <Toggle />
      </div> :
        <div className="flex items-center justify-center transition-all duration-200"> <Toggle /> </div>
      }
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
    </SidebarHeader>
  );
}

/**
 * Navigation section with main app navigation items
 */
const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Building />, path: '/dashboard' },
    { id: 'match-history', label: 'Match History', icon: <Clock />, path: '/match-history' },
    { id: 'player-stats', label: 'Player Stats', icon: <BarChart />, path: '/player-stats' },
    { id: 'draft-suggestions', label: 'Draft Suggestions', icon: <Target />, path: '/draft-suggestions' },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">Navigation</SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => router.push(item.path)}
                className={isActive ? 'bg-accent' : ''}
              >
                {React.cloneElement(item.icon, {
                  className: isActive ? 'text-primary' : ''
                })}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/**
 * External sites section for Dota 2 resources
 */
const ExternalSites = () => {
  const externalSites = [
    { id: 'dotabuff', label: 'Dotabuff', icon: <DotabuffIcon />, url: 'https://dotabuff.com' },
    { id: 'opendota', label: 'OpenDota', icon: <OpenDotaIcon />, url: 'https://opendota.com' },
    { id: 'dota2protracker', label: 'Dota2ProTracker', icon: <Dota2ProTrackerIcon />, url: 'https://dota2protracker.com' },
  ];

  return (
      <SidebarGroup>
        <div className="flex justify-center">
          <SidebarSeparator />
        </div>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">External Sites</SidebarGroupLabel>
        <SidebarMenu className="overflow-hidden">
          {externalSites.map((site) => (
            <SidebarMenuItem key={site.id}>
              <SidebarMenuButton
                onClick={() => window.open(site.url, '_blank')}
              >
                {site.icon} <span className="truncate">{site.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
  )
}

/**
 * Quick links section for external team and league pages
 */
const QuickLinks = () => {
  const { getSelectedTeam } = useTeamContext();

  const activeTeam = getSelectedTeam();

  if (!activeTeam) return null;

  const quickLinks = [
    {
      id: 'team-page',
      label: 'Team Page',
      icon: <Users />, 
      url: `https://dotabuff.com/teams/${activeTeam.team.id}`
    },
    {
      id: 'league-page',
      label: 'League Page',
      icon: <Trophy />, 
      url: `https://dotabuff.com/esports/leagues/${activeTeam.league.id}`
    },
  ];

  return (
      <SidebarGroup>
        <div className="flex justify-center">
          <SidebarSeparator />
        </div>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">Quick Links</SidebarGroupLabel>
        <SidebarMenu className="overflow-hidden">
          {quickLinks.map((link) => (
            <SidebarMenuItem key={link.id}>
              <SidebarMenuButton
                onClick={() => window.open(link.url, '_blank')}
              >
                {link.icon} <span className="truncate">{link.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
  )
}


/**
 * Theme toggle switch component
 */
const ThemeSwitch = ({ open } : { open: boolean }) => {
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
        { open ? (
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
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }

  return (
    <SidebarMenuItem>
      { open ? (
        <div className="flex items-center space-x-2 transition-all duration-200">
          <Sun className="w-5 h-5" />
          <Switch id="theme" checked={resolvedTheme === "dark"} onCheckedChange={handleThemeChange} />
          <Moon className="w-5 h-5" />
        </div>
      ) : (
        <SidebarMenuButton 
          onClick={handleThemeChange}
          tooltip="Toggle theme"
        >
          { resolvedTheme === "light" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" /> }
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

/**
 * Preferred external site toggle switch component
 */
const PreferredSiteSwitch = ({ open } : { open: boolean }) => {
  const { config, updateConfig } = useConfigContext();
  const preferredSite = config.preferredExternalSite;

  const handlePreferredSiteChange = () => {
    const newSite = preferredSite === "dotabuff" ? "opendota" : "dotabuff";
    updateConfig({ preferredExternalSite: newSite as "opendota" | "dotabuff" });
  }

  return (
    <SidebarMenuItem>
      {open ? (
        <div className="flex items-center space-x-2 transition-all duration-200">
          <DotabuffIcon className="w-5 h-5" />
            <Switch id="preferred-site" checked={preferredSite === "opendota"} onCheckedChange={handlePreferredSiteChange} />
          <OpenDotaIcon className="w-5 h-5" />
        </div>
      ) : (
        <SidebarMenuButton 
          onClick={handlePreferredSiteChange}
          tooltip="Toggle preferred site"
        >
          { preferredSite === "dotabuff" ? <DotabuffIcon className="w-5 h-5" /> : <OpenDotaIcon className="w-5 h-5" /> }
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

/**
 * Settings section containing theme and site preferences
 */
const Settings = ({ open }: { open: boolean }) => {
  return (
    <SidebarGroup>
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">Settings</SidebarGroupLabel>
      <SidebarMenu className="flex flex-col items-center gap-2 overflow-hidden">
        <ThemeSwitch open={open} />
        <PreferredSiteSwitch open={open} />
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * Sidebar toggle button component
 */
function Toggle() {
  const { toggleSidebar, open } = useSidebar()
 
  return <button onClick={toggleSidebar}>{open ? <ChevronLeft /> : <ChevronRight />}</button>
}

/**
 * Main sidebar component with navigation, quick links, external sites, and settings
 */
export function AppSidebar() {
  const {
    open,
  } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <Title open={open} />
      <SidebarContent className="overflow-hidden">
        <Navigation />
        <ExternalSites />
        <QuickLinks />
      </SidebarContent>
      <SidebarFooter className="overflow-hidden">
        <Settings open={open} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
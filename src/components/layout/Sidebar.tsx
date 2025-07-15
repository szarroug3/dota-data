'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useThemeContext } from '@/contexts/theme-context';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';

import { ExternalResources } from '../sidebar/ExternalResources';
import { MobileSidebarToggle } from '../sidebar/MobileSidebarToggle';
import { QuickLinks } from '../sidebar/QuickLinks';
import { SidebarHeader } from '../sidebar/SidebarHeader';
import { SidebarNavigation } from '../sidebar/SidebarNavigation';
import { SidebarSettings } from '../sidebar/SidebarSettings';

// Helper function to map pathname to current page
const getCurrentPage = (pathname: string): string => {
  if (pathname === '/') return 'team-management';
  if (pathname.startsWith('/team-management')) return 'team-management';
  if (pathname.startsWith('/match-history')) return 'match-history';
  if (pathname.startsWith('/player-stats')) return 'player-stats';
  if (pathname.startsWith('/draft-suggestions')) return 'draft-suggestions';
  return 'team-management';
};

// Helper function to get navigation route
const getNavigationRoute = (page: string): string => {
  const routes: Record<string, string> = {
    'team-management': '/team-management',
    'match-history': '/match-history',
    'player-stats': '/player-stats',
    'draft-suggestions': '/draft-suggestions',
  };
  return routes[page] || '/team-management';
};

export const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { config, updateConfig } = useConfigContext();
  const { theme, setTheme } = useThemeContext();

  // Extract values from config
  const isCollapsed = config.sidebarCollapsed;
  const preferredSite = (config.preferredExternalSite === 'dotabuff' || config.preferredExternalSite === 'opendota') 
    ? config.preferredExternalSite 
    : 'dotabuff';

  // Convert theme to only 'light' or 'dark' for SidebarSettings
  const sidebarTheme = theme === 'system' ? 'light' : theme;
  const currentPage = getCurrentPage(pathname);

  const handleNavigate = (page: string) => {
    // Close mobile sidebar when navigating
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }

    // Navigate to the appropriate route
    const route = getNavigationRoute(page);
    router.push(route);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handlePreferredSiteChange = (site: string) => {
    updateConfig({ preferredExternalSite: site as PreferredExternalSite });
  };

  const handleToggle = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] handleToggle for sidebar state`, isCollapsed);
    updateConfig({ sidebarCollapsed: !isCollapsed });
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggle}
      />

      {/* Navigation */}
      <SidebarNavigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
      />

      {/* Quick Links */}
      <QuickLinks
        isCollapsed={isCollapsed}
        activeTeam={{
          id: 'team-liquid',
          name: 'Team Liquid',
          league: 'ESL Pro League'
        }}
      />

      {/* External Resources */}
      <ExternalResources
        isCollapsed={isCollapsed}
      />

      {/* Settings */}
      <SidebarSettings
        theme={sidebarTheme}
        preferredSite={preferredSite}
        onThemeChange={handleThemeChange}
        onPreferredSiteChange={handlePreferredSiteChange}
        isCollapsed={isCollapsed}
      />
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <MobileSidebarToggle isOpen={isMobileOpen} onToggle={handleMobileToggle} />
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-background text-foreground border-r border-border
          transition-all duration-300 ease-in-out z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:relative md:translate-x-0
        `}
      >
        {renderSidebarContent()}
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleMobileToggle}
        />
      )}
    </>
  );
}; 
'use client';

import React, { useEffect, useState } from 'react';

import { ExternalResources } from './ExternalResources';
import { MobileSidebarToggle } from './MobileSidebarToggle';
import { QuickLinks } from './QuickLinks';
import { SidebarNavigation } from './SidebarNavigation';
import { SidebarSettings } from './SidebarSettings';
import { SidebarToggle } from './SidebarToggle';

const useSidebarPreferences = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [preferredSite, setPreferredSite] = useState<'dotabuff' | 'opendota'>('dotabuff');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const savedPreferredSite = localStorage.getItem('preferredSite') as 'dotabuff' | 'opendota';

    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedPreferredSite) {
      setPreferredSite(savedPreferredSite);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('preferredSite', preferredSite);
  }, [preferredSite]);

  return {
    isCollapsed,
    setIsCollapsed,
    theme,
    setTheme,
    preferredSite,
    setPreferredSite,
  };
};

export const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isCollapsed, setIsCollapsed, theme, setTheme, preferredSite, setPreferredSite } = useSidebarPreferences();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // In a real app, this would use Next.js router
    // For now, we'll just update the state
  };

  const handleTeamClick = (teamId: string) => {
    // Handle team switching
    console.log('Switch to team:', teamId);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark');
  };

  const handlePreferredSiteChange = (site: string) => {
    setPreferredSite(site as 'dotabuff' | 'opendota');
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Mock teams data - in real app this would come from context
  const teams = [
    { id: '1', name: 'Team Alpha', league: 'Division 1' },
    { id: '2', name: 'Team Beta', league: 'Division 2' },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <SidebarNavigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
      />

      {/* Quick Links */}
      <QuickLinks
        teams={teams}
        onTeamClick={handleTeamClick}
        isCollapsed={isCollapsed}
      />

      {/* External Resources */}
      <ExternalResources
        preferredSite={preferredSite}
        onSiteChange={handlePreferredSiteChange}
        isCollapsed={isCollapsed}
      />

      {/* Settings */}
      <SidebarSettings
        theme={theme}
        preferredSite={preferredSite}
        onThemeChange={handleThemeChange}
        onPreferredSiteChange={handlePreferredSiteChange}
        isCollapsed={isCollapsed}
      />

      {/* Desktop Toggle */}
      <div className="hidden md:block mt-auto p-4">
        <SidebarToggle isCollapsed={isCollapsed} onToggle={handleToggle} />
      </div>
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
          fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
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
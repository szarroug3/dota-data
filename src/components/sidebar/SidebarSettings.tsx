import { Moon, Sun } from 'lucide-react';
import React from 'react';


import { DotabuffIcon, OpenDotaIcon } from '../icons/ExternalSiteIcons';

import { SidebarToggleSwitch } from './SidebarToggleSwitch';

interface SidebarSettingsProps {
  isCollapsed: boolean;
  theme: 'light' | 'dark';
  preferredSite: 'dotabuff' | 'opendota';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onPreferredSiteChange: (site: 'dotabuff' | 'opendota') => void;
}

interface SettingItem {
  id: string;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  isActive: boolean;
  ariaLabel: string;
}

export const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  isCollapsed,
  theme,
  preferredSite,
  onThemeChange,
  onPreferredSiteChange,
}) => {
  const settings: SettingItem[] = [
    {
      id: 'theme',
      leftIcon: <Sun className="w-5 h-5" />, // active/dark
      rightIcon: <Moon className="w-5 h-5" />, // inactive/light
      isActive: theme === 'dark',
      ariaLabel: 'Toggle theme between light and dark mode',
    },
    {
      id: 'preferred-site',
      leftIcon: <DotabuffIcon className="w-5 h-5" />, // active/dotabuff
      rightIcon: <OpenDotaIcon className="w-5 h-5" />, // active/opendota
      isActive: preferredSite === 'dotabuff',
      ariaLabel: 'Toggle preferred external site between Dotabuff and OpenDota',
    },
  ];

  const handleSettingClick = (settingId: string) => {
    if (settingId === 'theme') {
      onThemeChange(theme === 'light' ? 'dark' : 'light');
    } else if (settingId === 'preferred-site') {
      onPreferredSiteChange(preferredSite === 'dotabuff' ? 'opendota' : 'dotabuff');
    }
  };

  return (
    <div className="mt-auto">
      {/* Section Separator */}
      <div className="border-t border-border dark:border-border mb-3" />

      {/* Settings Toggle Switches */}
      <div className="space-y-2">
        {settings.map((setting) => (
          <SidebarToggleSwitch
            key={setting.id}
            leftIcon={setting.leftIcon}
            rightIcon={setting.rightIcon}
            isCollapsed={isCollapsed}
            isActive={setting.isActive}
            onClick={() => handleSettingClick(setting.id)}
            ariaLabel={setting.ariaLabel}
            iconColor="text-muted-foreground"
          />
        ))}
      </div>
    </div>
  );
}; 
import React from 'react';

import { Dota2ProTrackerIcon, DotabuffIcon, OpenDotaIcon } from '../icons/ExternalSiteIcons';

import { SidebarButton } from './SidebarButton';

interface ExternalResourcesProps {
  isCollapsed: boolean;
}

interface ExternalSite {
  id: string;
  label: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}

const externalSites: ExternalSite[] = [
  {
    id: 'dotabuff',
    label: 'Dotabuff',
    icon: <DotabuffIcon className="w-5 h-5" />,
    url: 'https://dotabuff.com',
    description: 'Comprehensive Dota 2 statistics and match analysis',
  },
  {
    id: 'opendota',
    label: 'OpenDota',
    icon: <OpenDotaIcon className="w-5 h-5" />,
    url: 'https://opendota.com',
    description: 'Open source Dota 2 statistics and API',
  },
  {
    id: 'dota2protracker',
    label: 'Dota2ProTracker',
    icon: <Dota2ProTrackerIcon className="w-5 h-5" />,
    url: 'https://dota2protracker.com',
    description: 'Professional player builds and strategies',
  },
];

export const ExternalResources: React.FC<ExternalResourcesProps> = ({ isCollapsed }) => {
  const handleExternalClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* Section Separator */}
      <div className="border-t border-border dark:border-border mb-3" />

      {/* External Site Links */}
      <div className="space-y-2">
        {externalSites.map((site) => (
          <SidebarButton
            key={site.id}
            icon={site.icon}
            label={site.label}
            isCollapsed={isCollapsed}
            onClick={() => handleExternalClick(site.url)}
            ariaLabel={`Open ${site.label} - ${site.description}`}
            iconColor="text-muted-foreground"
          />
        ))}
      </div>
    </div>
  );
}; 
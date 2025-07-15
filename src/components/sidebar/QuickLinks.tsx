import { Trophy, Users } from 'lucide-react';
import React from 'react';


import { SidebarButton } from './SidebarButton';

interface QuickLinksProps {
  isCollapsed: boolean;
  activeTeam?: {
    id: string;
    name: string;
    league: string;
  };
}

interface QuickLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ isCollapsed, activeTeam }) => {
  // Only show Quick Links if there's an active team
  if (!activeTeam) {
    return null;
  }

  const quickLinks: QuickLink[] = [
    {
      id: 'team-page',
      label: 'Team Page',
      icon: <Users className="w-5 h-5" />,
      url: `https://dotabuff.com/teams/${activeTeam.id}`,
      description: `View ${activeTeam.name} on Dotabuff`,
    },
    {
      id: 'league-page',
      label: 'League Page',
      icon: <Trophy className="w-5 h-5" />,
      url: `https://dotabuff.com/leagues/${activeTeam.league.toLowerCase().replace(/\s+/g, '-')}`,
      description: `View ${activeTeam.league} on Dotabuff`,
    },
  ];

  const handleExternalClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* Section Separator */}
      <div className="border-t border-border dark:border-border mb-3" />

      {/* Quick Link Buttons */}
      <div className="space-y-2">
        {quickLinks.map((link) => (
          <SidebarButton
            key={link.id}
            icon={link.icon}
            label={link.label}
            isCollapsed={isCollapsed}
            onClick={() => handleExternalClick(link.url)}
            ariaLabel={link.description}
            iconColor="text-muted-foreground"
          />
        ))}
      </div>
    </div>
  );
}; 
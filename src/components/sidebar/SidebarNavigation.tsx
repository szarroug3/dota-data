import { BarChart3, Building, Clock, Target } from 'lucide-react';
import React from 'react';

import { SidebarButton } from './SidebarButton';

interface SidebarNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'team-management',
    label: 'Team Management',
    icon: <Building className="w-5 h-5" />,
    path: '/team-management',
    color: 'text-primary dark:text-blue-400',
  },
  {
    id: 'match-history',
    label: 'Match History',
    icon: <Clock className="w-5 h-5" />,
    path: '/match-history',
    color: 'text-success dark:text-green-400',
  },
  {
    id: 'player-stats',
    label: 'Player Stats',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/player-stats',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'draft-suggestions',
    label: 'Draft Suggestions',
    icon: <Target className="w-5 h-5" />,
    path: '/draft-suggestions',
    color: 'text-orange-600 dark:text-orange-400',
  },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
}) => {
  const handleClick = (item: NavigationItem) => {
    onNavigate(item.id);
  };

  return (
    <nav className="flex-1" role="navigation" aria-label="Main navigation">
      {/* Navigation Items */}
      <div>
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              isActive={currentPage === item.id}
              onClick={() => handleClick(item)}
              ariaLabel={item.label}
              iconColor={item.color}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}; 
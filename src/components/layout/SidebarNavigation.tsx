import React from 'react';

interface SidebarNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
  },
  {
    id: 'team-management',
    label: 'Team Management',
    icon: '👥',
    path: '/team-management',
  },
  {
    id: 'match-history',
    label: 'Match History',
    icon: '⚔️',
    path: '/match-history',
  },
  {
    id: 'player-stats',
    label: 'Player Stats',
    icon: '👤',
    path: '/player-stats',
  },
  {
    id: 'team-analysis',
    label: 'Team Analysis',
    icon: '📈',
    path: '/team-analysis',
  },
  {
    id: 'draft-suggestions',
    label: 'Draft Suggestions',
    icon: '🎯',
    path: '/draft-suggestions',
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
    <nav className="flex-1 p-4">
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`
                w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}; 
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';


interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h1 className="text-md font-semibold text-foreground flex-1 truncate">
        Dota Scout
      </h1>
      <button
        onClick={onToggleCollapse}
        className="p-2 rounded-md transition-colors duration-200
            hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
            text-muted-foreground hover:text-foreground"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}; 
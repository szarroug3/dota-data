import { Clock, TrendingUp, Users, Zap } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type { Match } from '@/types/contexts/match-context-value';

import type { MatchDetailsPanelMode } from './MatchDetailsPanel';

interface MatchDetailsPanelHeaderProps {
  match?: Match;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
  className?: string;
}

interface MatchDetailsLayoutButtonsProps {
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
}

const MatchDetailsLayoutButtons: React.FC<MatchDetailsLayoutButtonsProps> = ({ 
  viewMode, 
  onViewModeChange,
}) => (
  <div className="@[180px]:flex hidden gap-2">
    <Button
      variant={viewMode === 'draft' ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2`}
      onClick={() => onViewModeChange('draft')}
    >
      <Clock className="w-5 h-5" />
      <span className="@[420px]:block hidden">Draft</span>
    </Button>
    <Button
      variant={viewMode === 'performance' ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2`}
      onClick={() => onViewModeChange('performance')}
    >
      <TrendingUp className="w-5 h-5" />
      <span className="@[420px]:block hidden">Performance</span>
    </Button>
    <Button
      variant={viewMode === 'players' ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2`}
      onClick={() => onViewModeChange('players')}
    >
      <Users className="w-5 h-5" />
      <span className="@[420px]:block hidden">Players</span>
    </Button>
    <Button
      variant={viewMode === 'events' ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2`}
      onClick={() => onViewModeChange('events')}
    >
      <Zap className="w-5 h-5" />
      <span className="@[420px]:block hidden">Events</span>
    </Button>
  </div>
)

export const MatchDetailsPanelHeader: React.FC<MatchDetailsPanelHeaderProps> = ({
  className = '',
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1 overflow-hidden">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground truncate @[280px]:flex hidden">Match Details</h2>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0 min-h-[2rem]">
        <MatchDetailsLayoutButtons 
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
}; 
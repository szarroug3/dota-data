import { Clock, TrendingUp, Users } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

export type MatchDetailsPanelMode = 'draft' | 'players' | 'performance';

interface MatchDetailsPanelHeaderProps {
  match: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
}

interface MatchDetailsLayoutButtonsProps {
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
}

const MatchDetailsLayoutButtons: React.FC<MatchDetailsLayoutButtonsProps> = ({ 
  viewMode, 
  onViewModeChange,
}) => (
  <div className="@[150px]:flex hidden gap-2">
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
      variant={viewMode === 'players' ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2`}
      onClick={() => onViewModeChange('players')}
    >
      <Users className="w-5 h-5" />
      <span className="@[420px]:block hidden">Players</span>
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
  </div>
)

export const MatchDetailsPanelHeader: React.FC<MatchDetailsPanelHeaderProps> = ({
  teamMatch,
  className = '',
  viewMode,
  onViewModeChange,
}) => {
  // Get opponent name from team match data, only show if we have a valid name
  const opponentName = teamMatch?.opponentName;
  const shouldShowOpponent = opponentName;

  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <div className="min-w-0 flex-1 overflow-hidden opacity-0 invisible @[250px]:opacity-100 @[250px]:visible">
        {shouldShowOpponent && (
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">
            vs {opponentName}
          </h3>
        )}
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
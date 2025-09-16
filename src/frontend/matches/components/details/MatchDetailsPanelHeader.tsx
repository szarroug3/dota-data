import { Clock, TrendingUp, Users } from 'lucide-react';
import React from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const MatchDetailsLayoutButtons: React.FC<MatchDetailsLayoutButtonsProps> = ({ viewMode, onViewModeChange }) => (
  <>
    <div className="@[150px]:flex hidden">
      <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as MatchDetailsPanelMode)}>
        <TabsList className="grid w/full grid-cols-3">
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="@[450px]:block hidden">Draft</span>
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="@[450px]:block hidden">Players</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="@[450px]:block hidden">Events</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="@[150px]:hidden h-9 w-32" />
  </>
);

export const MatchDetailsPanelHeader: React.FC<MatchDetailsPanelHeaderProps> = ({
  className = '',
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1 overflow-hidden">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground truncate @[190px]:block hidden">
          Match Details
        </h2>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
        <MatchDetailsLayoutButtons viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
    </div>
  );
};

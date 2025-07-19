import { Users, Clock, Gamepad2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

import { MatchDetailsPanelDraftEvents } from './MatchDetailsPanelDraftEvents';
import { MatchDetailsPanelPlayers } from './MatchDetailsPanelPlayers';
import { MatchDetailsPanelTimings } from './MatchDetailsPanelTimings';

export type MatchDetailsPanelMode = 'draft-events' | 'players' | 'timings';

interface MatchDetailsPanelProps {
  match: Match | null;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange?: (mode: MatchDetailsPanelMode) => void;
  className?: string;
}

export const MatchDetailsPanel: React.FC<MatchDetailsPanelProps> = ({
  match,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  const renderContent = () => {
    if (!match) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No match selected</div>
            <div className="text-sm">Select a match to see details.</div>
          </div>
        </div>
      );
    }

    if (viewMode === 'draft-events') {
      return <MatchDetailsPanelDraftEvents match={match} />;
    }
    if (viewMode === 'players') {
      return <MatchDetailsPanelPlayers match={match} />;
    }
    if (viewMode === 'timings') {
      return <MatchDetailsPanelTimings match={match} />;
    }
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">This details view mode is not yet implemented.</div>
          <div className="text-sm">Try switching to Draft & Events, Players, or Timings view.</div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`flex flex-col max-h-[calc(100vh-14rem)] ${className}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Match Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {match ? `vs ${match.opponent}` : 'No match selected'}
            </p>
          </div>
          {onViewModeChange && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'draft-events' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('draft-events')}
                className="flex items-center gap-2"
              >
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Draft & Events</span>
              </Button>
              <Button
                variant={viewMode === 'players' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('players')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Players</span>
              </Button>
              <Button
                variant={viewMode === 'timings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('timings')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timings</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 
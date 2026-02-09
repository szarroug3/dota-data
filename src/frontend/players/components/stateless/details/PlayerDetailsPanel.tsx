import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Player } from '@/frontend/lib/app-data/app-data-types';

import { PlayerDetailsPanelDetails } from './PlayerDetailsPanelDetails';
import { PlayerDetailsPanelHeader } from './PlayerDetailsPanelHeader';
import { PlayerDetailsPanelSummary } from './PlayerDetailsPanelSummary';
import { PlayerDetailsPanelTeam } from './PlayerDetailsPanelTeamView';

export type PlayerDetailsPanelMode = 'summary' | 'details' | 'team';

interface PlayerDetailsPanelProps {
  player: Player;
  viewMode: PlayerDetailsPanelMode;
  onViewModeChange: (mode: PlayerDetailsPanelMode) => void;
}

export const PlayerDetailsPanel: React.FC<PlayerDetailsPanelProps> = React.memo(
  ({ player, viewMode, onViewModeChange }) => {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] @container">
        <CardHeader className="shrink-0">
          <PlayerDetailsPanelHeader player={player} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 @[90px]:block hidden">
          {viewMode === 'summary' && (
            <div className="space-y-4">
              <PlayerDetailsPanelSummary player={player} />
            </div>
          )}
          {viewMode === 'details' && (
            <div className="space-y-4">
              <PlayerDetailsPanelDetails player={player} />
            </div>
          )}
          {viewMode === 'team' && (
            <div className="space-y-4">
              <PlayerDetailsPanelTeam player={player} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

PlayerDetailsPanel.displayName = 'PlayerDetailsPanel';

import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { TeamPlayerOverview } from '@/frontend/lib/app-data-statistics-ops';
import type { Hero, Player } from '@/frontend/lib/app-data-types';

import { PlayerDetailsPanelDetails } from './PlayerDetailsPanelDetails';
import { PlayerDetailsPanelHeader } from './PlayerDetailsPanelHeader';
import { PlayerDetailsPanelSummary } from './PlayerDetailsPanelSummary';
import { PlayerDetailsPanelTeam } from './PlayerDetailsPanelTeamView';

export type PlayerDetailsPanelMode = 'summary' | 'details' | 'team';

interface PlayerDetailsPanelProps {
  player: Player;
  viewMode: PlayerDetailsPanelMode;
  onViewModeChange: (mode: PlayerDetailsPanelMode) => void;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
  heroes: Map<number, Hero>;
  playerTeamOverview: TeamPlayerOverview | null;
}

export const PlayerDetailsPanel: React.FC<PlayerDetailsPanelProps> = React.memo(
  ({
    player,
    viewMode,
    onViewModeChange,
    allPlayers = [],
    hiddenPlayerIds = new Set<number>(),
    heroes,
    playerTeamOverview,
  }) => {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] @container">
        <CardHeader className="flex-shrink-0">
          <PlayerDetailsPanelHeader player={player} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 @[90px]:block hidden">
          {viewMode === 'summary' && (
            <div className="space-y-4">
              <PlayerDetailsPanelSummary
                player={player}
                allPlayers={allPlayers}
                hiddenPlayerIds={hiddenPlayerIds}
                heroes={heroes}
              />
            </div>
          )}
          {viewMode === 'details' && (
            <div className="space-y-4">
              <PlayerDetailsPanelDetails player={player} heroes={heroes} />
            </div>
          )}
          {viewMode === 'team' && (
            <div className="space-y-4">
              <PlayerDetailsPanelTeam playerTeamOverview={playerTeamOverview} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

PlayerDetailsPanel.displayName = 'PlayerDetailsPanel';

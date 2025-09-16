import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';

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
  heroes: Record<string, Hero>;
  matchesArray: Match[];
  selectedTeam: TeamData | null | undefined;
}

export const PlayerDetailsPanel: React.FC<PlayerDetailsPanelProps> = React.memo(
  ({
    player,
    viewMode,
    onViewModeChange,
    allPlayers = [],
    hiddenPlayerIds = new Set<number>(),
    heroes,
    matchesArray,
    selectedTeam,
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
              <PlayerDetailsPanelDetails
                player={player}
                _allPlayers={allPlayers}
                _hiddenPlayerIds={hiddenPlayerIds}
                heroes={heroes}
              />
            </div>
          )}
          {viewMode === 'team' && (
            <div className="space-y-4">
              <PlayerDetailsPanelTeam
                player={player}
                _allPlayers={allPlayers}
                _hiddenPlayerIds={hiddenPlayerIds}
                heroes={heroes}
                matchesArray={matchesArray}
                selectedTeam={selectedTeam}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

PlayerDetailsPanel.displayName = 'PlayerDetailsPanel';

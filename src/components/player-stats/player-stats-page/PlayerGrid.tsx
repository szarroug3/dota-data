import React from 'react';

import { PlayerDetailedCard } from './PlayerDetailedCard';
import { PlayerOverviewCard } from './PlayerOverviewCard';
import type { PlayerStats } from './usePlayerStats';

interface PlayerGridProps {
  players: PlayerStats[];
  viewType: 'overview' | 'detailed';
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players, viewType }) => (
  <div className="space-y-4">
    {players.length === 0 ? (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No player data available for this team.
        </p>
      </div>
    ) : (
      players.map((player) => (
        viewType === 'overview' ? (
          <PlayerOverviewCard key={player.playerId} player={player} />
        ) : (
          <PlayerDetailedCard key={player.playerId} player={player} />
        )
      ))
    )}
  </div>
); 
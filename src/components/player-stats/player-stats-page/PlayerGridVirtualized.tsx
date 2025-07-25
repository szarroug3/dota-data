import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

import { PlayerDetailedCard } from './PlayerDetailedCard';
import { PlayerOverviewCard } from './PlayerOverviewCard';
import type { PlayerStats } from './usePlayerStats';

interface PlayerGridVirtualizedProps {
  players: PlayerStats[];
  viewType: 'overview' | 'detailed';
  height?: number; // Height of the virtualized list container
  itemHeight?: number; // Height of each player card
}

// Default item height for player cards (adjust based on actual card height)
const DEFAULT_ITEM_HEIGHT = 200;

// Default container height
const DEFAULT_HEIGHT = 600;

export const PlayerGridVirtualized: React.FC<PlayerGridVirtualizedProps> = ({
  players,
  viewType,
  height = DEFAULT_HEIGHT,
  itemHeight = DEFAULT_ITEM_HEIGHT
}) => {
  // Render function for each virtualized item
  const renderPlayerItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const player = players[index];
      
      return (
        <div style={style} className="px-2">
          {viewType === 'overview' ? (
            <PlayerOverviewCard player={player} />
          ) : (
            <PlayerDetailedCard player={player} />
          )}
        </div>
      );
    },
    [players, viewType]
  );

  if (players.length === 0) {
    return (
      <div className="bg-card dark:bg-card rounded-lg shadow-md p-6 text-center">
        <p className="text-muted-foreground dark:text-muted-foreground">
          No player data available for this team.
        </p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={players.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={3} // Number of items to render outside the visible area
      itemData={players}
    >
      {renderPlayerItem}
    </List>
  );
}; 
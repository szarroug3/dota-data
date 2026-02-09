import React from 'react';
import { List } from 'react-window';

import { PlayerDetailedCard } from '@/frontend/players/components/stateless/PlayerDetailedCard';
import { PlayerOverviewCard } from '@/frontend/players/components/stateless/PlayerOverviewCard';
import type { PlayerStats } from '@/frontend/players/hooks/usePlayerStatsPage';

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

type PlayerRowProps = {
  players: PlayerStats[];
  viewType: 'overview' | 'detailed';
};

type PlayerRowComponentProps = {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
} & PlayerRowProps;

const PlayerRow = ({ index, style, ariaAttributes, players, viewType }: PlayerRowComponentProps) => {
  const player = players[index];
  if (!player) return null;
  return (
    <div style={style} className="px-2" {...ariaAttributes}>
      {viewType === 'overview' ? <PlayerOverviewCard player={player} /> : <PlayerDetailedCard player={player} />}
    </div>
  );
};

export const PlayerGridVirtualized: React.FC<PlayerGridVirtualizedProps> = ({
  players,
  viewType,
  height = DEFAULT_HEIGHT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}) => {
  const rowProps = React.useMemo(
    () => ({
      players,
      viewType,
    }),
    [players, viewType],
  );

  if (players.length === 0) {
    return (
      <div className="bg-card dark:bg-card rounded-lg shadow-md p-6 text-center">
        <p className="text-muted-foreground dark:text-muted-foreground">No player data available for this team.</p>
      </div>
    );
  }

  return (
    <List
      defaultHeight={height}
      rowCount={players.length}
      rowHeight={itemHeight}
      rowComponent={PlayerRow}
      rowProps={rowProps}
      overscanCount={3}
      style={{ height, width: '100%' }}
    />
  );
};

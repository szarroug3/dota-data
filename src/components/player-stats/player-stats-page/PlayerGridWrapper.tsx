import React from 'react';

import { useShouldVirtualize } from '@/hooks/use-virtualization';

import { PlayerGrid } from './PlayerGrid';
import { PlayerGridVirtualized } from './PlayerGridVirtualized';
import type { PlayerStats } from './usePlayerStats';

interface PlayerGridWrapperProps {
  players: PlayerStats[];
  viewType: 'overview' | 'detailed';
  forceVirtualization?: boolean; // Override automatic detection
  virtualizationThreshold?: number; // Number of items before virtualization kicks in
  virtualizedHeight?: number;
  virtualizedItemHeight?: number;
}

export const PlayerGridWrapper: React.FC<PlayerGridWrapperProps> = ({
  players,
  viewType,
  forceVirtualization,
  virtualizationThreshold = 20,
  virtualizedHeight = 600,
  virtualizedItemHeight = 200
}) => {
  const shouldVirtualize = useShouldVirtualize(players.length, virtualizationThreshold);
  const useVirtualization = forceVirtualization ?? shouldVirtualize;

  if (useVirtualization) {
    return (
      <PlayerGridVirtualized
        players={players}
        viewType={viewType}
        height={virtualizedHeight}
        itemHeight={virtualizedItemHeight}
      />
    );
  }

  return (
    <PlayerGrid
      players={players}
      viewType={viewType}
    />
  );
}; 
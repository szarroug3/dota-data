import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

import { PlayerAvatar } from './PlayerAvatar';
import { type PlayerRank, type PlayerStats } from './usePlayerCard';





interface CompactPlayerCardProps {
  player: Player;
  stats: PlayerStats;
  rank: PlayerRank;
  isSelected?: boolean;
  onSelect?: () => void;
  onHide?: () => void;
  onViewDetails?: () => void;
  showStats?: boolean;
  showRank?: boolean;
  showPerformance?: boolean;
  className?: string;
}

export const CompactPlayerCard: React.FC<CompactPlayerCardProps> = ({
  player,
  onSelect,
  className
}) => {
  const handleSelect = onSelect;

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-3 cursor-pointer
        hover:shadow-md transition-all duration-200 ${className}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect?.();
        }
      }}
    >
      <div className="flex items-center space-x-3">
        <PlayerAvatar player={player} size="compact" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">
            {player.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {player.role} • Unranked
          </div>
        </div>
      </div>
    </div>
  );
}; 
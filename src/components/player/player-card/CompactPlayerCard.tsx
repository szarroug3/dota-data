import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import React from 'react';


import { Badge } from '@/components/ui/badge';
import type { Player } from '@/types/contexts/player-context-value';

import { PlayerAvatar } from './PlayerAvatar';
import { type PlayerRank, type PlayerStats } from './usePlayerCard';

// Helper to get player display name
const getPlayerDisplayName = (player: Player): string => {
  if (player.isLoading) {
    return `Loading ${player.profile.profile.account_id}`;
  }
  
  return player.profile.profile.personaname || `Player ${player.profile.profile.account_id}`;
};

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
  const isLoading = player.isLoading || false;
  const hasError = Boolean(player.error);
  const playerName = getPlayerDisplayName(player);

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-3 cursor-pointer
        hover:shadow-md transition-all duration-200 ${hasError ? 'border-destructive' : ''} ${className}`}
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
            {playerName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {isLoading && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-4 w-4" />
                Loading
              </Badge>
            )}
            {hasError && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
            {!isLoading && !hasError && (
              <>
                <span>Unranked</span>
                {hasError && <span>• {player.error}</span>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 
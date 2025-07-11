import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

import { CompactPlayerCard } from './player-card/CompactPlayerCard';
import { DefaultPlayerCard } from './player-card/DefaultPlayerCard';
import { LargePlayerCard } from './player-card/LargePlayerCard';
import { usePlayerCard, type PlayerRank, type PlayerStats } from './player-card/usePlayerCard';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isHidden?: boolean;
  onSelect?: (playerId: string) => void;
  onHide?: (playerId: string) => void;
  onViewDetails?: (playerId: string) => void;
  size?: 'compact' | 'default' | 'large';
  showStats?: boolean;
  showRank?: boolean;
  showPerformance?: boolean;
  className?: string;
}

// Helper function to get player card component based on size
type PlayerCardVariantProps = {
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
};

const getPlayerCardComponent = (size: string, cardProps: PlayerCardVariantProps) => {
  switch (size) {
    case 'compact':
      return <CompactPlayerCard {...cardProps} />;
    case 'large':
      return <LargePlayerCard {...cardProps} />;
    default:
      return <DefaultPlayerCard {...cardProps} />;
  }
};

// Helper function to build card props
const buildCardProps = (
  player: Player,
  stats: PlayerStats,
  rank: PlayerRank,
  isSelected: boolean,
  onSelect?: (playerId: string) => void,
  onHide?: (playerId: string) => void,
  onViewDetails?: (playerId: string) => void,
  showStats = true,
  showRank = true,
  showPerformance = true,
  className = ''
): PlayerCardVariantProps => ({
  player,
  stats,
  rank,
  isSelected,
  onSelect: onSelect ? () => onSelect(player.id) : undefined,
  onHide: onHide ? () => onHide(player.id) : undefined,
  onViewDetails: onViewDetails ? () => onViewDetails(player.id) : undefined,
  showStats,
  showRank,
  showPerformance,
  className,
});

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected = false,
  isHidden = false,
  onSelect,
  onHide,
  onViewDetails,
  size = 'default',
  showStats = true,
  showRank = true,
  showPerformance = true,
  className = ''
}) => {
  const { stats, rank } = usePlayerCard();

  if (isHidden) {
    return null;
  }

  const cardProps = buildCardProps(
    player,
    stats,
    rank,
    isSelected,
    onSelect,
    onHide,
    onViewDetails,
    showStats,
    showRank,
    showPerformance,
    className
  );

  return getPlayerCardComponent(size, cardProps);
};

/**
 * Player Card Skeleton Component
 * 
 * Loading skeleton for player cards
 */
export const PlayerCardSkeleton: React.FC<{ 
  size?: 'compact' | 'default' | 'large';
  className?: string;
}> = ({ size = 'default', className = '' }) => {
  const baseClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse ${className}`;

  if (size === 'compact') {
    return (
      <div data-testid="compact-player-card" className={`${baseClasses} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-1">
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (size === 'large') {
    return (
      <div data-testid="large-player-card" className={`${baseClasses} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="default-player-card" className={`${baseClasses} p-4`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="space-y-2">
            <div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <div className="w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Player Card List Component
 * 
 * A list wrapper for multiple player cards
 */
export const PlayerCardList: React.FC<{
  players: Player[];
  selectedPlayerId?: string | null;
  hiddenPlayerIds?: string[];
  onSelectPlayer?: (playerId: string) => void;
  onHidePlayer?: (playerId: string) => void;
  onViewDetails?: (playerId: string) => void;
  size?: 'compact' | 'default' | 'large';
  showStats?: boolean;
  showRank?: boolean;
  showPerformance?: boolean;
  className?: string;
}> = ({
  players,
  selectedPlayerId,
  hiddenPlayerIds = [],
  onSelectPlayer,
  onHidePlayer,
  onViewDetails,
  size = 'default',
  showStats = true,
  showRank = true,
  showPerformance = true,
  className = ''
}) => {
  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No players found
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isSelected={selectedPlayerId === player.id}
          isHidden={hiddenPlayerIds.includes(player.id)}
          onSelect={onSelectPlayer}
          onHide={onHidePlayer}
          onViewDetails={onViewDetails}
          size={size}
          showStats={showStats}
          showRank={showRank}
          showPerformance={showPerformance}
        />
      ))}
    </div>
  );
}; 
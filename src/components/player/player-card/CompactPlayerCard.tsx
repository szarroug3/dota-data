import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

import { PlayerAvatar } from './PlayerAvatar';
import { RecentMatchesIndicator } from './RecentMatchesIndicator';
import { usePlayerCard, type PlayerRank, type PlayerStats } from './usePlayerCard';

interface PlayerCardActionsProps {
  onHide?: () => void;
  onViewDetails?: () => void;
}

const PlayerCardActions: React.FC<PlayerCardActionsProps> = ({ onHide, onViewDetails }) => (
  <div className="flex items-center space-x-2">
    {onViewDetails && (
      <button
        onClick={onViewDetails}
        className="text-xs text-blue-600 hover:underline"
        tabIndex={0}
      >
        Details
      </button>
    )}
    {onHide && (
      <button
        onClick={onHide}
        className="text-xs text-red-600 hover:underline"
        tabIndex={0}
      >
        Hide
      </button>
    )}
  </div>
);

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
  stats,
  rank,
  isSelected,
  onSelect,
  onHide,
  onViewDetails,
  showRank,
  showPerformance,
  className
}) => {
  const { getWinRateColor } = usePlayerCard();

  const handleSelect = onSelect;

  const handleHide = () => {
    if (onHide) onHide();
  };

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails();
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PlayerAvatar player={player} size="compact" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {player.name}
            </div>
            {showRank && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {rank.tier} {rank.rank}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {showPerformance && <RecentMatchesIndicator matches={stats.recentPerformance.lastFiveMatches} />}
          <div className={`text-sm font-bold ${getWinRateColor(stats.winRate)}`}>
            {stats.winRate.toFixed(1)}%
          </div>
          <PlayerCardActions onHide={handleHide} onViewDetails={handleViewDetails} />
        </div>
      </div>
    </div>
  );
}; 
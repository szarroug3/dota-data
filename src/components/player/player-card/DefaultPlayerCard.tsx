import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

import { PerformanceIndicator } from './PerformanceIndicator';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerRankBadge } from './PlayerRankBadge';
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
        className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20"
        tabIndex={0}
      >
        View Details
      </button>
    )}
    {onHide && (
      <button
        onClick={onHide}
        className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
        tabIndex={0}
      >
        Hide
      </button>
    )}
  </div>
);

interface DefaultPlayerCardProps {
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

export const DefaultPlayerCard: React.FC<DefaultPlayerCardProps> = ({
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
}) => {
  const { formatNumber, getKDAColor, getWinRateColor } = usePlayerCard();

  const handleSelect = onSelect;

  const handleHide = () => {
    if (onHide) onHide();
  };

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails();
  };

  return (
    <div
      className={`bg-card dark:bg-card rounded-lg shadow border border-border dark:border-border p-4
        hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <PlayerAvatar player={player} size="default" />
          <div>
            <h3 className="text-lg font-bold text-foreground dark:text-foreground">{player.name}</h3>
            {showRank && <PlayerRankBadge rank={rank} />}
          </div>
        </div>
        <PlayerCardActions onHide={handleHide} onViewDetails={handleViewDetails} />
      </div>

      {showStats && (
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
            <div className={`text-xl font-bold ${getWinRateColor(stats.winRate)}`}>{stats.winRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg. KDA</div>
            <div className={`text-xl font-bold ${getKDAColor(stats.averageKDA)}`}>{stats.averageKDA.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg. GPM</div>
            <div className="text-xl font-bold text-foreground dark:text-foreground">{formatNumber(stats.averageGPM)}</div>
          </div>
        </div>
      )}

      {showPerformance && (
        <div className="flex items-center justify-between pt-3 border-t border-border dark:border-border">
          <PerformanceIndicator stats={stats} />
          <RecentMatchesIndicator matches={stats.recentPerformance.lastFiveMatches} />
        </div>
      )}
    </div>
  );
}; 
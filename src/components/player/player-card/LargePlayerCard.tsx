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
  <div className="flex items-center space-x-3">
    {onViewDetails && (
      <button
        onClick={onViewDetails}
        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        tabIndex={0}
      >
        View Full Details
      </button>
    )}
    {onHide && (
      <button
        onClick={onHide}
        className="px-3 py-1 text-sm bg-muted text-foreground rounded-md hover:bg-accent"
        tabIndex={0}
      >
        Hide
      </button>
    )}
  </div>
);

interface LargePlayerCardProps {
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

export const LargePlayerCard: React.FC<LargePlayerCardProps> = ({
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
      className={`bg-card dark:bg-card rounded-xl shadow-lg border border-border dark:border-border
        hover:shadow-xl transition-all duration-300
        ${isSelected ? 'ring-4 ring-blue-500/50 border-blue-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-5">
            <PlayerAvatar player={player} size="large" />
            <div>
              <h2 className="text-2xl font-extrabold text-foreground dark:text-foreground">{player.name}</h2>
              {showRank && <PlayerRankBadge rank={rank} />}
            </div>
          </div>
          <PlayerCardActions onHide={handleHide} onViewDetails={handleViewDetails} />
        </div>

        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center p-4 bg-muted dark:bg-muted/50 rounded-lg mb-5">
            <div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
              <div className={`text-2xl font-bold ${getWinRateColor(stats.winRate)}`}>{stats.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg. KDA</div>
              <div className={`text-2xl font-bold ${getKDAColor(stats.averageKDA)}`}>{stats.averageKDA.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg. GPM</div>
              <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatNumber(stats.averageGPM)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg. XPM</div>
              <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatNumber(stats.averageXPM)}</div>
            </div>
          </div>
        )}

        {showPerformance && (
          <div className="flex items-center justify-between">
            <PerformanceIndicator stats={stats} />
            <RecentMatchesIndicator matches={stats.recentPerformance.lastFiveMatches} />
          </div>
        )}
      </div>

      <div className="bg-muted dark:bg-muted/50 px-6 py-4 rounded-b-xl">
        <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">Favorite Hero</h4>
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground dark:text-foreground">{stats.favoriteHero.name}</span>
          <div className="text-right">
            <div className="text-sm font-bold">{stats.favoriteHero.winRate.toFixed(1)}% WR</div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">{stats.favoriteHero.matches} matches</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
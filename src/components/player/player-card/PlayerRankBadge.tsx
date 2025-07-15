import React from 'react';

import { usePlayerCard, type PlayerRank } from './usePlayerCard';

interface PlayerRankBadgeProps {
  rank: PlayerRank;
}

export const PlayerRankBadge: React.FC<PlayerRankBadgeProps> = ({ rank }) => {
  const { formatNumber, getRankColor } = usePlayerCard();

  return (
    <div className="flex items-center space-x-2">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRankColor(rank.tier)} bg-muted dark:bg-muted`}>
        {rank.tier} {rank.rank}
      </div>
      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
        {formatNumber(rank.mmr)} MMR
      </span>
    </div>
  );
}; 
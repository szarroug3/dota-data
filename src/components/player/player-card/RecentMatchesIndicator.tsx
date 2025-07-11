import React from 'react';

import type { PlayerStats } from './usePlayerCard';

interface RecentMatchesIndicatorProps {
  matches: PlayerStats['recentPerformance']['lastFiveMatches'];
}

export const RecentMatchesIndicator: React.FC<RecentMatchesIndicatorProps> = ({ matches }) => (
  <div className="flex items-center space-x-1">
    {matches.map((match, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${match.win ? 'bg-green-500' : 'bg-red-500'}`}
        title={`${match.win ? 'Win' : 'Loss'} as ${match.heroName} (${match.kda} KDA)`}
      />
    ))}
  </div>
); 
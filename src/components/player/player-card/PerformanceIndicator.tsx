import React from 'react';

import { usePlayerCard, type PlayerStats } from './usePlayerCard';

interface PerformanceIndicatorProps {
  stats: PlayerStats;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ stats }) => {
  const { getTrendIcon, getTrendColor } = usePlayerCard();
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1">
        <span className="text-sm">{getTrendIcon(stats.recentPerformance.trend)}</span>
        <span className={`text-sm font-medium ${getTrendColor(stats.recentPerformance.trend)}`}>
          {stats.recentPerformance.trend}
        </span>
      </div>
      <div className="text-sm text-muted-foreground dark:text-muted-foreground">
        {stats.recentPerformance.streak} game streak
      </div>
    </div>
  );
}; 
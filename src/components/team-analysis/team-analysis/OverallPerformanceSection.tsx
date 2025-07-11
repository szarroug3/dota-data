import React from 'react';

import { OverallStatCard } from './OverallStatCard';
import type { TeamAnalysis } from './useTeamAnalysis';

interface OverallPerformanceSectionProps {
  teamAnalysis: TeamAnalysis;
}

export const OverallPerformanceSection: React.FC<OverallPerformanceSectionProps> = ({ teamAnalysis }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overall Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverallStatCard
          title="Win Rate"
          value={`${teamAnalysis.overall.winRate.toFixed(1)}%`}
          subtitle={`${teamAnalysis.overall.totalMatches} matches`}
        />
        <OverallStatCard
          title="Avg. Match Duration"
          value={`${teamAnalysis.overall.averageMatchDuration.toFixed(0)}m`}
          subtitle="Average game length"
        />
        <OverallStatCard
          title="Best Strategy"
          value={teamAnalysis.overall.mostSuccessfulStrategy}
          subtitle="Most successful approach"
        />
        <OverallStatCard
          title="Preferred Side"
          value={teamAnalysis.overall.preferredSide}
          subtitle="Better performance on"
        />
      </div>
    </div>
  );
}; 
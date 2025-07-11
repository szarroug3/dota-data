import React from 'react';

import { HeroPerformanceCard } from './HeroPerformanceCard';
import type { TeamAnalysis } from './useTeamAnalysis';

interface HeroPerformanceSectionProps {
  teamAnalysis: TeamAnalysis;
}

export const HeroPerformanceSection: React.FC<HeroPerformanceSectionProps> = ({ teamAnalysis }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hero Performance</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeroPerformanceCard
          title="Most Successful Heroes"
          heroes={teamAnalysis.heroPerformance.mostSuccessful}
          type="success"
        />
        <HeroPerformanceCard
          title="Underperforming Heroes"
          heroes={teamAnalysis.heroPerformance.underperforming}
          type="underperform"
        />
      </div>
    </div>
  );
}; 
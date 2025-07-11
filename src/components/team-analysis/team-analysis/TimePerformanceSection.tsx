import React from 'react';

import { TimePatternCard } from './TimePatternCard';
import type { TeamAnalysis } from './useTeamAnalysis';

interface TimePerformanceSectionProps {
  teamAnalysis: TeamAnalysis;
}

export const TimePerformanceSection: React.FC<TimePerformanceSectionProps> = ({ teamAnalysis }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Performance by Game Phase</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TimePatternCard
          title="Early Game"
          performance={teamAnalysis.timePatterns.earlyGame.performance}
          trend={teamAnalysis.timePatterns.earlyGame.trend}
        />
        <TimePatternCard
          title="Mid Game"
          performance={teamAnalysis.timePatterns.midGame.performance}
          trend={teamAnalysis.timePatterns.midGame.trend}
        />
        <TimePatternCard
          title="Late Game"
          performance={teamAnalysis.timePatterns.lateGame.performance}
          trend={teamAnalysis.timePatterns.lateGame.trend}
        />
      </div>
    </div>
  );
}; 
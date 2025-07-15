import React from 'react';

import type { TeamAnalysis } from './useTeamAnalysis';

interface TimePerformanceSectionProps {
  data: TeamAnalysis;
}

export const TimePerformanceSection: React.FC<TimePerformanceSectionProps> = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-4">Performance by Game Phase</h3>
      {/* Implementation would go here */}
    </div>
  );
}; 
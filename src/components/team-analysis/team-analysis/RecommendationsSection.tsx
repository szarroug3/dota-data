import React from 'react';

import { RecommendationCard } from './RecommendationCard';
import type { TeamAnalysis } from './useTeamAnalysis';

interface RecommendationsSectionProps {
  teamAnalysis: TeamAnalysis;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ teamAnalysis }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
      <div className="space-y-4">
        {teamAnalysis.recommendations.map((recommendation, index) => (
          <RecommendationCard key={index} recommendation={recommendation} />
        ))}
      </div>
    </div>
  );
}; 
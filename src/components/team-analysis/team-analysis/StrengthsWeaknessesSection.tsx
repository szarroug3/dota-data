import React from 'react';

import { StrengthCard } from './StrengthCard';
import type { TeamAnalysis } from './useTeamAnalysis';
import { WeaknessCard } from './WeaknessCard';

interface StrengthsWeaknessesSectionProps {
  teamAnalysis: TeamAnalysis;
}

export const StrengthsWeaknessesSection: React.FC<StrengthsWeaknessesSectionProps> = ({ teamAnalysis }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Strengths & Weaknesses</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Strengths</h4>
          <div className="space-y-3">
            {teamAnalysis.strengths.map((strength, index) => (
              <StrengthCard key={index} strength={strength} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Areas for Improvement</h4>
          <div className="space-y-3">
            {teamAnalysis.weaknesses.map((weakness, index) => (
              <WeaknessCard key={index} weakness={weakness} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
import React from 'react';

import type { Team } from '@/types/contexts/team-context-value';

interface ControlsSectionProps {
  analysisType: 'overview' | 'detailed' | 'comparison';
  timeRange: number;
  activeTeam: Team | null;
  activeTeamId: string;
  onAnalysisTypeChange: (type: 'overview' | 'detailed' | 'comparison') => void;
  onTimeRangeChange: (range: number) => void;
}

export const ControlsSection: React.FC<ControlsSectionProps> = ({
  analysisType,
  timeRange,
  activeTeam,
  activeTeamId,
  onAnalysisTypeChange,
  onTimeRangeChange
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analysis for {activeTeam?.name || `Team ${activeTeamId}`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View detailed performance metrics and insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="analysis-type-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis Type:
            </label>
            <select
              id="analysis-type-select"
              value={analysisType}
              onChange={(e) => onAnalysisTypeChange(e.target.value as 'overview' | 'detailed' | 'comparison')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed</option>
              <option value="comparison">Comparison</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="time-range-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <select
              id="time-range-select"
              value={timeRange}
              onChange={(e) => onTimeRangeChange(Number(e.target.value))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}; 
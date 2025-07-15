import React from 'react';

interface ControlsSectionProps {
  analysisType: string;
  timeRange: string;
  onAnalysisTypeChange: (type: string) => void;
  onTimeRangeChange: (range: string) => void;
}

export const ControlsSection: React.FC<ControlsSectionProps> = ({ 
  analysisType, 
  timeRange, 
  onAnalysisTypeChange, 
  onTimeRangeChange 
}) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-4 mb-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Analysis Controls
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize your analysis parameters to focus on specific aspects of team performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="analysis-type-select" className="text-sm font-medium text-foreground">
              Analysis Type
            </label>
            <select
              id="analysis-type-select"
              value={analysisType}
              onChange={(e) => onAnalysisTypeChange(e.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="overall">Overall Performance</option>
              <option value="heroes">Hero Performance</option>
              <option value="time">Time-based Analysis</option>
              <option value="recommendations">Recommendations</option>
            </select>
          </div>

          <div>
            <label htmlFor="time-range-select" className="text-sm font-medium text-foreground">
              Time Range
            </label>
            <select
              id="time-range-select"
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}; 
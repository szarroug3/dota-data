import React from 'react';

import type { MatchDetails } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelAnalyticsProps {
  match: MatchDetails | null;
  className?: string;
}

export const MatchDetailsPanelAnalytics: React.FC<MatchDetailsPanelAnalyticsProps> = ({ match, className = '' }) => {
  if (!match) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No match selected</div>
          <div className="text-sm">Select a match to see details.</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`p-4 ${className}`}>
      <div className="text-lg font-bold mb-2">{match.opponent}</div>
      <div className="text-sm text-muted-foreground">Analytics and charts go here...</div>
    </div>
  );
}; 
import React from 'react';

import type { MatchDetails } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelDetailedProps {
  match: MatchDetails | null;
  className?: string;
}

export const MatchDetailsPanelDetailed: React.FC<MatchDetailsPanelDetailedProps> = ({ match, className = '' }) => {
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
      <div className="mb-4">
        <div className="text-xl font-bold mb-1">{match.opponent}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {new Date(match.date).toLocaleString()} • {match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
        </div>
        <div className="flex gap-2 mb-2">
          <span className="font-semibold">Result:</span>
          <span className={match.result === 'win' ? 'text-green-600' : 'text-red-600'}>
            {match.result === 'win' ? 'Victory' : 'Defeat'}
          </span>
        </div>
        <div className="flex gap-2 mb-2">
          <span className="font-semibold">Duration:</span>
          <span>{Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      {/* Add more detailed info here as needed (players, picks/bans, stats, etc.) */}
      <div className="text-sm text-muted-foreground">(Detailed match info goes here...)</div>
    </div>
  );
}; 
import React from 'react';

import type { MatchTimeline as MatchTimelineType } from './useMatchDetails';

interface MatchTimelineProps {
  timeline: MatchTimelineType[];
  formatTimestamp: (timestamp: number) => string;
  getEventIcon: (event: string) => string;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ timeline, formatTimestamp, getEventIcon }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-sm border border-border dark:border-border p-6 mb-6">
    <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4">Match Timeline</h2>
    
    <div className="space-y-3">
      {timeline.map((event, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 hover:bg-accent dark:hover:bg-accent rounded-lg">
          <div className="text-2xl">{getEventIcon(event.event)}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-muted-foreground dark:text-muted-foreground">
                {formatTimestamp(event.timestamp)}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                event.importance === 'high' ? 'bg-red-100 text-red-800' :
                event.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-muted text-foreground'
              }`}>
                {event.importance}
              </span>
            </div>
            <div className="text-sm text-foreground dark:text-foreground mt-1">
              {event.description}
            </div>
            {event.player && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                {event.player} ({event.hero})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
); 
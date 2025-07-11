import React from 'react';

import type { MatchTimeline as MatchTimelineType } from './useMatchDetails';

interface MatchTimelineProps {
  timeline: MatchTimelineType[];
  formatTimestamp: (timestamp: number) => string;
  getEventIcon: (event: string) => string;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ timeline, formatTimestamp, getEventIcon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Match Timeline</h2>
    
    <div className="space-y-3">
      {timeline.map((event, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
          <div className="text-2xl">{getEventIcon(event.event)}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                {formatTimestamp(event.timestamp)}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                event.importance === 'high' ? 'bg-red-100 text-red-800' :
                event.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.importance}
              </span>
            </div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">
              {event.description}
            </div>
            {event.player && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {event.player} ({event.hero})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
); 
import React from 'react';

import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';

import { DetailLevelControls } from './match-details/DetailLevelControls';
import { DraftPhaseSection } from './match-details/DraftPhaseSection';
import { MatchHeader } from './match-details/MatchHeader';
import { MatchTimeline } from './match-details/MatchTimeline';
import { PlayerPerformanceSection } from './match-details/PlayerPerformanceSection';
import { useMatchDetails } from './match-details/useMatchDetails';

/**
 * Match Details Component
 * 
 * Displays comprehensive match information including player performance,
 * hero picks, match timeline, and detailed statistics with different levels of detail.
 */

interface MatchDetailsProps {
  matchId: string;
  level?: 'basic' | 'advanced' | 'expert';
  onClose?: () => void;
  className?: string;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  matchId, 
  level = 'basic', 
  onClose, 
  className = '' 
}) => {
  const {
    matchDetails,
    isLoading,
    error,
    currentLevel,
    setCurrentLevel,
    formatDuration,
    formatTimestamp,
    formatNumber,
    getKDAColor,
    getEventIcon
  } = useMatchDetails(matchId, level);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <LoadingSkeleton type="text" lines={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800 dark:text-red-200 font-medium">Error loading match details</span>
        </div>
        <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">Match not found</span>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 mt-2">The requested match could not be found.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <MatchHeader match={matchDetails} onClose={onClose} formatDuration={formatDuration} />
      
      <DetailLevelControls currentLevel={currentLevel} onLevelChange={setCurrentLevel} />
      
      <PlayerPerformanceSection 
        players={matchDetails.players} 
        level={currentLevel}
        formatNumber={formatNumber}
        getKDAColor={getKDAColor}
      />
      
      {currentLevel !== 'basic' && (
        <DraftPhaseSection picks={matchDetails.picks} bans={matchDetails.bans} />
      )}
      
      {currentLevel === 'expert' && (
        <MatchTimeline 
          timeline={matchDetails.timeline}
          formatTimestamp={formatTimestamp}
          getEventIcon={getEventIcon}
        />
      )}
    </div>
  );
}; 
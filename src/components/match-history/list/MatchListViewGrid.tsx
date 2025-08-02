import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { HideButton } from '../common/HideButton';

interface MatchListViewGridProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  className?: string;
  activeTeamSide?: 'radiant' | 'dire';
  teamMatches?: Record<number, TeamMatchParticipation>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const MatchListViewGrid: React.FC<MatchListViewGridProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  className = '',
  activeTeamSide,
  teamMatches,
}) => {
  if (matches.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No matches found</div>
          <div className="text-sm">Try adjusting your filters or adding more matches.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {matches.map((match) => {
        // Get opponent name from team data
        const opponentName = teamMatches?.[match.id]?.opponentName || `Match ${match.id}`;
        
        // Determine if active team won
        const teamWon = activeTeamSide ? match.result === activeTeamSide : false;
        
        // Check if match has an error
        const hasError = Boolean(match.error);
        const isLoading = Boolean(match.isLoading);
        
        // Handle click - only allow selection if no error
        const handleClick = () => {
          if (!hasError) {
            onSelectMatch(match.id);
          }
        };
        
        return (
          <Card
            key={match.id}
            data-match-id={match.id}
            className={`transition-all ${
              selectedMatchId === match.id 
                ? 'ring-2 ring-primary' 
                : hasError
                ? 'border-destructive bg-destructive/5 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-md'
            }`}
            onClick={handleClick}
            role="button"
            tabIndex={hasError ? -1 : 0}
            aria-label={hasError ? `Match ${match.id} - Error: ${match.error}` : `Select match vs ${opponentName}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div 
                  className={`font-medium text-sm truncate flex-1 ${
                    hasError ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={handleClick}
                >
                  {opponentName}
                </div>
                <HideButton
                  onClick={() => onHideMatch(match.id)}
                  ariaLabel={`Hide match`}
                  className="ml-1"
                />
              </div>
              <div 
                className={`flex items-center gap-1 mb-1 ${
                  hasError ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={handleClick}
              >
                {hasError ? (
                  <Badge variant="destructive" className="text-xs">
                    Error
                  </Badge>
                ) : isLoading ? (
                  <Badge variant="secondary" className="text-xs">
                    Loading
                  </Badge>
                ) : (
                  <>
                    <Badge
                      variant={teamWon ? 'success' : 'default'}
                      className="text-xs"
                    >
                      {teamWon ? 'Victory' : 'Defeat'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {activeTeamSide === 'radiant' ? 'Radiant' : 'Dire'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDuration(match.duration)}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 
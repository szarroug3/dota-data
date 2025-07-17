import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

import { HideButton } from '../common/HideButton';

interface MatchListViewProps {
  matches: Match[]; 
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  className?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const MatchListViewList: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  className
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
    <div className={`space-y-2 ${className}`}>
      {matches.map((match) => (
        <Card 
          key={match.id}
          className={`transition-all duration-200 ${
            selectedMatchId === match.id 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-accent/50 cursor-pointer hover:shadow-md'
          }`}
          onClick={() => onSelectMatch(match.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectMatch(match.id);
            }
          }}
          aria-label={`Select match vs ${match.opponent}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectMatch(match.id)}
              >
                <div className="font-medium">{match.opponent}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(match.date)} • {formatDuration(match.duration)} • {match.teamSide}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={match.result === 'win' ? 'success' : 'default'}>
                  {match.result === 'win' ? 'Victory' : 'Defeat'}
                </Badge>
                <Badge variant="outline">
                  {match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
                </Badge>
                <HideButton
                  onClick={() => onHideMatch(match.id)}
                  ariaLabel={`Hide match vs ${match.opponent}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 
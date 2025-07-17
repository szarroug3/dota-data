import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

import { HideButton } from '../common/HideButton';

interface MatchListViewCardProps {
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
    year: 'numeric',
  });
}

export const MatchListViewCard: React.FC<MatchListViewCardProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  className = '',
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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {matches.map((match) => (
        <Card
          key={match.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedMatchId === match.id ? 'ring-2 ring-primary' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle 
                className="cursor-pointer"
                onClick={() => onSelectMatch(match.id)}
              >
                {match.opponent}
              </CardTitle>
              <HideButton
                onClick={() => onHideMatch(match.id)}
                ariaLabel={`Hide match vs ${match.opponent}`}
              />
            </div>
          </CardHeader>
          <CardContent 
            className="cursor-pointer"
            onClick={() => onSelectMatch(match.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={match.result === 'win' ? 'secondary' : 'destructive'}>
                {match.result === 'win' ? 'Victory' : 'Defeat'}
              </Badge>
              <Badge variant="outline">
                {match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {formatDate(match.date)} • {formatDuration(match.duration)}
            </div>
            <div className="flex flex-wrap gap-1">
              {match.heroes.slice(0, 4).map((hero, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {hero}
                </Badge>
              ))}
              {match.heroes.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{match.heroes.length - 4}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 
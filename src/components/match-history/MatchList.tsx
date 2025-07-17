/**
 * Match List Component
 * 
 * Stateless component for displaying a list of matches.
 * Uses MatchCard components for individual match display.
 */

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

import { MatchCard } from './MatchCard';

// ============================================================================
// TYPES
// ============================================================================

interface MatchListProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch
}) => {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              No matches found with the current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match History</CardTitle>
        <p className="text-sm text-muted-foreground">
          {matches.length} match{matches.length !== 1 ? 'es' : ''} found
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isSelected={selectedMatchId === match.id}
              onSelect={() => onSelectMatch(match.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 
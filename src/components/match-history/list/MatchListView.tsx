import React from 'react';

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchListViewCard } from './MatchListViewCard';
import { MatchListViewGrid } from './MatchListViewGrid';
import { MatchListViewList } from './MatchListViewList';

export type MatchListViewMode = 'list' | 'card' | 'grid';

interface MatchListViewProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
  allMatches?: Match[]; // Unfiltered matches for hero performance calculation
  onScrollToMatch?: (matchId: number) => void;
}

export const MatchListView: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  teamMatches,
  hiddenMatchIds = new Set(),
  allMatches = [],
  onScrollToMatch
}) => {
  if (viewMode === 'list') {
    return (
      <MatchListViewList
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
        allMatches={allMatches}
        onScrollToMatch={onScrollToMatch}
      />
    );
  }
  if (viewMode === 'card') {
    return (
      <MatchListViewCard
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        teamMatches={teamMatches}
        onScrollToMatch={onScrollToMatch}
      />
    );
  }
  if (viewMode === 'grid') {
    return (
      <MatchListViewGrid
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        teamMatches={teamMatches}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center p-8 text-muted-foreground`}>
      <div className="text-center">
        <div className="text-lg font-medium mb-2">This view mode is not yet implemented.</div>
        <div className="text-sm">Try switching to list, card, or grid view.</div>
      </div>
    </div>
  );
}; 
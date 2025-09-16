import React from 'react';

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchListViewCard } from './MatchListViewCard';
import { MatchListViewList } from './MatchListViewList';

export type MatchListViewMode = 'list' | 'card';

interface MatchListViewProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
  allMatches?: Match[];
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
  onScrollToMatch,
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
  return (
    <div className={`flex items-center justify-center p-8 text-muted-foreground`}>
      <div className="text-center">
        <div className="text-lg font-medium mb-2">This view mode is not yet implemented.</div>
        <div className="text-sm">Try switching to list or card view.</div>
      </div>
    </div>
  );
};

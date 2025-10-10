import React from 'react';

import type { Match, TeamMatchParticipation } from '@/frontend/lib/app-data-types';

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
  teamMatches: Map<number, TeamMatchParticipation>;
  allMatches: Match[];
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

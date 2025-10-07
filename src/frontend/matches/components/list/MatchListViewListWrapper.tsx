import React from 'react';

import type { Match, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import { useShouldVirtualize } from '@/hooks/use-virtualization';

import { MatchListViewList } from './MatchListViewList';
import { MatchListViewListVirtualized } from './MatchListViewListVirtualized';

interface MatchListViewListWrapperProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches: Map<number, TeamMatchParticipation>;
  hiddenMatchIds: Set<number>;
  allMatches: Match[];
  forceVirtualization?: boolean;
  virtualizationThreshold?: number;
  virtualizedHeight?: number;
  virtualizedItemHeight?: number;
}

export const MatchListViewListWrapper: React.FC<MatchListViewListWrapperProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className,
  teamMatches,
  hiddenMatchIds,
  allMatches,
  forceVirtualization,
  virtualizationThreshold = 50,
  virtualizedHeight = 600,
  virtualizedItemHeight = 120,
}) => {
  const shouldVirtualize = useShouldVirtualize(matches.length, virtualizationThreshold);
  const useVirtualization = forceVirtualization ?? shouldVirtualize;

  if (useVirtualization) {
    return (
      <MatchListViewListVirtualized
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        className={className}
        teamMatches={teamMatches}
        height={virtualizedHeight}
        itemHeight={virtualizedItemHeight}
      />
    );
  }

  return (
    <MatchListViewList
      matches={matches}
      selectedMatchId={selectedMatchId}
      onSelectMatch={onSelectMatch}
      onHideMatch={onHideMatch}
      onRefreshMatch={onRefreshMatch}
      className={className}
      teamMatches={teamMatches}
      hiddenMatchIds={hiddenMatchIds}
      allMatches={allMatches}
    />
  );
};

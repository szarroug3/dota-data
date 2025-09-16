import React from 'react';

import { useShouldVirtualize } from '@/hooks/use-virtualization';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchListViewList } from './MatchListViewList';
import { MatchListViewListVirtualized } from './MatchListViewListVirtualized';

interface MatchListViewListWrapperProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>;
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
    />
  );
};

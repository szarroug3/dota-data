import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchCard } from './MatchListViewList';

interface MatchListViewVirtualizedProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>;
  height?: number;
  itemHeight?: number;
}

const DEFAULT_ITEM_HEIGHT = 120;
const DEFAULT_HEIGHT = 600;

export const MatchListViewListVirtualized: React.FC<MatchListViewVirtualizedProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className,
  teamMatches,
  height = DEFAULT_HEIGHT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}) => {
  const renderMatchItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const match = matches[index];
      return (
        <div style={style} className="px-2">
          <MatchCard
            match={match}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            teamMatches={teamMatches}
          />
        </div>
      );
    },
    [matches, selectedMatchId, onSelectMatch, onHideMatch, onRefreshMatch, teamMatches],
  );

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
    <div className={className}>
      <List
        height={height}
        itemCount={matches.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={5}
        itemData={matches}
      >
        {renderMatchItem}
      </List>
    </div>
  );
};

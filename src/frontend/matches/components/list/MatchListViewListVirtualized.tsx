import React from 'react';
import { List } from 'react-window';

import type { Match, TeamMatchParticipation } from '@/frontend/lib/app-data-types';

import { MatchCard } from './MatchListViewList';

interface MatchListViewVirtualizedProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches: Map<number, TeamMatchParticipation>;
  height?: number;
  itemHeight?: number;
  highPerformingHeroes?: Set<string>;
}

const DEFAULT_ITEM_HEIGHT = 120;
const DEFAULT_HEIGHT = 600;

type MatchRowProps = {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatches: Map<number, TeamMatchParticipation>;
  highPerformingHeroes: Set<string>;
};

type MatchRowComponentProps = {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
} & MatchRowProps;

const MatchRow = ({
  index,
  style,
  ariaAttributes,
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  teamMatches,
  highPerformingHeroes,
}: MatchRowComponentProps) => {
  const match = matches[index];
  if (!match) return null;
  return (
    <div style={style} className="px-2" {...ariaAttributes}>
      <MatchCard
        match={match}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        teamMatches={teamMatches}
        highPerformingHeroes={highPerformingHeroes}
      />
    </div>
  );
};

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
  highPerformingHeroes = new Set(),
}) => {
  const rowProps = React.useMemo(
    () => ({
      matches,
      selectedMatchId,
      onSelectMatch,
      onHideMatch,
      onRefreshMatch,
      teamMatches,
      highPerformingHeroes,
    }),
    [matches, selectedMatchId, onSelectMatch, onHideMatch, onRefreshMatch, teamMatches, highPerformingHeroes],
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
        defaultHeight={height}
        rowCount={matches.length}
        rowHeight={itemHeight}
        rowComponent={MatchRow}
        rowProps={rowProps}
        overscanCount={5}
        style={{ height, width: '100%' }}
      />
    </div>
  );
};

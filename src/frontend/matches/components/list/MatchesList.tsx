import { Eye, List, Plus, SquareStack } from 'lucide-react';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchListView, type MatchListViewMode } from './MatchListView';

const useScrollToMatch = (cardContentRef: React.RefObject<HTMLDivElement | null>) => {
  const [scrolledMatchId, setScrolledMatchId] = useState<number | null>(null);

  const handleScrollToMatch = useCallback(
    (matchId: number) => {
      if (!cardContentRef.current) return;
      if (scrolledMatchId === matchId) return;

      const container = cardContentRef.current;
      const matchElement = container.querySelector(`[data-match-id="${matchId}"]`) as HTMLElement | null;
      if (!matchElement) return;

      const containerRect = container.getBoundingClientRect();
      const elementRect = matchElement.getBoundingClientRect();
      const padding = 12;

      const isFullyVisible = elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;
      if (isFullyVisible) {
        setScrolledMatchId(matchId);
        return;
      }

      const scrollOffset = elementRect.top - containerRect.top - padding;
      const targetScrollTop = container.scrollTop + scrollOffset;
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      setScrolledMatchId(matchId);
    },
    [cardContentRef, scrolledMatchId],
  );

  return { handleScrollToMatch };
};

interface MatchesListProps {
  matches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
  allMatches?: Match[];
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
}

export interface MatchesListRef {
  scrollToMatch: (matchId: number) => void;
}

interface MatchListLayoutButtonsProps {
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
}

const MatchListLayoutButtons: React.FC<MatchListLayoutButtonsProps> = ({ viewMode, setViewMode }) => (
  <>
    <div className="@[120px]:flex hidden flex-shrink-0">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as MatchListViewMode)}>
        <TabsList className="grid w-auto grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2 min-w-0">
            <List className="w-4 h-4 flex-shrink-0" />
            <span className="@[420px]:block hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2 min-w-0">
            <SquareStack className="w-4 h-4 flex-shrink-0" />
            <span className="@[420px]:block hidden">Card</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="@[120px]:hidden h-9 w-24" />
  </>
);

interface MatchesListContentProps {
  matches: Match[];
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  teamMatches: Record<number, TeamMatchParticipation>;
  hiddenMatchIds: Set<number>;
  allMatches: Match[];
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  setViewMode: (mode: MatchListViewMode) => void;
  cardContentRef: React.RefObject<HTMLDivElement | null>;
}

const MatchesListContent: React.FC<MatchesListContentProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  teamMatches,
  hiddenMatchIds,
  allMatches,
  onScrollToMatch,
  onAddMatch,
  hiddenMatchesCount = 0,
  onShowHiddenMatches,
  setViewMode,
  cardContentRef,
}) => {
  return (
    <Card className="flex flex-col min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)]">
      <CardHeader className="flex items-center justify-between flex-shrink-0 min-w-0">
        <div className="min-w-0 overflow-hidden opacity-0 invisible @[250px]:opacity-100 @[250px]:visible">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">Match History</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
            {matches.length} matches found
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="@[260px]:flex hidden w-[60px]">
            {hiddenMatchesCount > 0 && onShowHiddenMatches && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHiddenMatches}
                className="flex items-center gap-2 w-full"
              >
                <Eye className="h-4 w-4" />
                <span>{hiddenMatchesCount}</span>
              </Button>
            )}
          </div>
          {onAddMatch && (
            <Button
              onClick={onAddMatch}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 px-3 py-1 text-xs w-[32px] @[420px]:w-[102px] @[180px]:flex hidden"
            >
              <Plus className="h-3 w-3" />
              <span className="@[420px]:block hidden">Add Match</span>
            </Button>
          )}
          <div className="ml-auto">
            <MatchListLayoutButtons viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
      </CardHeader>
      <CardContent ref={cardContentRef} className="flex-1 min-h-0 px-0 py-0 overflow-y-auto @[35px]:block hidden">
        <div className="px-4 py-2">
          <MatchListView
            matches={matches}
            selectedMatchId={selectedMatchId || null}
            onSelectMatch={onSelectMatch || (() => {})}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            viewMode={viewMode}
            teamMatches={teamMatches}
            hiddenMatchIds={hiddenMatchIds}
            allMatches={allMatches}
            onScrollToMatch={onScrollToMatch}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MatchesList = forwardRef<MatchesListRef | null, MatchesListProps>(
  (
    {
      matches,
      onHideMatch,
      onRefreshMatch,
      viewMode,
      setViewMode,
      selectedMatchId,
      onSelectMatch,
      hiddenMatchesCount = 0,
      onShowHiddenMatches,
      teamMatches = {},
      hiddenMatchIds = new Set(),
      allMatches = [],
      onScrollToMatch,
      onAddMatch,
    },
    ref,
  ) => {
    const cardContentRef = React.useRef<HTMLDivElement>(null);
    const { handleScrollToMatch } = useScrollToMatch(cardContentRef);

    useImperativeHandle(ref, () => ({ scrollToMatch: handleScrollToMatch }));

    return (
      <MatchesListContent
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        viewMode={viewMode}
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
        allMatches={allMatches}
        onScrollToMatch={onScrollToMatch}
        onAddMatch={onAddMatch}
        hiddenMatchesCount={hiddenMatchesCount}
        onShowHiddenMatches={onShowHiddenMatches}
        setViewMode={setViewMode}
        cardContentRef={cardContentRef}
      />
    );
  },
);

MatchesList.displayName = 'MatchesList';

export default MatchesList;

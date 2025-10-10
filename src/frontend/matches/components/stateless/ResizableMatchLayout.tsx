'use client';

import React, { forwardRef, useImperativeHandle } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { Match, Team, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import { MatchDetailsPanel } from '@/frontend/matches/components/details/MatchDetailsPanel';
import MatchesList, { type MatchesListRef } from '@/frontend/matches/components/list/MatchesList';
import type { MatchListViewMode } from '@/frontend/matches/components/list/MatchListView';

interface ResizableMatchLayoutProps {
  teamMatches: Map<number, TeamMatchParticipation>;
  visibleMatches: Match[];
  unhiddenMatches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  selectedMatch: Match | null;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
  selectedTeam: Team;
}

export interface ResizableMatchLayoutRef {
  scrollToMatch: (matchId: number) => void;
}

function MatchListPane({
  matchesListRef,
  visibleMatches,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  setViewMode,
  selectedMatchId,
  onSelectMatch,
  hiddenMatchesCount,
  onShowHiddenMatches,
  teamMatches,
  unhiddenMatches,
  onScrollToMatch,
  onAddMatch,
}: {
  matchesListRef: React.RefObject<MatchesListRef | null>;
  visibleMatches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  teamMatches: Map<number, TeamMatchParticipation>;
  unhiddenMatches: Match[];
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
}) {
  return (
    <ResizablePanel id="match-list" defaultSize={50} minSize={0} maxSize={100} className="overflow-visible">
      <div className="h-fit pt-2 pr-3 @container" style={{ containerType: 'inline-size' }}>
        <MatchesList
          ref={matchesListRef}
          matches={visibleMatches}
          onHideMatch={onHideMatch}
          onRefreshMatch={onRefreshMatch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedMatchId={selectedMatchId}
          onSelectMatch={onSelectMatch}
          hiddenMatchesCount={hiddenMatchesCount}
          onShowHiddenMatches={onShowHiddenMatches}
          teamMatches={teamMatches}
          allMatches={unhiddenMatches}
          onScrollToMatch={onScrollToMatch}
          onAddMatch={onAddMatch}
        />
      </div>
    </ResizablePanel>
  );
}

function MatchDetailsPane({
  selectedMatch,
  teamMatches,
  matchDetailsViewMode,
  setMatchDetailsViewMode,
  unhiddenMatches,
  selectedTeam,
}: {
  selectedMatch: Match | null;
  teamMatches: Map<number, TeamMatchParticipation>;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
  unhiddenMatches: Match[];
  selectedTeam: Team;
}) {
  return (
    <ResizablePanel id="match-details" defaultSize={50} minSize={0} maxSize={100} className="overflow-hidden">
      <div className="h-fit pt-2 pl-3">
        {selectedMatch ? (
          (() => {
            const teamMatchData = teamMatches.get(selectedMatch.id);
            return (
              <MatchDetailsPanel
                match={selectedMatch}
                teamMatch={teamMatchData}
                viewMode={matchDetailsViewMode}
                onViewModeChange={setMatchDetailsViewMode}
                allMatches={unhiddenMatches}
                selectedTeam={selectedTeam}
              />
            );
          })()
        ) : (
          <div className="bg-card rounded-lg shadow-md flex items-center justify-center p-8 text-muted-foreground min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)]">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">No Match Selected</div>
              <div className="text-sm">Select a match from the list to view details</div>
            </div>
          </div>
        )}
      </div>
    </ResizablePanel>
  );
}

export const ResizableMatchLayout = forwardRef<ResizableMatchLayoutRef, ResizableMatchLayoutProps>(
  (
    {
      teamMatches,
      visibleMatches,
      unhiddenMatches,
      onHideMatch,
      onRefreshMatch,
      viewMode,
      setViewMode,
      selectedMatchId,
      onSelectMatch,
      hiddenMatchesCount = 0,
      onShowHiddenMatches,
      selectedMatch,
      matchDetailsViewMode,
      setMatchDetailsViewMode,
      onScrollToMatch,
      onAddMatch,
      selectedTeam,
    },
    ref,
  ) => {
    const matchesListRef = React.useRef<MatchesListRef | null>(null);

    useImperativeHandle(ref, () => ({
      scrollToMatch: (matchId: number) => {
        matchesListRef.current?.scrollToMatch(matchId);
      },
    }));

    return (
      <ResizablePanelGroup direction="horizontal">
        <MatchListPane
          matchesListRef={matchesListRef}
          visibleMatches={visibleMatches}
          onHideMatch={onHideMatch}
          onRefreshMatch={onRefreshMatch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedMatchId={selectedMatchId}
          onSelectMatch={onSelectMatch}
          hiddenMatchesCount={hiddenMatchesCount}
          onShowHiddenMatches={onShowHiddenMatches}
          teamMatches={teamMatches}
          unhiddenMatches={unhiddenMatches}
          onScrollToMatch={onScrollToMatch}
          onAddMatch={onAddMatch}
        />
        <ResizableHandle withHandle />
        <MatchDetailsPane
          selectedMatch={selectedMatch}
          teamMatches={teamMatches}
          matchDetailsViewMode={matchDetailsViewMode}
          setMatchDetailsViewMode={setMatchDetailsViewMode}
          unhiddenMatches={unhiddenMatches}
          selectedTeam={selectedTeam}
        />
      </ResizablePanelGroup>
    );
  },
);

ResizableMatchLayout.displayName = 'ResizableMatchLayout';

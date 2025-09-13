'use client';

import React, { forwardRef, useImperativeHandle } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import { MatchDetailsPanel } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from '@/frontend/matches/components/filters/MatchFilters';
import { MatchFilters } from '@/frontend/matches/components/filters/MatchFilters';
import MatchesList, { type MatchesListRef } from '@/frontend/matches/components/list/MatchesList';
import type { MatchListViewMode } from '@/frontend/matches/components/list/MatchListView';
import type { Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface ResizableMatchLayoutProps {
  filters: MatchFiltersType;
  onFiltersChange: (filters: MatchFiltersType) => void;
  activeTeamMatches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
  visibleMatches: Match[];
  filteredMatches: Match[];
  unhiddenMatches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  hiddenMatchIds?: Set<number>;
  selectedMatch: Match | null;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
}

export interface ResizableMatchLayoutRef {
  scrollToMatch: (matchId: number) => void;
}

function FiltersSection({
  filters,
  onFiltersChange,
  activeTeamMatches,
  teamMatches,
}: {
  filters: MatchFiltersType;
  onFiltersChange: (filters: MatchFiltersType) => void;
  activeTeamMatches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
}) {
  return (
    <div className="flex-shrink-0 pb-2">
      <MatchFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        matches={activeTeamMatches}
        teamMatches={teamMatches}
      />
    </div>
  );
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
  hiddenMatchIds,
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
  teamMatches: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
  unhiddenMatches: Match[];
  onScrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
}) {
  return (
    <ResizablePanel
      id="match-list"
      defaultSize={50}
      minSize={0}
      maxSize={100}
      className="overflow-visible"
    >
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
          hiddenMatchIds={hiddenMatchIds}
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
  hiddenMatchIds,
}: {
  selectedMatch: Match | null;
  teamMatches: Record<number, TeamMatchParticipation>;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
  unhiddenMatches: Match[];
  hiddenMatchIds?: Set<number>;
}) {
  return (
    <ResizablePanel
      id="match-details"
      defaultSize={50}
      minSize={0}
      maxSize={100}
      className="overflow-hidden"
    >
      <div className="h-fit pt-2 pl-3">
        {selectedMatch ? (
          (() => {
            const teamMatchData = teamMatches[selectedMatch.id];
            return (
              <MatchDetailsPanel
                match={selectedMatch}
                teamMatch={teamMatchData}
                viewMode={matchDetailsViewMode}
                onViewModeChange={setMatchDetailsViewMode}
                allMatches={unhiddenMatches}
                teamMatches={teamMatches}
                hiddenMatchIds={hiddenMatchIds}
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

export const ResizableMatchLayout = forwardRef<ResizableMatchLayoutRef, ResizableMatchLayoutProps>(({ 
  filters,
  onFiltersChange,
  activeTeamMatches,
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
  hiddenMatchIds = new Set(),
  selectedMatch,
  matchDetailsViewMode,
  setMatchDetailsViewMode,
  onScrollToMatch,
  onAddMatch,
}, ref) => {
  const matchesListRef = React.useRef<MatchesListRef | null>(null);

  useImperativeHandle(ref, () => ({
    scrollToMatch: (matchId: number) => {
      matchesListRef.current?.scrollToMatch(matchId);
    }
  }));

  return (
    <div className="h-fit flex flex-col">
      <FiltersSection
        filters={filters}
        onFiltersChange={onFiltersChange}
        activeTeamMatches={activeTeamMatches}
        teamMatches={teamMatches}
      />
      <div className="h-fit">
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
            hiddenMatchIds={hiddenMatchIds}
            unhiddenMatches={unhiddenMatches}
            onScrollToMatch={onScrollToMatch}
            onAddMatch={onAddMatch}
          />
          <ResizableHandle withHandle className="after:w-4" />
          <MatchDetailsPane
            selectedMatch={selectedMatch}
            teamMatches={teamMatches}
            matchDetailsViewMode={matchDetailsViewMode}
            setMatchDetailsViewMode={setMatchDetailsViewMode}
            unhiddenMatches={unhiddenMatches}
            hiddenMatchIds={hiddenMatchIds}
          />
        </ResizablePanelGroup>
      </div>
    </div>
  );
});

ResizableMatchLayout.displayName = 'ResizableMatchLayout';



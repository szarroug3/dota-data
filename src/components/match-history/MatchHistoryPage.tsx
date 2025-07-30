'use client';

import React, { Suspense, useCallback, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import { useMatchFilters } from '@/hooks/use-match-filters';
import useViewMode from '@/hooks/useViewMode';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { EmptyState } from './common/EmptyState';
import { type MatchDetailsPanelMode } from './details/MatchDetailsPanel';
import { type MatchFilters as MatchFiltersType } from './filters/MatchFilters';
import { HiddenMatchesModal } from './list/HiddenMatchesModal';
import { MatchListViewMode } from './list/MatchListView';
import { ResizableMatchLayout } from './ResizableMatchLayout';
import { HeroSummaryTable } from './summary/HeroSummaryTable';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useMatchData() {
  const { getSelectedTeam } = useTeamContext();
  const { getMatch } = useMatchContext();

  // Get matches for active team from team context and match context
  const activeTeamMatches = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    if (!selectedTeam) return [];
    
    // Get match IDs from team data
    const matchIds = Object.keys(selectedTeam.matches).map(Number);
    
    // Retrieve full match data for each ID using getMatch
    return matchIds
      .map((id: number) => getMatch(id))
      .filter((match): match is Match => match !== undefined);
  }, [getSelectedTeam, getMatch]);

  return {
    activeTeamMatches
  };
}

function useMatchSelection() {
  const { selectedMatchId, getMatch, setSelectedMatchId } = useMatchContext();

  // Get selected match from context
  const selectedMatch = useMemo(() => {
    return selectedMatchId ? getMatch(selectedMatchId) || null : null;
  }, [selectedMatchId, getMatch]);

  const selectMatch = (matchId: number) => {
    setSelectedMatchId(matchId);
  };

  return {
    selectedMatch,
    selectMatch
  };
}

function useHiddenMatches(filteredMatches: Match[]) {
  const [hiddenMatches, setHiddenMatches] = useState<Match[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  // Hide a match (remove from visible, add to hidden)
  const handleHideMatch = useCallback((id: number) => {
    setHiddenMatches(prev => {
      const matchToHide = filteredMatches.find((m: Match) => m.id === id);
      if (!matchToHide) return prev;
      return [...prev, matchToHide];
    });
  }, [filteredMatches]);

  // Unhide a match (remove from hidden, add back to visible)
  const handleUnhideMatch = useCallback((id: number) => {
    setHiddenMatches(prev => prev.filter((m: Match) => m.id !== id));
  }, []);

  // Filter out hidden matches from the visible list
  const visibleMatches = useMemo(() => {
    const hiddenIds = new Set(hiddenMatches.map((m: Match) => m.id));
    return filteredMatches.filter((m: Match) => !hiddenIds.has(m.id));
  }, [filteredMatches, hiddenMatches]);

  return {
    hiddenMatches,
    showHiddenModal,
    setShowHiddenModal,
    handleHideMatch,
    handleUnhideMatch,
    visibleMatches
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMatchHistoryEmptyState(teamDataList: TeamData[], activeTeam: { teamId: string; leagueId: string } | null) {
  if (!teamDataList || teamDataList.length === 0) {
    return <EmptyState type="no-teams" />;
  }
  if (!activeTeam) {
    return <EmptyState type="no-selection" />;
  }
  return null;
}

// Helper function to render the main content area
function renderMainContent(
  filters: MatchFiltersType,
  setFilters: (filters: MatchFiltersType) => void,
  activeTeamMatches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  visibleMatches: Match[],
  handleHideMatch: (id: number) => void,
  handleRefreshMatch: (id: number) => void,
  viewMode: MatchListViewMode,
  setViewMode: (mode: MatchListViewMode) => void,
  selectedMatch: Match | null,
  selectMatch: (matchId: number) => void,
  hiddenMatches: Match[],
  setShowHiddenModal: (show: boolean) => void,
  matchDetailsViewMode: MatchDetailsPanelMode,
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void
) {
  return (
    <div className="h-full">
      <ResizableMatchLayout
        filters={filters}
        onFiltersChange={setFilters}
        activeTeamMatches={activeTeamMatches}
        teamMatches={teamMatches}
        visibleMatches={visibleMatches}
        onHideMatch={handleHideMatch}
        onRefreshMatch={handleRefreshMatch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMatchId={selectedMatch?.id || null}
        onSelectMatch={selectMatch}
        hiddenMatchesCount={hiddenMatches.length}
        onShowHiddenMatches={() => setShowHiddenModal(true)}
        selectedMatch={selectedMatch}
        matchDetailsViewMode={matchDetailsViewMode}
        setMatchDetailsViewMode={setMatchDetailsViewMode}
      />
    </div>
  );
}

// Helper function to render the hero summary table
function renderHeroSummaryTable(visibleMatches: Match[]) {
  return (
    <div className="p-4">
      <HeroSummaryTable matches={visibleMatches} />
    </div>
  );
}

// Helper function to render the hidden matches modal
function renderHiddenMatchesModal(
  showHiddenModal: boolean,
  hiddenMatches: Match[],
  handleUnhideMatch: (id: number) => void,
  setShowHiddenModal: (show: boolean) => void
) {
  if (!showHiddenModal) return null;
  
  return (
    <HiddenMatchesModal
      hiddenMatches={hiddenMatches}
      onUnhide={handleUnhideMatch}
      onClose={() => setShowHiddenModal(false)}
    />
  );
}

const renderMatchHistoryContent = (
  teamDataList: TeamData[],
  activeTeam: { teamId: string; leagueId: string } | null,
  hiddenMatches: Match[],
  showHiddenModal: boolean,
  setShowHiddenModal: (show: boolean) => void,
  filters: MatchFiltersType,
  setFilters: (filters: MatchFiltersType) => void,
  visibleMatches: Match[],
  activeTeamMatches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  handleHideMatch: (id: number) => void,
  handleUnhideMatch: (id: number) => void,
  viewMode: MatchListViewMode,
  setViewMode: (mode: MatchListViewMode) => void,
  selectedMatch: Match | null,
  selectMatch: (matchId: number) => void,
  matchDetailsViewMode: MatchDetailsPanelMode,
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void,
  handleRefreshMatch: (id: number) => void
) => {
  const emptyState = getMatchHistoryEmptyState(teamDataList, activeTeam);
  if (emptyState) return emptyState;

  return (
    <>
      {renderMainContent(
        filters,
        setFilters,
        activeTeamMatches,
        teamMatches,
        visibleMatches,
        handleHideMatch,
        handleRefreshMatch,
        viewMode,
        setViewMode,
        selectedMatch,
        selectMatch,
        hiddenMatches,
        setShowHiddenModal,
        matchDetailsViewMode,
        setMatchDetailsViewMode
      )}
      
      {renderHeroSummaryTable(visibleMatches)}
      
      {renderHiddenMatchesModal(
        showHiddenModal,
        hiddenMatches,
        handleUnhideMatch,
        setShowHiddenModal
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MatchHistoryPage: React.FC = () => {
  const { getSelectedTeam, getAllTeams } = useTeamContext();
  const { refreshMatch } = useMatchContext();

  // Local state for filters (using MatchFiltersType)
  const [filters, setFilters] = useState<MatchFiltersType>({
    dateRange: 'all',
    customDateRange: {
      start: null,
      end: null
    },
    result: 'all',
    opponent: [],
    teamSide: 'all',
    pickOrder: 'all',
    heroesPlayed: [],
    matchDuration: 'all',
    playerPerformance: []
  });

  // View mode with localStorage persistence (from hook)
  const { viewMode, setViewMode } = useViewMode();

  // State for match details view mode
  const [matchDetailsViewMode, setMatchDetailsViewMode] = useState<MatchDetailsPanelMode>('draft');

  // Get matches for active team from team context and match context
  const { activeTeamMatches } = useMatchData();

  // Get team matches from the selected team
  const teamMatches = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    return selectedTeam?.matches || {};
  }, [getSelectedTeam]);

  // Apply filters using the new hook
  const { filteredMatches } = useMatchFilters(activeTeamMatches, teamMatches, filters);

  // Hide a match (remove from visible, add to hidden)
  const { 
    hiddenMatches, 
    showHiddenModal, 
    setShowHiddenModal, 
    handleHideMatch, 
    handleUnhideMatch, 
    visibleMatches 
  } = useHiddenMatches(filteredMatches);

  // Convert teams map to array for compatibility
  const teamDataList = useMemo(() => {
    return getAllTeams();
  }, [getAllTeams]);

  // Get selected match from context
  const { selectedMatch, selectMatch } = useMatchSelection();

  // Convert selectedTeamId to the expected format for the render function
  const activeTeam = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    if (!selectedTeam) return null;
    return {
      teamId: selectedTeam.team.id.toString(),
      leagueId: selectedTeam.league.id.toString()
    };
  }, [getSelectedTeam]);

  // Refresh a match using the match context
  const handleRefreshMatch = useCallback(async (matchId: number) => {
    try {
      await refreshMatch(matchId);
    } catch (error) {
      console.error(`Failed to refresh match ${matchId}:`, error);
    }
  }, [refreshMatch]);

  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 bg-background text-foreground transition-colors duration-300">
          <div className="h-full flex flex-col">
            <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
              {renderMatchHistoryContent(
                teamDataList,
                activeTeam,
                hiddenMatches,
                showHiddenModal,
                setShowHiddenModal,
                filters,
                setFilters,
                visibleMatches,
                activeTeamMatches,
                teamMatches,
                handleHideMatch,
                handleUnhideMatch,
                viewMode,
                setViewMode,
                selectedMatch,
                selectMatch,
                matchDetailsViewMode,
                setMatchDetailsViewMode,
                handleRefreshMatch
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}; 
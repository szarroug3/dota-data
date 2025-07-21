'use client';

import React, { Suspense, useCallback, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import useViewMode from '@/hooks/useViewMode';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { filterMatches } from '@/utils/match-filter';

import { EmptyState } from './common/EmptyState';
import { ErrorState } from './common/ErrorState';
import { type MatchDetailsPanelMode } from './details/MatchDetailsPanel';
import { type MatchFilters as MatchFiltersType } from './filters/MatchFilters';
import { HiddenMatchesModal } from './list/HiddenMatchesModal';
import { MatchListViewMode } from './list/MatchListView';
import { ResizableMatchLayout } from './ResizableMatchLayout';
import { HeroSummaryTable } from './summary/HeroSummaryTable';

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

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

function getMatchHistoryLoadingState(isCoordinatorLoading: boolean, isLoading: boolean) {
  if (isCoordinatorLoading || isLoading) {
    return <LoadingSkeleton type="text" lines={8} />;
  }
  return null;
}

function getMatchHistoryErrorState(coordinatorError: string | null, matchesError: string | null) {
  if (coordinatorError) {
    return <ErrorState error={coordinatorError} onRetry={() => {}} />;
  }
  if (matchesError) {
    return <ErrorState error={matchesError} onRetry={() => window.location.reload()} />;
  }
  return null;
}

const renderMatchHistoryContent = (
  teamDataList: TeamData[],
  activeTeam: { teamId: string; leagueId: string } | null,
  isCoordinatorLoading: boolean,
  coordinatorError: string | null,
  isLoading: boolean,
  matchesError: string | null,
  hiddenMatches: Match[],
  showHiddenModal: boolean,
  setShowHiddenModal: (show: boolean) => void,
  filters: MatchFiltersType,
  setFilters: (filters: MatchFiltersType) => void,
  visibleMatches: Match[],
  activeTeamMatches: Match[],
  handleHideMatch: (id: string) => void,
  handleUnhideMatch: (id: string) => void,
  viewMode: MatchListViewMode,
  setViewMode: (mode: MatchListViewMode) => void,
  selectedMatch: Match | null,
  selectMatch: (matchId: string) => void,
  matchDetailsViewMode: MatchDetailsPanelMode,
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void,
  handleRefreshMatch: (id: string) => void
) => {
  const emptyState = getMatchHistoryEmptyState(teamDataList, activeTeam);
  if (emptyState) return emptyState;
  const loadingState = getMatchHistoryLoadingState(isCoordinatorLoading, isLoading);
  if (loadingState) return loadingState;
  const errorState = getMatchHistoryErrorState(coordinatorError, matchesError);
  if (errorState) return errorState;

  return (
    <>
      <div className="h-full">
        <ResizableMatchLayout
          filters={filters}
          onFiltersChange={setFilters}
          activeTeamMatches={activeTeamMatches}
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
      
      {/* Hero Summary Table - Bottom of page */}
      <div className="p-4">
        <HeroSummaryTable matches={visibleMatches} />
      </div>
      
      {showHiddenModal && (
        <HiddenMatchesModal
          hiddenMatches={hiddenMatches}
          onUnhide={handleUnhideMatch}
          onClose={() => setShowHiddenModal(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MatchHistoryPage: React.FC = () => {
  // Use data coordinator for orchestrated data fetching
  const { operationState, errorState } = useDataCoordinator();
  const isCoordinatorLoading = operationState.isInProgress;
  const coordinatorError = errorState.errorMessage;
  const { teamDataList, activeTeam, getTeamMatchesForLeague } = useTeamContext();
  const { 
    isLoading, 
    error: matchesError,
    selectedMatch,
    selectMatch
  } = useMatchContext();

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
    heroesPlayed: []
  });

  // Local state for hidden matches and modal
  const [hiddenMatches, setHiddenMatches] = useState<Match[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  // View mode with localStorage persistence (from hook)
  const { viewMode, setViewMode } = useViewMode();

  // State for match details view mode
  const [matchDetailsViewMode, setMatchDetailsViewMode] = useState<MatchDetailsPanelMode>('draft-events');

  // Refresh a match (stub for now)
  const handleRefreshMatch = (id: string) => {
    // TODO: Implement actual refresh logic
    console.log('Refreshing match', id);
  };

  // Get matches for active team from team context
  const activeTeamMatches = useMemo(() => {
    if (!activeTeam) return [];
    return getTeamMatchesForLeague(activeTeam.teamId, activeTeam.leagueId);
  }, [activeTeam, getTeamMatchesForLeague]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    return filterMatches(activeTeamMatches, filters);
  }, [activeTeamMatches, filters]);

  // Hide a match (remove from visible, add to hidden)
  const handleHideMatch = useCallback((id: string) => {
    setHiddenMatches(prev => {
      const matchToHide = filteredMatches.find(m => m.id === id);
      if (!matchToHide) return prev;
      return [...prev, matchToHide];
    });
  }, [filteredMatches]);

  // Unhide a match (remove from hidden, add back to visible)
  const handleUnhideMatch = useCallback((id: string) => {
    setHiddenMatches(prev => prev.filter(m => m.id !== id));
  }, []);

  // Filter out hidden matches from the visible list
  const visibleMatches = useMemo(() => {
    const hiddenIds = new Set(hiddenMatches.map(m => m.id));
    return filteredMatches.filter(m => !hiddenIds.has(m.id));
  }, [filteredMatches, hiddenMatches]);

  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 bg-background text-foreground transition-colors duration-300">
          <div className="h-full flex flex-col">
            <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
              {renderMatchHistoryContent(
                teamDataList,
                activeTeam,
                isCoordinatorLoading,
                coordinatorError,
                isLoading,
                matchesError,
                hiddenMatches,
                showHiddenModal,
                setShowHiddenModal,
                filters,
                setFilters,
                visibleMatches,
                activeTeamMatches,
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
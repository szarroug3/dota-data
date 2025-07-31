'use client';

import React, { Suspense, useCallback, useMemo, useState } from 'react';

import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import { useMatchFilters } from '@/hooks/use-match-filters';
import useViewMode from '@/hooks/useViewMode';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';

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
  if (teamDataList.length === 0) {
    return <div className="p-4 text-center">No teams available</div>;
  }
  if (!activeTeam) {
    return <div className="p-4 text-center">Please select a team</div>;
  }
  return null;
}

// Helper function to render the hero summary table
function renderHeroSummaryTable(visibleMatches: Match[], teamMatches: Record<number, TeamMatchParticipation>, allMatches: Match[]) {
  return (
    <HeroSummaryTable matches={visibleMatches} teamMatches={teamMatches} allMatches={allMatches} />
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
      
      {renderHeroSummaryTable(visibleMatches, teamMatches)}
      
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
    highPerformersOnly: false
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

  // Apply filters using the new hook (without high performers filter for hidden matches calculation)
  const { filteredMatches } = useMatchFilters(activeTeamMatches, teamMatches, filters, new Set());

  // Hide a match (remove from visible, add to hidden)
  const { 
    hiddenMatches, 
    showHiddenModal, 
    setShowHiddenModal, 
    handleHideMatch, 
    handleUnhideMatch, 
    visibleMatches 
  } = useHiddenMatches(filteredMatches);

  // Apply filters again with hidden matches excluded for high performers calculation
  const { filteredMatches: finalFilteredMatches } = useMatchFilters(activeTeamMatches, teamMatches, filters, new Set(hiddenMatches.map(m => m.id)));

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

  // Refresh match function
  const handleRefreshMatch = useCallback((id: number) => {
    refreshMatch(id);
  }, [refreshMatch]);

  return (
    <div className="h-full">
      <Suspense fallback={<div>Loading...</div>}>
        {renderMatchHistoryContent(
          teamDataList,
          activeTeam,
          hiddenMatches,
          showHiddenModal,
          setShowHiddenModal,
          filters,
          setFilters,
          finalFilteredMatches,
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
  );
}; 
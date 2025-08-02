'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { AddMatchForm } from '@/components/match-history/AddMatchForm';
import { useConfigContext } from '@/contexts/config-context';
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
import { ResizableMatchLayout, type ResizableMatchLayoutRef } from './ResizableMatchLayout';
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

function useAddMatchForm() {
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  return {
    showAddMatchForm,
    setShowAddMatchForm,
    matchId,
    setMatchId,
    teamSide,
    setTeamSide,
    isSubmitting,
    setIsSubmitting,
    error,
    setError
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
  setShowHiddenModal: (show: boolean) => void,
  teamMatches: Record<number, TeamMatchParticipation>
) {
  if (!showHiddenModal) return null;
  
  return (
    <HiddenMatchesModal
      hiddenMatches={hiddenMatches}
      onUnhide={handleUnhideMatch}
      onClose={() => setShowHiddenModal(false)}
      teamMatches={teamMatches}
    />
  );
}

// Helper function to render the add match form
function renderAddMatchForm(
  showAddMatchForm: boolean,
  matchId: string,
  teamSide: 'radiant' | 'dire' | '',
  setMatchId: (value: string) => void,
  setTeamSide: (value: 'radiant' | 'dire' | '') => void,
  handleAddMatch: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>,
  matchExists: (matchId: string) => boolean,
  isSubmitting: boolean,
  setShowAddMatchForm: (show: boolean) => void,
  error?: string
) {
  return (
    <AddMatchForm
      isOpen={showAddMatchForm}
      onClose={() => setShowAddMatchForm(false)}
      matchId={matchId}
      teamSide={teamSide}
      onMatchIdChange={setMatchId}
      onTeamSideChange={setTeamSide}
      onAddMatch={handleAddMatch}
      matchExists={matchExists}
      isSubmitting={isSubmitting}
      error={error}
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
  filteredMatches: Match[],
  unhiddenMatches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  handleHideMatch: (id: number) => void,
  handleUnhideMatch: (id: number) => void,
  viewMode: MatchListViewMode,
  setViewMode: (mode: MatchListViewMode) => void,
  selectedMatch: Match | null,
  selectMatch: (matchId: number) => void,
  matchDetailsViewMode: MatchDetailsPanelMode,
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void,
  handleRefreshMatch: (id: number) => void,
  showAddMatchForm: boolean,
  setShowAddMatchForm: (show: boolean) => void,
  matchId: string,
  teamSide: 'radiant' | 'dire' | '',
  setMatchId: (value: string) => void,
  setTeamSide: (value: 'radiant' | 'dire' | '') => void,
  handleAddMatch: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>,
  matchExists: (matchId: string) => boolean,
  isSubmitting: boolean,
  error?: string,
  resizableLayoutRef?: React.RefObject<ResizableMatchLayoutRef | null>,
  scrollToMatch?: (matchId: number) => void,
  onAddMatch?: () => void
) => {
  const emptyState = getMatchHistoryEmptyState(teamDataList, activeTeam);
  if (emptyState) return emptyState;

  return (
    <div className="flex flex-col gap-6">
      {/* Add Match Form */}
      {renderAddMatchForm(
        showAddMatchForm,
        matchId,
        teamSide,
        setMatchId,
        setTeamSide,
        handleAddMatch,
        matchExists,
        isSubmitting,
        setShowAddMatchForm,
        error
      )}

      <ResizableMatchLayout
        ref={resizableLayoutRef}
        filters={filters}
        onFiltersChange={setFilters}
        activeTeamMatches={activeTeamMatches}
        teamMatches={teamMatches}
        visibleMatches={visibleMatches}
        filteredMatches={filteredMatches}
        unhiddenMatches={unhiddenMatches}
        onHideMatch={handleHideMatch}
        onRefreshMatch={handleRefreshMatch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMatchId={selectedMatch?.id || null}
        onSelectMatch={selectMatch}
        hiddenMatchesCount={hiddenMatches.length}
        onShowHiddenMatches={() => setShowHiddenModal(true)}
        hiddenMatchIds={new Set(hiddenMatches.map(m => m.id))}
        selectedMatch={selectedMatch}
        matchDetailsViewMode={matchDetailsViewMode}
        setMatchDetailsViewMode={setMatchDetailsViewMode}
        onScrollToMatch={scrollToMatch || (() => {})}
        onAddMatch={onAddMatch || (() => {})}
      />
      
      {renderHeroSummaryTable(visibleMatches, teamMatches, unhiddenMatches)}
      
      {renderHiddenMatchesModal(
        showHiddenModal,
        hiddenMatches,
        handleUnhideMatch,
        setShowHiddenModal,
        teamMatches
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MatchHistoryPage: React.FC = () => {
  const { getAllTeams, addMatchToTeam, teams, selectedTeamId } = useTeamContext();
  const { refreshMatch, addMatch } = useMatchContext();
  const { setTeams } = useConfigContext();
  const resizableLayoutRef = React.useRef<ResizableMatchLayoutRef>(null);

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
    if (!selectedTeamId) return {};
    const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
    const selectedTeam = teams.get(teamKey);
    return selectedTeam?.matches || {};
  }, [teams, selectedTeamId]);

  // Add match form state
  const {
    showAddMatchForm,
    setShowAddMatchForm,
    matchId,
    setMatchId,
    teamSide,
    setTeamSide,
    isSubmitting,
    setIsSubmitting,
    error,
    setError
  } = useAddMatchForm();

  // Apply filters to active team matches
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

  // Create unhidden matches (all matches minus manually hidden ones) for hero performance calculation
  const unhiddenMatches = useMemo(() => {
    const hiddenIds = new Set(hiddenMatches.map(m => m.id));
    return activeTeamMatches.filter(match => !hiddenIds.has(match.id));
  }, [activeTeamMatches, hiddenMatches]);

  // Convert teams map to array for compatibility
  const teamDataList = useMemo(() => {
    return getAllTeams();
  }, [getAllTeams]);

  // Get selected match from context
  const { selectedMatch, selectMatch } = useMatchSelection();

  // Convert selectedTeamId to the expected format for the render function
  const activeTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    return {
      teamId: selectedTeamId.teamId.toString(),
      leagueId: selectedTeamId.leagueId.toString()
    };
  }, [selectedTeamId]);

  // Refresh match function
  const handleRefreshMatch = useCallback((id: number) => {
    refreshMatch(id);
  }, [refreshMatch]);

  // Check if match already exists
  const matchExists = useCallback((matchId: string) => {
    if (!selectedTeamId) return false;
    
    const matchIdNum = parseInt(matchId, 10);
    if (isNaN(matchIdNum)) return false;
    
    const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
    const selectedTeam = teams.get(teamKey);
    if (!selectedTeam) return false;
    
    return matchIdNum in selectedTeam.matches;
  }, [teams, selectedTeamId]);

  // Track scheduled scrolls to prevent multiple timeouts
  const scheduledScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to match function
  const scrollToMatch = useCallback((matchId: number) => {
    // Clear any existing timeout
    if (scheduledScrollRef.current) {
      clearTimeout(scheduledScrollRef.current);
    }
    
    // Schedule new scroll
    scheduledScrollRef.current = setTimeout(() => {
      resizableLayoutRef.current?.scrollToMatch(matchId);
      scheduledScrollRef.current = null;
    }, 100);
  }, [resizableLayoutRef]);

  // Handle adding a match
  const handleAddMatch = useCallback(async (matchId: string, teamSide: 'radiant' | 'dire') => {
    const matchIdNum = parseInt(matchId, 10);
    if (isNaN(matchIdNum)) return;

    // Close the modal immediately and set submitting state
    setShowAddMatchForm(false);
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      // Add the match to the match context
      await addMatch(matchIdNum);
      
      // Add the match to the team
      await addMatchToTeam(matchIdNum, teamSide);
      
      // Persist manual match to storage using config context
      if (selectedTeamId) {
        const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
        const currentTeams = teams;
        const team = currentTeams.get(teamKey);
        
        if (team) {
          // Update the team's manual matches
          if (!team.manualMatches) {
            team.manualMatches = {};
          }
          team.manualMatches[matchIdNum] = { side: teamSide };
          
          // Update teams in context and persist to storage
          const updatedTeams = new Map(currentTeams);
          updatedTeams.set(teamKey, team);
          setTeams(updatedTeams);
        }
      }
      
      // Automatically select the newly added match
      selectMatch(matchIdNum);
      
      // Scroll to the newly added match
      scrollToMatch(matchIdNum);
      
      // The match context will handle updating the optimistic match with real data
      // and any errors will be displayed in the match list UI
    } catch (error) {
      // If there's an error, we could potentially reopen the modal or show a toast
      console.error('Failed to add match:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [addMatch, setShowAddMatchForm, setIsSubmitting, setError, setTeams, selectedTeamId, teams, addMatchToTeam, selectMatch, scrollToMatch]);

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
          visibleMatches,
          activeTeamMatches,
          filteredMatches,
          unhiddenMatches,
          teamMatches,
          handleHideMatch,
          handleUnhideMatch,
          viewMode,
          setViewMode,
          selectedMatch,
          selectMatch,
          matchDetailsViewMode,
          setMatchDetailsViewMode,
          handleRefreshMatch,
          showAddMatchForm,
          setShowAddMatchForm,
          matchId,
          teamSide,
          setMatchId,
          setTeamSide,
          handleAddMatch,
          matchExists,
          isSubmitting,
          error,
          resizableLayoutRef,
          scrollToMatch,
          () => setShowAddMatchForm(true)
        )}
      </Suspense>
    </div>
  );
}; 
'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { useAppData, useAppDataContext } from '@/contexts/app-data-context';
import type { MatchFilters, Team } from '@/frontend/lib/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import { MatchHistoryPageView } from '@/frontend/matches/components/stateless/MatchHistoryPage';
import type { ResizableMatchLayoutRef } from '@/frontend/matches/components/stateless/ResizableMatchLayout';
import { useMatchFilters } from '@/hooks/use-match-filters';
import useViewMode from '@/hooks/useViewMode';

const EMPTY_HIGH_PERFORMERS = new Set<string>();

function useMatchHistoryState() {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [matchDetailsViewMode, setMatchDetailsViewMode] = useState<MatchDetailsPanelMode>('draft');

  const [filters, setFilters] = useState<MatchFilters>({
    dateRange: 'all',
    customDateRange: { start: null, end: null },
    result: 'all',
    opponent: [],
    teamSide: 'all',
    pickOrder: 'all',
    heroesPlayed: [],
    highPerformersOnly: false,
  });

  return {
    selectedMatchId,
    setSelectedMatchId,
    showHiddenModal,
    setShowHiddenModal,
    showAddMatchForm,
    setShowAddMatchForm,
    matchId,
    setMatchId,
    teamSide,
    setTeamSide,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    matchDetailsViewMode,
    setMatchDetailsViewMode,
    filters,
    setFilters,
  };
}

function useMatchHistoryActions(
  appData: ReturnType<typeof useAppData>,
  selectedTeamId: string,
  state: ReturnType<typeof useMatchHistoryState>,
  resizableLayoutRef: React.RefObject<ResizableMatchLayoutRef | null>,
) {
  const handleHideMatch = useCallback(
    (matchId: number) => {
      appData.hideMatchOnTeam(matchId, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  const handleUnhideMatch = useCallback(
    (matchId: number) => {
      appData.unhideMatchOnTeam(matchId, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  const handleRefreshMatch = useCallback(
    async (id: number) => {
      await appData.refreshMatch(id);
    },
    [appData],
  );

  const selectMatch = useCallback(
    (id: number) => {
      state.setSelectedMatchId(id);
    },
    [state],
  );

  const scrollToMatch = useCallback(
    (matchId: number) => {
      setTimeout(() => {
        resizableLayoutRef.current?.scrollToMatch(matchId);
      }, 100);
    },
    [resizableLayoutRef],
  );

  const handleAddMatch = useCallback(
    async (matchIdInput: string, teamSideInput: 'radiant' | 'dire' | '') => {
      const matchIdNum = parseInt(matchIdInput, 10);
      if (isNaN(matchIdNum)) return;

      state.setShowAddMatchForm(false);
      state.setIsSubmitting(true);
      state.setError(undefined);

      try {
        if (teamSideInput !== 'radiant' && teamSideInput !== 'dire') {
          throw new Error('Invalid team side - form validation failed');
        }

        // Scroll immediately when the match will be added to the list
        selectMatch(matchIdNum);
        scrollToMatch(matchIdNum);

        await appData.addManualMatchToTeam(matchIdNum, selectedTeamId, teamSideInput);
      } catch (error) {
        console.error('Failed to add match:', error);
        state.setError(error instanceof Error ? error.message : 'Failed to add match');
      } finally {
        state.setIsSubmitting(false);
      }
    },
    [appData, selectedTeamId, selectMatch, scrollToMatch, state],
  );

  const matchExists = useCallback(
    (mid: string) => {
      const matchIdNum = parseInt(mid, 10);
      if (isNaN(matchIdNum)) return false;
      return appData.teamHasMatch(matchIdNum, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  const onAddMatch = useCallback(() => {
    state.setShowAddMatchForm(true);
  }, [state]);

  return {
    handleHideMatch,
    handleUnhideMatch,
    handleRefreshMatch,
    selectMatch,
    scrollToMatch,
    handleAddMatch,
    matchExists,
    onAddMatch,
  };
}

function useMatchHistoryDataSelectors(
  appData: ReturnType<typeof useAppData>,
  selectedTeamId: string,
  selectedTeam: Team | undefined,
  filters: MatchFilters,
) {
  const teamMatches = useMemo(() => {
    if (!selectedTeam) return new Map();
    return appData.getTeamMatchesMetadata(selectedTeamId);
  }, [appData, selectedTeamId, selectedTeam]);

  const { filteredMatches } = useMatchFilters(filters);

  const hiddenMatches = useMemo(() => {
    if (!selectedTeam) return [];
    return appData.getTeamHiddenMatchesForDisplay(selectedTeamId);
  }, [appData, selectedTeamId, selectedTeam]);

  const visibleMatches = filteredMatches;
  const unhiddenMatches = filteredMatches;

  return {
    teamMatches,
    hiddenMatches,
    visibleMatches,
    unhiddenMatches,
  };
}

export function MatchHistoryPageContainer(): React.ReactElement {
  const appData = useAppData();
  const { matches, teams } = useAppDataContext();
  const selectedTeamId = appData.state.selectedTeamId;

  if (!selectedTeamId) {
    throw new Error('No selected team ID');
  }

  const selectedTeam = teams.get(selectedTeamId);
  if (!selectedTeam) {
    throw new Error('No selected team found');
  }

  const resizableLayoutRef = useRef<ResizableMatchLayoutRef>(null);
  const { viewMode, setViewMode } = useViewMode();

  const state = useMatchHistoryState();
  const actions = useMatchHistoryActions(appData, selectedTeamId, state, resizableLayoutRef);

  // Data selectors
  const { teamMatches, hiddenMatches, visibleMatches, unhiddenMatches } = useMatchHistoryDataSelectors(
    appData,
    selectedTeamId,
    selectedTeam,
    state.filters,
  );

  const heroSummary = useMemo(
    () => appData.getTeamHeroSummaryForMatches(selectedTeamId, visibleMatches),
    [appData, selectedTeamId, visibleMatches],
  );

  const selectedMatch = useMemo(
    () => (state.selectedMatchId ? matches.get(state.selectedMatchId) || null : null),
    [state.selectedMatchId, matches],
  );

  const highPerformingHeroes = selectedTeam?.highPerformingHeroes ?? EMPTY_HIGH_PERFORMERS;

  const viewProps = useMemo(
    () => ({
      hiddenMatches,
      showHiddenModal: state.showHiddenModal,
      setShowHiddenModal: state.setShowHiddenModal,
      visibleMatches,
      unhiddenMatches,
      teamMatches,
      heroSummary,
      highPerformingHeroes,
      handleHideMatch: actions.handleHideMatch,
      handleUnhideMatch: actions.handleUnhideMatch,
      viewMode,
      setViewMode,
      selectedMatch,
      selectMatch: actions.selectMatch,
      matchDetailsViewMode: state.matchDetailsViewMode,
      setMatchDetailsViewMode: state.setMatchDetailsViewMode,
      handleRefreshMatch: actions.handleRefreshMatch,
      showAddMatchForm: state.showAddMatchForm,
      setShowAddMatchForm: state.setShowAddMatchForm,
      matchId: state.matchId,
      teamSide: state.teamSide,
      setMatchId: state.setMatchId,
      setTeamSide: state.setTeamSide,
      handleAddMatch: actions.handleAddMatch,
      matchExists: actions.matchExists,
      isSubmitting: state.isSubmitting,
      error: state.error,
      resizableLayoutRef,
      scrollToMatch: actions.scrollToMatch,
      onAddMatch: actions.onAddMatch,
      selectedTeam,
    }),
    [
      hiddenMatches,
      state,
      visibleMatches,
      unhiddenMatches,
      teamMatches,
      heroSummary,
      highPerformingHeroes,
      actions,
      viewMode,
      setViewMode,
      selectedMatch,
      resizableLayoutRef,
      selectedTeam,
    ],
  );

  return (
    <div className="h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <MatchHistoryPageView {...viewProps} />
      </Suspense>
    </div>
  );
}

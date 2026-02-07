'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import type { MatchFilters as MatchFiltersType } from '@/frontend/lib/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import { useAppData } from '@/hooks/use-app-data';
import useViewMode from '@/hooks/useViewMode';

import { MatchHistoryContent, type MatchHistoryContentProps } from './MatchHistoryPageSections';
import { type ResizableMatchLayoutRef } from './ResizableMatchLayout';

function useMatchScroll(resizableLayoutRef: React.RefObject<ResizableMatchLayoutRef | null>) {
  const scheduledScrollRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (matchId: number) => {
      if (scheduledScrollRef.current) clearTimeout(scheduledScrollRef.current);
      scheduledScrollRef.current = setTimeout(() => {
        resizableLayoutRef.current?.scrollToMatch(matchId);
        scheduledScrollRef.current = null;
      }, 100);
    },
    [resizableLayoutRef],
  );
}

function useMatchHistoryActions({
  appData,
  selectedTeamId,
  selectMatch,
  scrollToMatch,
  setShowAddMatchForm,
  setIsSubmitting,
  setError,
}: {
  appData: ReturnType<typeof useAppData>;
  selectedTeamId: string;
  selectMatch: (matchId: number) => void;
  scrollToMatch: (matchId: number) => void;
  setShowAddMatchForm: (show: boolean) => void;
  setIsSubmitting: (value: boolean) => void;
  setError: (value: string | undefined) => void;
}) {
  const handleAddMatch = useCallback(
    async (matchIdValue: string, teamSideValue: 'radiant' | 'dire' | '') => {
      const matchIdNum = parseInt(matchIdValue, 10);
      if (isNaN(matchIdNum)) return;
      setShowAddMatchForm(false);
      setIsSubmitting(true);
      setError(undefined);
      try {
        if (teamSideValue !== 'radiant' && teamSideValue !== 'dire') {
          throw new Error('Invalid team side - form validation failed');
        }

        await appData.addManualMatchToTeam(matchIdNum, selectedTeamId, teamSideValue);

        selectMatch(matchIdNum);
        scrollToMatch(matchIdNum);
      } catch (error) {
        console.error('Failed to add match:', error);
        setError(error instanceof Error ? error.message : 'Failed to add match');
      } finally {
        setIsSubmitting(false);
      }
    },
    [appData, selectedTeamId, selectMatch, scrollToMatch, setShowAddMatchForm, setIsSubmitting, setError],
  );

  const handleRefreshMatch = useCallback(
    async (id: number) => {
      await appData.refreshMatch(id);
    },
    [appData],
  );

  const matchExists = useCallback(
    (mid: string) => {
      const matchIdNum = parseInt(mid, 10);
      if (isNaN(matchIdNum)) return false;
      return appData.teamHasMatch(matchIdNum, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  return { handleAddMatch, handleRefreshMatch, matchExists };
}

function useMatchHistoryPageState() {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const resizableLayoutRef = React.useRef<ResizableMatchLayoutRef>(null);
  const [filters, setFilters] = useState<MatchFiltersType>({
    dateRange: 'all',
    customDateRange: { start: null, end: null },
    result: 'all',
    opponent: [],
    teamSide: 'all',
    pickOrder: 'all',
    heroesPlayed: [],
    highPerformersOnly: false,
  });
  const { viewMode, setViewMode } = useViewMode();
  const [matchDetailsViewMode, setMatchDetailsViewMode] = useState<MatchDetailsPanelMode>('draft');
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  return {
    selectedMatchId,
    setSelectedMatchId,
    resizableLayoutRef,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    matchDetailsViewMode,
    setMatchDetailsViewMode,
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
  };
}

function MatchHistoryPageContent(props: MatchHistoryContentProps) {
  return (
    <div className="h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <MatchHistoryContent {...props} />
      </Suspense>
    </div>
  );
}

function useHiddenMatches(appData: ReturnType<typeof useAppData>, selectedTeamId: string) {
  const hiddenMatches = useMemo(() => {
    return appData.getHiddenMatches(selectedTeamId);
    // Dependencies:
    // - appData: access to methods
    // - appData.teams: re-run when hidden metadata changes
    // - appData.matches: re-run when match data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, appData.teams, appData.matches, selectedTeamId]);

  const hiddenMatchIds = useMemo(() => new Set(hiddenMatches.map((match) => match.id)), [hiddenMatches]);

  return { hiddenMatches, hiddenMatchIds };
}

function useHighPerformingHeroes(
  appData: ReturnType<typeof useAppData>,
  selectedTeamId: string,
  hiddenMatchIds: Set<number>,
) {
  return useMemo(() => {
    if (!selectedTeamId) return new Set<string>();
    return appData.getHighPerformingHeroIdsForTeam(selectedTeamId, hiddenMatchIds);
    // Dependencies:
    // - appData: access to methods
    // - selectedTeamId: re-run when team changes
    // - hiddenMatchIds: re-run when hidden matches change
    // - appData.teams: re-run when team participation data changes
    // - appData.matches: re-run when match data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, selectedTeamId, hiddenMatchIds, appData.teams, appData.matches]);
}

export function MatchHistoryPageContainer(): React.ReactElement {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

  const {
    selectedMatchId,
    setSelectedMatchId,
    resizableLayoutRef,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    matchDetailsViewMode,
    setMatchDetailsViewMode,
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
  } = useMatchHistoryPageState();

  const { hiddenMatches, hiddenMatchIds } = useHiddenMatches(appData, selectedTeamId);
  const highPerformingHeroes = useHighPerformingHeroes(appData, selectedTeamId, hiddenMatchIds);

  const matchHistoryData = useMemo(() => {
    return appData.getMatchHistoryData(selectedTeamId, filters, hiddenMatchIds, selectedMatchId);
    // Dependencies:
    // - appData: access to methods
    // - selectedTeamId: re-run when team changes
    // - filters: re-run when filters change
    // - hiddenMatchIds: re-run when hidden matches change
    // - selectedMatchId: re-run when selection changes
    // - appData.teams: re-run when team participation data changes
    // - appData.matches: re-run when match data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, selectedTeamId, filters, hiddenMatchIds, selectedMatchId, appData.teams, appData.matches]);

  const { activeTeamMatches, teamMatches, filteredMatches, visibleMatches, unhiddenMatches, selectedMatch } =
    matchHistoryData;

  const selectMatch = useCallback(
    (id: number) => {
      setSelectedMatchId(id);
    },
    [setSelectedMatchId],
  );

  const scrollToMatch = useMatchScroll(resizableLayoutRef);

  const { handleAddMatch, handleRefreshMatch, matchExists } = useMatchHistoryActions({
    appData,
    selectedTeamId,
    selectMatch,
    scrollToMatch,
    setShowAddMatchForm,
    setIsSubmitting,
    setError,
  });

  const handleHideMatch = useCallback(
    (id: number) => {
      appData.hideMatch(selectedTeamId, id);
    },
    [appData, selectedTeamId],
  );

  const handleUnhideMatch = useCallback(
    (id: number) => {
      appData.unhideMatch(selectedTeamId, id);
    },
    [appData, selectedTeamId],
  );

  return (
    <MatchHistoryPageContent
      hiddenMatches={hiddenMatches}
      showHiddenModal={showHiddenModal}
      setShowHiddenModal={setShowHiddenModal}
      filters={filters}
      setFilters={setFilters}
      visibleMatches={visibleMatches}
      activeTeamMatches={activeTeamMatches}
      filteredMatches={filteredMatches}
      unhiddenMatches={unhiddenMatches}
      highPerformingHeroes={highPerformingHeroes}
      teamMatches={teamMatches}
      selectedTeamId={selectedTeamId ?? ''}
      handleHideMatch={handleHideMatch}
      handleUnhideMatch={handleUnhideMatch}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedMatch={selectedMatch}
      selectMatch={selectMatch}
      matchDetailsViewMode={matchDetailsViewMode}
      setMatchDetailsViewMode={setMatchDetailsViewMode}
      handleRefreshMatch={handleRefreshMatch}
      showAddMatchForm={showAddMatchForm}
      setShowAddMatchForm={setShowAddMatchForm}
      matchId={matchId}
      teamSide={teamSide}
      setMatchId={setMatchId}
      setTeamSide={setTeamSide}
      handleAddMatch={handleAddMatch}
      matchExists={matchExists}
      isSubmitting={isSubmitting}
      error={error}
      resizableLayoutRef={resizableLayoutRef}
      scrollToMatch={scrollToMatch}
      onAddMatch={() => setShowAddMatchForm(true)}
    />
  );
}

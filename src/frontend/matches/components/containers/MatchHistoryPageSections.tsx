'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { createPlaceholderMatch } from '@/frontend/lib/app-data-match-placeholder';
import type { Match, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from '@/frontend/matches/components/filters/MatchFilters';
import { useAppData } from '@/hooks/use-app-data';
import { useMatchFilters } from '@/hooks/use-match-filters';
import useViewMode, { type MatchListViewMode } from '@/hooks/useViewMode';

import { AddMatchFormSection, HeroSummarySection, HiddenMatchesModalSection } from './MatchHistorySectionsHelpers';
import { ResizableMatchLayout, type ResizableMatchLayoutRef } from './ResizableMatchLayout';

export type MatchHistoryContentProps = {
  hiddenMatches: Match[];
  showHiddenModal: boolean;
  setShowHiddenModal: (show: boolean) => void;
  filters: MatchFiltersType;
  setFilters: (filters: MatchFiltersType) => void;
  visibleMatches: Match[];
  activeTeamMatches: Match[];
  filteredMatches: Match[];
  unhiddenMatches: Match[];
  teamMatches: Map<number, TeamMatchParticipation>;
  handleHideMatch: (id: number) => void;
  handleUnhideMatch: (id: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatch: Match | null;
  selectMatch: (matchId: number) => void;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
  handleRefreshMatch: (id: number) => void;
  showAddMatchForm: boolean;
  setShowAddMatchForm: (show: boolean) => void;
  matchId: string;
  teamSide: 'radiant' | 'dire' | '';
  setMatchId: (value: string) => void;
  setTeamSide: (value: 'radiant' | 'dire' | '') => void;
  handleAddMatch: (matchId: string, teamSide: 'radiant' | 'dire' | '') => Promise<void>;
  matchExists: (matchId: string) => boolean;
  isSubmitting: boolean;
  error?: string;
  resizableLayoutRef?: React.RefObject<ResizableMatchLayoutRef | null>;
  scrollToMatch?: (matchId: number) => void;
  onAddMatch?: () => void;
};

export function MatchListSection({
  filters,
  setFilters,
  activeTeamMatches,
  teamMatches,
  visibleMatches,
  filteredMatches,
  unhiddenMatches,
  handleHideMatch,
  handleRefreshMatch,
  viewMode,
  setViewMode,
  selectedMatch,
  selectMatch,
  hiddenMatches,
  setShowHiddenModal,
  resizableLayoutRef,
  scrollToMatch,
  onAddMatch,
  matchDetailsViewMode,
  setMatchDetailsViewMode,
}: Pick<
  MatchHistoryContentProps,
  | 'filters'
  | 'setFilters'
  | 'activeTeamMatches'
  | 'teamMatches'
  | 'visibleMatches'
  | 'filteredMatches'
  | 'unhiddenMatches'
  | 'handleHideMatch'
  | 'handleRefreshMatch'
  | 'viewMode'
  | 'setViewMode'
  | 'selectedMatch'
  | 'selectMatch'
  | 'resizableLayoutRef'
  | 'scrollToMatch'
  | 'onAddMatch'
  | 'matchDetailsViewMode'
  | 'setMatchDetailsViewMode'
> & { hiddenMatches: Match[]; setShowHiddenModal: (show: boolean) => void }) {
  return (
    <ResizableMatchLayout
      ref={resizableLayoutRef as React.RefObject<ResizableMatchLayoutRef>}
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
      hiddenMatchIds={new Set(hiddenMatches.map((m) => m.id))}
      selectedMatch={selectedMatch}
      matchDetailsViewMode={matchDetailsViewMode}
      setMatchDetailsViewMode={setMatchDetailsViewMode}
      onScrollToMatch={scrollToMatch || (() => {})}
      onAddMatch={onAddMatch || (() => {})}
    />
  );
}

export function SummaryAndHiddenSection({
  visibleMatches,
  teamMatches,
  unhiddenMatches,
  showHiddenModal,
  hiddenMatches,
  handleUnhideMatch,
  setShowHiddenModal,
}: Pick<
  MatchHistoryContentProps,
  'visibleMatches' | 'teamMatches' | 'unhiddenMatches' | 'showHiddenModal' | 'handleUnhideMatch' | 'setShowHiddenModal'
> & { hiddenMatches: Match[] }) {
  return (
    <>
      <HeroSummarySection visibleMatches={visibleMatches} teamMatches={teamMatches} allMatches={unhiddenMatches} />
      <HiddenMatchesModalSection
        showHiddenModal={showHiddenModal}
        hiddenMatches={hiddenMatches}
        handleUnhideMatch={handleUnhideMatch}
        setShowHiddenModal={setShowHiddenModal}
        teamMatches={teamMatches}
      />
    </>
  );
}

export function MatchHistoryContent(props: MatchHistoryContentProps) {
  const {
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
    onAddMatch,
  } = props;

  return (
    <div className="flex flex-col gap-6">
      <AddMatchFormSection
        showAddMatchForm={showAddMatchForm}
        matchId={matchId}
        teamSide={teamSide}
        setMatchId={setMatchId}
        setTeamSide={setTeamSide}
        handleAddMatch={handleAddMatch}
        matchExists={matchExists}
        isSubmitting={isSubmitting}
        setShowAddMatchForm={setShowAddMatchForm}
        error={error}
      />

      <MatchListSection
        filters={filters}
        setFilters={setFilters}
        activeTeamMatches={activeTeamMatches}
        teamMatches={teamMatches}
        visibleMatches={visibleMatches}
        filteredMatches={filteredMatches}
        unhiddenMatches={unhiddenMatches}
        handleHideMatch={handleHideMatch}
        handleRefreshMatch={handleRefreshMatch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMatch={selectedMatch}
        selectMatch={selectMatch}
        hiddenMatches={hiddenMatches}
        setShowHiddenModal={setShowHiddenModal}
        resizableLayoutRef={resizableLayoutRef as React.RefObject<ResizableMatchLayoutRef>}
        scrollToMatch={scrollToMatch}
        onAddMatch={onAddMatch}
        matchDetailsViewMode={matchDetailsViewMode}
        setMatchDetailsViewMode={setMatchDetailsViewMode}
      />

      <SummaryAndHiddenSection
        visibleMatches={visibleMatches}
        teamMatches={teamMatches}
        unhiddenMatches={unhiddenMatches}
        showHiddenModal={showHiddenModal}
        hiddenMatches={hiddenMatches}
        handleUnhideMatch={handleUnhideMatch}
        setShowHiddenModal={setShowHiddenModal}
      />
    </div>
  );
}

function useMatchData() {
  const appData = useAppData();

  const activeTeamMatches = useMemo(() => {
    const selectedTeamId = appData.state.selectedTeamId;
    const team = appData.getTeam(selectedTeamId);

    if (!team) {
      throw new Error(`Selected team ${selectedTeamId} not found - this should never happen`);
    }

    const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
    const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
    const storedMatchIds = Array.from(team.matches.keys());
    const allMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

    return Array.from(allMatchIds)
      .map((id) => {
        const fullMatch = appData.getMatch(id);
        if (fullMatch) {
          return fullMatch;
        }

        const metadata = team.matches.get(id);
        if (!metadata) {
          return undefined;
        }

        return createPlaceholderMatch(team, id, metadata, appData.heroes);
      })
      .filter((m): m is Match => m !== undefined);
    // Dependencies:
    // - appData: access to methods and state
    // - appData.state.selectedTeamId: re-run when team changes
    // - appData.teams: re-run when teams change (triggered by updateTeamsRef)
    // - appData.matches: re-run when matches change (triggered by updateMatchesRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, appData.state.selectedTeamId, appData.teams, appData.matches]);

  return { activeTeamMatches };
}

function useHiddenMatches(filteredMatches: Match[]) {
  const [hiddenMatches, setHiddenMatches] = useState<Match[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  const handleHideMatch = useCallback(
    (id: number) => {
      setHiddenMatches((prev) => {
        const matchToHide = filteredMatches.find((m) => m.id === id);
        if (!matchToHide) return prev;
        return [...prev, matchToHide];
      });
    },
    [filteredMatches],
  );

  const handleUnhideMatch = useCallback((id: number) => {
    setHiddenMatches((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const visibleMatches = useMemo(() => {
    const hiddenIds = new Set(hiddenMatches.map((m) => m.id));
    return filteredMatches.filter((m) => !hiddenIds.has(m.id));
  }, [filteredMatches, hiddenMatches]);
  return { hiddenMatches, showHiddenModal, setShowHiddenModal, handleHideMatch, handleUnhideMatch, visibleMatches };
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
    setError,
  };
}

function useScheduledScroll(ref: React.RefObject<ResizableMatchLayoutRef | null>) {
  const scheduledScrollRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (matchId: number) => {
      if (scheduledScrollRef.current) clearTimeout(scheduledScrollRef.current);
      scheduledScrollRef.current = setTimeout(() => {
        ref.current?.scrollToMatch(matchId);
        scheduledScrollRef.current = null;
      }, 100);
    },
    [ref],
  );
}

function useAddMatchHandler(
  appData: ReturnType<typeof useAppData>,
  setShowAddMatchForm: (show: boolean) => void,
  setIsSubmitting: (v: boolean) => void,
  setError: (e: string | undefined) => void,
  selectMatch: (id: number) => void,
  scrollToMatch: (id: number) => void,
) {
  return useCallback(
    async (matchId: string, teamSide: 'radiant' | 'dire' | '') => {
      const matchIdNum = parseInt(matchId, 10);
      if (isNaN(matchIdNum)) return;
      setShowAddMatchForm(false);
      setIsSubmitting(true);
      setError(undefined);
      try {
        // Form validation ensures teamSide is always 'radiant' or 'dire' (never empty)
        // selectedTeamId is always set (defaults to GLOBAL_TEAM_KEY)
        if (teamSide !== 'radiant' && teamSide !== 'dire') {
          throw new Error('Invalid team side - form validation failed');
        }

        const selectedTeamId = appData.state.selectedTeamId;
        // Add to AppData (loads full match data and tracks association)
        // User-selected side is stored in participation data
        await appData.addManualMatchToTeam(matchIdNum, selectedTeamId, teamSide);

        selectMatch(matchIdNum);
        scrollToMatch(matchIdNum);
      } catch (error) {
        console.error('Failed to add match:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [appData, setShowAddMatchForm, setIsSubmitting, setError, selectMatch, scrollToMatch],
  );
}

function useTeamMatchesMemo(appData: ReturnType<typeof useAppData>, selectedTeamId: string) {
  return useMemo(() => {
    const team = appData.getTeam(selectedTeamId);
    if (!team) return new Map<number, TeamMatchParticipation>();

    // Get metadata from AppData - includes match participation for all teams (including global)
    return appData.getTeamMatchesMetadata(selectedTeamId);
    // Dependencies:
    // - appData: access to methods
    // - appData.teams: re-run when team participation data changes
    // - appData.matches: re-run when match data changes
    // - selectedTeamId: re-run when selected team changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, appData.teams, appData.matches, selectedTeamId]);
}

function useSelectedMatchMemo(selectedMatchId: number | null, appData: ReturnType<typeof useAppData>) {
  return useMemo(
    () => (selectedMatchId ? appData.getMatch(selectedMatchId) || null : null),
    [selectedMatchId, appData],
  );
}

function useMatchExistsCallback(appData: ReturnType<typeof useAppData>) {
  return useCallback(
    (mid: string) => {
      const selectedTeamId = appData.state.selectedTeamId;
      if (!selectedTeamId) return false;
      const matchIdNum = parseInt(mid, 10);
      if (isNaN(matchIdNum)) return false;
      return appData.teamHasMatch(matchIdNum, selectedTeamId);
    },
    [appData],
  );
}

export function useMatchHistoryPageState(): MatchHistoryContentProps {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

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
  const { activeTeamMatches } = useMatchData();
  const teamMatches = useTeamMatchesMemo(appData, selectedTeamId);
  const addMatchForm = useAddMatchForm();
  const { filteredMatches } = useMatchFilters(activeTeamMatches, teamMatches, filters, new Set());
  const hidden = useHiddenMatches(filteredMatches);
  const unhiddenMatches = useMemo(() => {
    const hiddenIds = new Set(hidden.hiddenMatches.map((m) => m.id));
    return activeTeamMatches.filter((m) => !hiddenIds.has(m.id));
  }, [activeTeamMatches, hidden.hiddenMatches]);
  const selectedMatch = useSelectedMatchMemo(selectedMatchId, appData);
  const scrollToMatch = useScheduledScroll(resizableLayoutRef);
  const handleAddMatch = useAddMatchHandler(
    appData,
    addMatchForm.setShowAddMatchForm,
    addMatchForm.setIsSubmitting,
    addMatchForm.setError,
    (id) => setSelectedMatchId(id),
    scrollToMatch,
  );
  const handleRefreshMatch = useCallback(
    async (id: number) => {
      // Refresh match by force reloading from API
      await appData.refreshMatch(id);
    },
    [appData],
  );
  const matchExists = useMatchExistsCallback(appData);
  const selectMatch = (id: number) => setSelectedMatchId(id);

  return {
    hiddenMatches: hidden.hiddenMatches,
    showHiddenModal: hidden.showHiddenModal,
    setShowHiddenModal: hidden.setShowHiddenModal,
    filters,
    setFilters,
    visibleMatches: hidden.visibleMatches,
    activeTeamMatches,
    filteredMatches,
    unhiddenMatches,
    teamMatches,
    handleHideMatch: hidden.handleHideMatch,
    handleUnhideMatch: hidden.handleUnhideMatch,
    viewMode,
    setViewMode,
    selectedMatch,
    selectMatch,
    matchDetailsViewMode,
    setMatchDetailsViewMode,
    handleRefreshMatch,
    showAddMatchForm: addMatchForm.showAddMatchForm,
    setShowAddMatchForm: addMatchForm.setShowAddMatchForm,
    matchId: addMatchForm.matchId,
    teamSide: addMatchForm.teamSide,
    setMatchId: addMatchForm.setMatchId,
    setTeamSide: addMatchForm.setTeamSide,
    handleAddMatch,
    matchExists,
    isSubmitting: addMatchForm.isSubmitting,
    error: addMatchForm.error,
    resizableLayoutRef,
    scrollToMatch,
  };
}

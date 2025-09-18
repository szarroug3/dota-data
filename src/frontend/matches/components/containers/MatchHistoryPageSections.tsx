'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from '@/frontend/matches/components/filters/MatchFilters';
import { useMatchContext } from '@/frontend/matches/contexts/state/match-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import { useMatchFilters } from '@/hooks/use-match-filters';
import useViewMode, { type MatchListViewMode } from '@/hooks/useViewMode';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';

import {
  AddMatchFormSection,
  getMatchHistoryEmptyState,
  HeroSummarySection,
  HiddenMatchesModalSection,
} from './MatchHistorySectionsHelpers';
import { ResizableMatchLayout, type ResizableMatchLayoutRef } from './ResizableMatchLayout';

export type MatchHistoryContentProps = {
  teamDataList: TeamData[];
  activeTeam: { teamId: string; leagueId: string } | null;
  hiddenMatches: Match[];
  showHiddenModal: boolean;
  setShowHiddenModal: (show: boolean) => void;
  filters: MatchFiltersType;
  setFilters: (filters: MatchFiltersType) => void;
  visibleMatches: Match[];
  activeTeamMatches: Match[];
  filteredMatches: Match[];
  unhiddenMatches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
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
  handleAddMatch: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>;
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
    onAddMatch,
  } = props;

  const emptyState = getMatchHistoryEmptyState(teamDataList, activeTeam);
  if (emptyState) return emptyState;

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
  const { getSelectedTeam } = useTeamContext();
  const { getMatch } = useMatchContext();
  const activeTeamMatches = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    if (!selectedTeam) return [] as Match[];
    const matchIds = Object.keys(selectedTeam.matches).map(Number);
    return matchIds.map((id) => getMatch(id)).filter((m): m is Match => m !== undefined);
  }, [getSelectedTeam, getMatch]);
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
  addMatch: (id: number) => Promise<Match | null>,
  addMatchToTeam: (id: number, side: 'radiant' | 'dire') => Promise<void>,
  selectedTeamId: { teamId: number; leagueId: number } | null,
  teams: Map<string, TeamData>,
  setTeams: (teams: Map<string, TeamData>) => void,
  setShowAddMatchForm: (show: boolean) => void,
  setIsSubmitting: (v: boolean) => void,
  setError: (e: string | undefined) => void,
  selectMatch: (id: number) => void,
  scrollToMatch: (id: number) => void,
) {
  return useCallback(
    async (matchId: string, teamSide: 'radiant' | 'dire') => {
      const matchIdNum = parseInt(matchId, 10);
      if (isNaN(matchIdNum)) return;
      setShowAddMatchForm(false);
      setIsSubmitting(true);
      setError(undefined);
      try {
        addMatch(matchIdNum);
        await addMatchToTeam(matchIdNum, teamSide);
        if (selectedTeamId) {
          const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
          const currentTeams = teams;
          const team = currentTeams.get(teamKey);
          if (team) {
            if (!team.manualMatches) {
              team.manualMatches = {} as TeamData['manualMatches'];
            }
            (team.manualMatches as Record<number, { side: 'radiant' | 'dire' }>)[matchIdNum] = { side: teamSide };
            const updatedTeams = new Map(currentTeams);
            updatedTeams.set(teamKey, team);
            setTeams(updatedTeams);
          }
        }
        selectMatch(matchIdNum);
        scrollToMatch(matchIdNum);
      } catch (error) {
        console.error('Failed to add match:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      addMatch,
      addMatchToTeam,
      selectedTeamId,
      teams,
      setTeams,
      setShowAddMatchForm,
      setIsSubmitting,
      setError,
      selectMatch,
      scrollToMatch,
    ],
  );
}

function useTeamMatchesMemo(teams: Map<string, TeamData>, selectedTeamId: { teamId: number; leagueId: number } | null) {
  return useMemo(() => {
    if (!selectedTeamId) return {} as Record<number, TeamMatchParticipation>;
    const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
    const selectedTeam = teams.get(teamKey);
    return selectedTeam?.matches || {};
  }, [teams, selectedTeamId]);
}

function useSelectedMatchMemo(selectedMatchId: number | null, getMatch: (id: number) => Match | undefined) {
  return useMemo(() => (selectedMatchId ? getMatch(selectedMatchId) || null : null), [selectedMatchId, getMatch]);
}

function useActiveTeamMemo(selectedTeamId: { teamId: number; leagueId: number } | null) {
  return useMemo(() => {
    if (!selectedTeamId) return null;
    return { teamId: selectedTeamId.teamId.toString(), leagueId: selectedTeamId.leagueId.toString() };
  }, [selectedTeamId]);
}

function useMatchExistsCallback(
  teams: Map<string, TeamData>,
  selectedTeamId: { teamId: number; leagueId: number } | null,
) {
  return useCallback(
    (mid: string) => {
      if (!selectedTeamId) return false;
      const matchIdNum = parseInt(mid, 10);
      if (isNaN(matchIdNum)) return false;
      const teamKey = `${selectedTeamId.teamId}-${selectedTeamId.leagueId}`;
      const selectedTeam = teams.get(teamKey);
      if (!selectedTeam) return false;
      return matchIdNum in selectedTeam.matches;
    },
    [teams, selectedTeamId],
  );
}

export function useMatchHistoryPageState(): MatchHistoryContentProps {
  const { getAllTeams, addMatchToTeam, teams, selectedTeamId } = useTeamContext();
  const { refreshMatch, addMatch, getMatch, selectedMatchId, setSelectedMatchId } = useMatchContext();
  const { setTeams } = useConfigContext();
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
  const teamMatches = useTeamMatchesMemo(teams, selectedTeamId);
  const addMatchForm = useAddMatchForm();
  const { filteredMatches } = useMatchFilters(activeTeamMatches, teamMatches, filters, new Set());
  const hidden = useHiddenMatches(filteredMatches);
  const unhiddenMatches = useMemo(() => {
    const hiddenIds = new Set(hidden.hiddenMatches.map((m) => m.id));
    return activeTeamMatches.filter((m) => !hiddenIds.has(m.id));
  }, [activeTeamMatches, hidden.hiddenMatches]);
  const teamDataList = useMemo(() => getAllTeams(), [getAllTeams]);
  const selectedMatch = useSelectedMatchMemo(selectedMatchId, getMatch);
  const activeTeam = useActiveTeamMemo(selectedTeamId);
  const scrollToMatch = useScheduledScroll(resizableLayoutRef);
  const handleAddMatch = useAddMatchHandler(
    addMatch,
    addMatchToTeam,
    selectedTeamId,
    teams,
    setTeams,
    addMatchForm.setShowAddMatchForm,
    addMatchForm.setIsSubmitting,
    addMatchForm.setError,
    (id) => setSelectedMatchId(id),
    scrollToMatch,
  );
  const handleRefreshMatch = useCallback(
    (id: number) => {
      refreshMatch(id);
    },
    [refreshMatch],
  );
  const matchExists = useMatchExistsCallback(teams, selectedTeamId);
  const selectMatch = (id: number) => setSelectedMatchId(id);

  return {
    teamDataList,
    activeTeam,
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

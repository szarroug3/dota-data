'use client';

import React from 'react';

import type { Match, TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from '@/frontend/matches/components/filters/MatchFilters';
import type { MatchListViewMode } from '@/hooks/layout/useViewMode';

import { HeroSummarySection } from '../stateless/StatelessMatchHistorySectionsHelpers';

import { AddMatchFormSection, HiddenMatchesModalSection } from './MatchHistorySectionsHelpers';
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
  highPerformingHeroes: Set<string>;
  teamMatches: Map<number, TeamMatchParticipation>;
  selectedTeamId: string;
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
  isMatchListLoading?: boolean;
};

export function MatchListSection({
  filters,
  setFilters,
  teamMatches,
  visibleMatches,
  filteredMatches,
  unhiddenMatches,
  selectedTeamId,
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
  isMatchListLoading,
}: Pick<
  MatchHistoryContentProps,
  | 'filters'
  | 'setFilters'
  | 'teamMatches'
  | 'visibleMatches'
  | 'filteredMatches'
  | 'unhiddenMatches'
  | 'selectedTeamId'
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
  | 'isMatchListLoading'
> & { hiddenMatches: Match[]; setShowHiddenModal: (show: boolean) => void }) {
  return (
    <ResizableMatchLayout
      ref={resizableLayoutRef as React.RefObject<ResizableMatchLayoutRef>}
      filters={filters}
      onFiltersChange={setFilters}
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
      selectedTeamId={selectedTeamId}
      matchDetailsViewMode={matchDetailsViewMode}
      setMatchDetailsViewMode={setMatchDetailsViewMode}
      onScrollToMatch={scrollToMatch || (() => {})}
      onAddMatch={onAddMatch || (() => {})}
      isMatchListLoading={isMatchListLoading}
    />
  );
}

export function SummaryAndHiddenSection({
  visibleMatches,
  teamMatches,
  highPerformingHeroes,
  selectedTeamId = '',
  showHiddenModal,
  hiddenMatches,
  handleUnhideMatch,
  setShowHiddenModal,
}: Pick<
  MatchHistoryContentProps,
  | 'visibleMatches'
  | 'teamMatches'
  | 'highPerformingHeroes'
  | 'selectedTeamId'
  | 'showHiddenModal'
  | 'handleUnhideMatch'
  | 'setShowHiddenModal'
> & { hiddenMatches: Match[] }) {
  return (
    <>
      <HeroSummarySection visibleMatches={visibleMatches} highPerformingHeroes={highPerformingHeroes} />
      <HiddenMatchesModalSection
        showHiddenModal={showHiddenModal}
        hiddenMatches={hiddenMatches}
        handleUnhideMatch={handleUnhideMatch}
        setShowHiddenModal={setShowHiddenModal}
        teamMatches={teamMatches}
        selectedTeamId={selectedTeamId}
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
    filteredMatches,
    unhiddenMatches,
    highPerformingHeroes,
    teamMatches,
    selectedTeamId,
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
    isMatchListLoading,
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
        teamMatches={teamMatches}
        visibleMatches={visibleMatches}
        filteredMatches={filteredMatches}
        unhiddenMatches={unhiddenMatches}
        selectedTeamId={selectedTeamId}
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
        isMatchListLoading={isMatchListLoading}
      />

      <SummaryAndHiddenSection
        visibleMatches={visibleMatches}
        teamMatches={teamMatches}
        highPerformingHeroes={highPerformingHeroes}
        selectedTeamId={selectedTeamId}
        showHiddenModal={showHiddenModal}
        hiddenMatches={hiddenMatches}
        handleUnhideMatch={handleUnhideMatch}
        setShowHiddenModal={setShowHiddenModal}
      />
    </div>
  );
}

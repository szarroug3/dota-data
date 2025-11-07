'use client';

import React from 'react';

import type { Match, Team, TeamHeroSummary, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import type { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import {
  AddMatchFormSection,
  HeroSummarySection,
  HiddenMatchesModalSection,
} from '@/frontend/matches/components/stateless/MatchHistorySectionsHelpers';
import {
  ResizableMatchLayout,
  type ResizableMatchLayoutRef,
} from '@/frontend/matches/components/stateless/ResizableMatchLayout';
import type { MatchListViewMode } from '@/hooks/useViewMode';

export type MatchHistoryPageProps = {
  hiddenMatches: Match[];
  showHiddenModal: boolean;
  setShowHiddenModal: (show: boolean) => void;
  visibleMatches: Match[];
  unhiddenMatches: Match[];
  teamMatches: Map<number, TeamMatchParticipation>;
  heroSummary: TeamHeroSummary;
  highPerformingHeroes: Set<string>;
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
  selectedTeam: Team;
};

export function MatchHistoryPageView(props: MatchHistoryPageProps): React.ReactElement {
  const {
    hiddenMatches,
    showHiddenModal,
    setShowHiddenModal,
    visibleMatches,
    unhiddenMatches,
    teamMatches,
    heroSummary,
    highPerformingHeroes,
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
    selectedTeam,
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

      <ResizableMatchLayout
        ref={resizableLayoutRef as React.RefObject<ResizableMatchLayoutRef>}
        teamMatches={teamMatches}
        visibleMatches={visibleMatches}
        unhiddenMatches={unhiddenMatches}
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
        onScrollToMatch={scrollToMatch || (() => {})}
        onAddMatch={onAddMatch || (() => {})}
        selectedTeam={selectedTeam}
      />

      <HeroSummarySection summary={heroSummary} highPerformingHeroes={highPerformingHeroes} />
      <HiddenMatchesModalSection
        showHiddenModal={showHiddenModal}
        hiddenMatches={hiddenMatches}
        handleUnhideMatch={handleUnhideMatch}
        setShowHiddenModal={setShowHiddenModal}
        teamMatches={teamMatches}
      />
    </div>
  );
}

"use client";


import { AddMatchForm } from '@/frontend/matches/components/stateless/AddMatchForm';
import { HiddenMatchesModal } from '@/frontend/matches/components/stateless/HiddenMatchesModal';
import { HeroSummaryTable } from '@/frontend/matches/components/summary/HeroSummaryTable';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import { validateMatchId } from '@/utils/validation';

export function getMatchHistoryEmptyState(teamDataList: TeamData[], activeTeam: { teamId: string; leagueId: string } | null) {
  if (teamDataList.length === 0) {
    return <div className="p-4 text-center">No teams available</div>;
  }
  if (!activeTeam) {
    return <div className="p-4 text-center">Please select a team</div>;
  }
  return null;
}

export function HeroSummarySection({ visibleMatches, teamMatches, allMatches }: { visibleMatches: Match[]; teamMatches: Record<number, TeamMatchParticipation>; allMatches: Match[] }) {
  return <HeroSummaryTable matches={visibleMatches} teamMatches={teamMatches} allMatches={allMatches} />;
}

export function HiddenMatchesModalSection({ showHiddenModal, hiddenMatches, handleUnhideMatch, setShowHiddenModal, teamMatches }: {
  showHiddenModal: boolean;
  hiddenMatches: Match[];
  handleUnhideMatch: (id: number) => void;
  setShowHiddenModal: (show: boolean) => void;
  teamMatches: Record<number, TeamMatchParticipation>;
}) {
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

export function AddMatchFormSection({
  showAddMatchForm,
  matchId,
  teamSide,
  setMatchId,
  setTeamSide,
  handleAddMatch,
  matchExists,
  isSubmitting,
  setShowAddMatchForm,
  error,
}: {
  showAddMatchForm: boolean;
  matchId: string;
  teamSide: 'radiant' | 'dire' | '';
  setMatchId: (value: string) => void;
  setTeamSide: (value: 'radiant' | 'dire' | '') => void;
  handleAddMatch: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>;
  matchExists: (matchId: string) => boolean;
  isSubmitting: boolean;
  setShowAddMatchForm: (show: boolean) => void;
  error?: string;
}) {
  const validation = validateMatchId(matchId);
  const validationError = matchId.trim().length > 0 ? validation.error : undefined;
  const isValid = validation.isValid;
  return (
    <AddMatchForm
      isOpen={showAddMatchForm}
      onClose={() => setShowAddMatchForm(false)}
      matchId={matchId}
      teamSide={teamSide}
      onMatchIdChange={setMatchId}
      onTeamSideChange={setTeamSide}
      onSubmit={async () => {
        await handleAddMatch(matchId, teamSide as 'radiant' | 'dire');
      }}
      matchExists={matchExists}
      isSubmitting={isSubmitting}
      error={error}
      validationError={validationError}
      isValid={isValid}
    />
  );
}

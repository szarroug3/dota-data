import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/frontend/contexts/config-context';
import { EditManualMatchButton } from '@/frontend/matches/components/stateless/common/EditManualMatchButton';
import { ExternalSiteButton } from '@/frontend/matches/components/stateless/common/ExternalSiteButton';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { HideButton } from '@/frontend/matches/components/stateless/common/HideButton';
import { RefreshButton } from '@/frontend/matches/components/stateless/common/RefreshButton';
import { RemoveManualMatchButton } from '@/frontend/matches/components/stateless/common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '@/frontend/matches/components/stateless/EditManualMatchSheet';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import { validateMatchId } from '@/utils/validation';

const useResponsiveGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const newColumns = Math.floor(width / 200) || 1;
      setColumns(newColumns);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef?.current?.offsetWidth]);

  return { containerRef, columns };
};

function getCardClassName(isSelected: boolean, hasError: boolean): string {
  if (isSelected) return 'ring-2 ring-primary';
  if (hasError) return 'border-destructive bg-destructive/5 cursor-not-allowed';
  return 'cursor-pointer hover:shadow-md';
}

function getCardAriaLabel(hasError: boolean, matchId: number, error: string | undefined, opponentName: string): string {
  return hasError ? `Match ${matchId} - Error: ${error}` : `Select match vs ${opponentName}`;
}

function onCardClick(hasError: boolean, onSelect: (id: number) => void, matchId: number) {
  if (!hasError) {
    onSelect(matchId);
  }
}

function isDuplicateInFormTeam(
  teamMatch: TeamMatchParticipation | undefined,
  currentMatchId: number,
  newMatchId: number,
): boolean {
  if (!teamMatch) return false;
  const map = { [currentMatchId]: teamMatch } as Record<number, TeamMatchParticipation>;
  return newMatchId in map;
}

function isDuplicateInManual(selectedTeam: TeamData | undefined, newMatchId: number): boolean {
  return Boolean(selectedTeam?.manualMatches && newMatchId in (selectedTeam.manualMatches || {}));
}

function isDuplicateInMatches(selectedTeam: TeamData | undefined, newMatchId: number): boolean {
  return Boolean(selectedTeam?.matches && newMatchId in (selectedTeam.matches || {}));
}

function computeDuplicateError(
  newMatchId: number,
  currentMatchId: number,
  teamMatch: TeamMatchParticipation | undefined,
  selectedTeam: TeamData | undefined,
): string | undefined {
  if (!Number.isFinite(newMatchId) || newMatchId === currentMatchId) return undefined;
  const duplicate =
    isDuplicateInFormTeam(teamMatch, currentMatchId, newMatchId) ||
    isDuplicateInManual(selectedTeam, newMatchId) ||
    isDuplicateInMatches(selectedTeam, newMatchId);
  return duplicate ? `Match ${newMatchId} is already present for the selected team` : undefined;
}

interface MatchListViewCardProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches?: Record<number, TeamMatchParticipation>;
  onScrollToMatch?: (matchId: number) => void;
}

interface MatchCardProps {
  match: Match;
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatch?: TeamMatchParticipation;
  onScrollToMatch?: (matchId: number) => void;
}

function useEditManualMatchForm(
  matchId: number,
  teamMatch: TeamMatchParticipation | undefined,
  selectedTeam: TeamData | undefined,
) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [matchIdString, setMatchIdString] = useState(matchId.toString());
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [duplicateError, setDuplicateError] = useState<string | undefined>();

  // keep in sync when prop changes
  useEffect(() => {
    setMatchIdString(matchId.toString());
    const side = selectedTeam?.manualMatches?.[matchId]?.side || 'radiant';
    setTeamSide(side);
  }, [matchId, selectedTeam]);

  useEffect(() => {
    const v = validateMatchId(matchIdString);
    setValidationError(v.error);
  }, [matchIdString]);

  useEffect(() => {
    const newMatchId = parseInt(matchIdString, 10);
    setDuplicateError(computeDuplicateError(newMatchId, matchId, teamMatch, selectedTeam));
  }, [matchIdString, matchId, teamMatch, selectedTeam]);

  const isFormValid = !validationError && teamSide !== '' && !duplicateError;

  return {
    showEditSheet,
    setShowEditSheet,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    matchIdString,
    setMatchIdString,
    teamSide,
    setTeamSide,
    validationError,
    duplicateError,
    isFormValid,
  } as const;
}

function MatchCard({
  match,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  teamMatch,
  onScrollToMatch,
}: MatchCardProps) {
  const { config } = useConfigContext();
  const { getSelectedTeam, removeManualMatch, editManualMatch } = useTeamContext();
  const selectedTeam = getSelectedTeam();
  const form = useEditManualMatchForm(match.id, teamMatch, selectedTeam);

  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);

  const isManualMatch = useMemo(
    () => Boolean(selectedTeam?.manualMatches && match.id in selectedTeam.manualMatches),
    [match.id, selectedTeam],
  );

  const matchHeroes = useMemo(() => {
    if (!teamMatch?.side) return [];
    const teamPlayers = match.players[teamMatch.side] || [];
    return teamPlayers.map((player) => player.hero).filter((hero): hero is Hero => hero !== undefined && hero !== null);
  }, [match, teamMatch]);

  const handleRemoveManualMatch = () => {
    removeManualMatch(match.id);
  };

  const handleEditManualMatch = async (newMatchId: number, teamSide: 'radiant' | 'dire') => {
    form.setShowEditSheet(false);
    form.setIsSubmitting(true);
    form.setError(undefined);
    try {
      await editManualMatch(match.id, newMatchId, teamSide);
      onScrollToMatch?.(newMatchId);
      onSelectMatch(newMatchId);
    } catch (err) {
      form.setError(err instanceof Error ? err.message : 'Failed to edit match');
      console.error('Failed to edit match:', err);
    } finally {
      form.setIsSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!form.isFormValid) return;
    const newId = parseInt(form.matchIdString, 10);
    await handleEditManualMatch(newId, form.teamSide as 'radiant' | 'dire');
  };

  return (
    <Card
      className={`transition-all ${getCardClassName(selectedMatchId === match.id, hasError)}`}
      onClick={() => onCardClick(hasError, onSelectMatch, match.id)}
      role="button"
      tabIndex={hasError ? -1 : 0}
      aria-label={getCardAriaLabel(hasError, match.id, match.error, teamMatch?.opponentName ?? `Match ${match.id}`)}
    >
      <CardContent className="p-4 h-[140px] relative">
        <MatchCardHeader
          isLoading={isLoading}
          hasError={hasError}
          title={isLoading && !hasError ? `Loading ${match.id}` : (teamMatch?.opponentName ?? `Match ${match.id}`)}
        />
        <MatchCenter isLoading={isLoading} hasError={hasError} heroes={matchHeroes} />

        <ActionButtonsRow
          isManualMatch={isManualMatch}
          matchId={match.id}
          opponentName={teamMatch?.opponentName ?? `Match ${match.id}`}
          preferredSite={config.preferredExternalSite}
          onRefreshMatch={onRefreshMatch}
          onHideMatch={onHideMatch}
          onOpenEdit={() => form.setShowEditSheet(true)}
          onRemoveManual={handleRemoveManualMatch}
        />
      </CardContent>

      <EditManualMatchSheet
        isOpen={form.showEditSheet}
        onClose={() => form.setShowEditSheet(false)}
        matchIdString={form.matchIdString}
        teamSide={form.teamSide}
        onChangeMatchId={form.setMatchIdString}
        onChangeTeamSide={form.setTeamSide}
        onSubmit={submitEdit}
        isSubmitting={form.isSubmitting}
        error={form.error}
        validationError={form.validationError}
        duplicateError={form.duplicateError}
        isFormValid={form.isFormValid}
      />
    </Card>
  );
}

function MatchCardHeader({ title }: { isLoading: boolean; hasError: boolean; title: string }) {
  return (
    <div className="absolute top-4 left-0 right-0 text-center @[100px]:flex hidden h-5 items-center justify-center">
      <h3 className="font-medium text-sm truncate">{title}</h3>
    </div>
  );
}

function MatchCenter({ isLoading, hasError, heroes }: { isLoading: boolean; hasError: boolean; heroes: Hero[] }) {
  return (
    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 transform flex h-8 items-center justify-center">
      {isLoading && !hasError ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      ) : (
        <HeroAvatars heroes={heroes} avatarSize={{ width: 'w-8', height: 'h-8' }} />
      )}
    </div>
  );
}

function HeroAvatars({
  heroes,
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = '',
}: {
  heroes: Hero[];
  avatarSize?: { width: string; height: string };
  className?: string;
}) {
  const totalHeroes = heroes.length;
  return (
    <div className={`-space-x-1 @[100px]:flex hidden ${className}`}>
      <div className="@[300px]:flex hidden">
        {heroes.slice(0, 5).map((hero) => (
          <HeroAvatar key={hero.id} hero={hero} avatarSize={avatarSize} />
        ))}
      </div>
      <div className="@[250px]:flex @[300px]:hidden hidden">
        {heroes.slice(0, 3).map((hero) => (
          <HeroAvatar key={hero.id} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 3 && <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />}
      </div>
      <div className="@[200px]:flex @[250px]:hidden hidden">
        {heroes.slice(0, 2).map((hero) => (
          <HeroAvatar key={hero.id} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 2 && <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />}
      </div>
      <div className="@[100px]:flex @[200px]:hidden hidden">
        {heroes.slice(0, 1).map((hero) => (
          <HeroAvatar key={hero.id} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 1 && <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />}
      </div>
      <div className="@[100px]:hidden flex">
        {heroes.slice(0, 1).map((hero) => (
          <HeroAvatar key={hero.id} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 1 && <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />}
      </div>
    </div>
  );
}

function HeroIndicator({ count, avatarSize }: { count: number; avatarSize: { width: string; height: string } }) {
  const { width, height } = avatarSize;
  return (
    <div
      className={`${width} ${height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}
    >
      <span className="text-xs font-medium text-muted-foreground">+{count}</span>
    </div>
  );
}

function ActionButtonsRow({
  isManualMatch,
  matchId,
  opponentName,
  preferredSite,
  onRefreshMatch,
  onHideMatch,
  onOpenEdit,
  onRemoveManual,
}: {
  isManualMatch: boolean;
  matchId: number;
  opponentName: string;
  preferredSite: PreferredExternalSite;
  onRefreshMatch: (id: number) => void;
  onHideMatch: (id: number) => void;
  onOpenEdit: () => void;
  onRemoveManual: () => void;
}) {
  return (
    <div
      className="absolute bottom-4 left-0 right-0 @[200px]:flex hidden h-8 items-center justify-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalSiteButton matchId={matchId} preferredSite={preferredSite} size="sm" />
      <RefreshButton onClick={() => onRefreshMatch(matchId)} ariaLabel={`Refresh match vs ${opponentName}`} />
      {isManualMatch ? (
        <>
          <EditManualMatchButton onClick={onOpenEdit} ariaLabel={`Edit manual match`} />
          <RemoveManualMatchButton onClick={onRemoveManual} ariaLabel={`Remove manual match`} />
        </>
      ) : (
        <HideButton onClick={() => onHideMatch(matchId)} ariaLabel={`Hide match`} />
      )}
    </div>
  );
}

const MatchListViewCard: React.FC<MatchListViewCardProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className = '',
  teamMatches = {},
  onScrollToMatch,
}) => {
  const { containerRef, columns } = useResponsiveGrid();

  return (
    <div
      ref={containerRef}
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {matches.map((match) => (
        <div key={match.id} data-match-id={match.id}>
          <MatchCard
            match={match}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            teamMatch={teamMatches[match.id]}
            onScrollToMatch={onScrollToMatch}
          />
        </div>
      ))}
    </div>
  );
};

export { MatchListViewCard };

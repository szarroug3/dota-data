import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { Hero, Match, Team } from '@/frontend/lib/app-data-types';
import type { StoredHero, StoredMatchData } from '@/frontend/lib/storage-manager';
import { EditManualMatchButton } from '@/frontend/matches/components/stateless/common/EditManualMatchButton';
import { ExternalSiteButton } from '@/frontend/matches/components/stateless/common/ExternalSiteButton';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { HideButton } from '@/frontend/matches/components/stateless/common/HideButton';
import { RefreshButton } from '@/frontend/matches/components/stateless/common/RefreshButton';
import { RemoveManualMatchButton } from '@/frontend/matches/components/stateless/common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '@/frontend/matches/components/stateless/EditManualMatchSheet';
import { getOpponentName } from '@/frontend/matches/utils/match-name-helpers';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
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

function isDuplicateInFormTeam(teamMatch: StoredMatchData, currentMatchId: number, newMatchId: number): boolean {
  const map = { [currentMatchId]: teamMatch } as Record<number, StoredMatchData>;
  return newMatchId in map;
}

function isDuplicateInManual(selectedTeam: Team, newMatchId: number): boolean {
  const matchData = selectedTeam.matches.get(newMatchId);
  return matchData?.isManual || false;
}

function isDuplicateInMatches(selectedTeam: Team, newMatchId: number): boolean {
  return selectedTeam.matches.has(newMatchId);
}

function computeDuplicateError(
  newMatchId: number,
  currentMatchId: number,
  teamMatch: StoredMatchData,
  selectedTeam: Team,
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
  teamMatches: Map<number, StoredMatchData>;
  onScrollToMatch?: (matchId: number) => void;
  highPerformingHeroes?: Set<string>;
}

interface MatchCardProps {
  match: Match;
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatch: StoredMatchData;
  onScrollToMatch?: (matchId: number) => void;
  highPerformingHeroes: Set<string>;
}

/**
 * Hook for handling manual match operations (remove/edit)
 */
function useManualMatchHandlers(
  match: Match,
  selectedTeamId: string,
  appData: ReturnType<typeof useAppData>,
  form: ReturnType<typeof useEditManualMatchForm>,
  onScrollToMatch?: (matchId: number) => void,
  onSelectMatch?: (matchId: number) => void,
) {
  const handleRemoveManualMatch = useCallback(() => {
    appData.removeManualMatchFromTeam(match.id, selectedTeamId);
  }, [appData, match.id, selectedTeamId]);

  const handleEditManualMatch = useCallback(
    async (newMatchId: number) => {
      form.setShowEditSheet(false);
      form.setIsSubmitting(true);
      form.setError(undefined);

      try {
        // Validate that side is selected
        if (form.teamSide !== 'radiant' && form.teamSide !== 'dire') {
          form.setError('Please select a team side (Radiant or Dire)');
          return;
        }

        // Scroll immediately when the match will move in the list
        onScrollToMatch?.(newMatchId);
        onSelectMatch?.(newMatchId);

        // Atomic swap to prevent flickering
        // Pass the user-selected side from the form
        await appData.editManualMatchToTeam(match.id, newMatchId, selectedTeamId, form.teamSide);
      } catch (err) {
        // Only handle validation errors here - match loading errors are handled by AppData
        if (err instanceof Error && err.message.includes('team side')) {
          form.setError(err.message);
        } else {
          // For other errors, just log them - the match will show the error
          console.error('Failed to edit match:', err);
        }
      } finally {
        form.setIsSubmitting(false);
      }
    },
    [form, selectedTeamId, appData, match.id, onScrollToMatch, onSelectMatch],
  );

  const submitEdit = useCallback(async () => {
    if (!form.isFormValid) return;
    const newId = parseInt(form.matchIdString, 10);
    await handleEditManualMatch(newId);
  }, [form.isFormValid, form.matchIdString, handleEditManualMatch]);

  return { handleRemoveManualMatch, handleEditManualMatch, submitEdit };
}

/**
 * Hook to prepare all MatchCard data and handlers
 * Extracts complexity from the main component
 */
function useMatchCardData(
  match: Match,
  teamMatch: StoredMatchData,
  onScrollToMatch?: (matchId: number) => void,
  onSelectMatch?: (matchId: number) => void,
) {
  const { config } = useConfigContext();
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const selectedTeam = appData.getTeam(selectedTeamId);

  if (!selectedTeam) {
    throw new Error(`Selected team ${selectedTeamId} not found`);
  }

  const form = useEditManualMatchForm(match.id, teamMatch, selectedTeam);
  const handlers = useManualMatchHandlers(match, selectedTeamId, appData, form, onScrollToMatch, onSelectMatch);

  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  const isManualMatch = useMemo(() => {
    const matchData = selectedTeam.matches.get(match.id);
    return matchData?.isManual || false;
  }, [match.id, selectedTeam]);

  const matchHeroes = useMemo(() => {
    const side = teamMatch.side;
    const heroesMap = appData.heroes;

    if (side && match.players?.[side]?.length) {
      return match.players[side].map((player) => player.hero).filter((hero): hero is Hero => Boolean(hero));
    }

    return (teamMatch.heroes || []).map((storedHero) => resolveStoredHero(storedHero, heroesMap));
  }, [appData.heroes, match, teamMatch]);

  return {
    config,
    form,
    handlers,
    hasError,
    isLoading,
    isManualMatch,
    matchHeroes,
  };
}

function resolveStoredHero(storedHero: StoredHero, heroesMap: Map<number, Hero>): Hero {
  const hero = heroesMap.get(storedHero.id);
  if (hero) {
    return hero;
  }

  return {
    id: storedHero.id,
    name: storedHero.name,
    localizedName: storedHero.localizedName,
    imageUrl: storedHero.imageUrl,
  } as Hero;
}

function useEditManualMatchForm(matchId: number, teamMatch: StoredMatchData, selectedTeam: Team) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [matchIdString, setMatchIdString] = useState(matchId.toString());
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [duplicateError, setDuplicateError] = useState<string | undefined>();

  // Initialize values when matchId changes (but don't reset user input)
  useEffect(() => {
    setMatchIdString(matchId.toString());
    const matchData = selectedTeam.matches.get(matchId);
    const side = matchData?.side || 'radiant';
    setTeamSide(side);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

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
  highPerformingHeroes,
}: MatchCardProps) {
  const { config, form, handlers, hasError, isLoading, isManualMatch, matchHeroes } = useMatchCardData(
    match,
    teamMatch,
    onScrollToMatch,
    onSelectMatch,
  );

  return (
    <Card
      className={`transition-all ${getCardClassName(selectedMatchId === match.id, hasError)}`}
      onClick={() => onCardClick(hasError, onSelectMatch, match.id)}
      role="button"
      tabIndex={hasError ? -1 : 0}
      aria-label={getCardAriaLabel(hasError, match.id, match.error, getOpponentName(match, teamMatch))}
    >
      <CardContent className="p-4 h-[140px] relative">
        <MatchCardHeader
          isLoading={isLoading}
          hasError={hasError}
          title={isLoading && !hasError ? `Loading ${match.id}` : getOpponentName(match, teamMatch)}
        />
        <MatchCenter
          isLoading={isLoading}
          hasError={hasError}
          heroes={matchHeroes}
          highPerformingHeroes={highPerformingHeroes}
        />

        <ActionButtonsRow
          isManualMatch={isManualMatch}
          matchId={match.id}
          opponentName={getOpponentName(match, teamMatch)}
          preferredSite={config.preferredExternalSite}
          onRefreshMatch={onRefreshMatch}
          onHideMatch={onHideMatch}
          onOpenEdit={() => form.setShowEditSheet(true)}
          onRemoveManual={handlers.handleRemoveManualMatch}
        />
      </CardContent>

      <EditManualMatchSheet
        isOpen={form.showEditSheet}
        onClose={() => form.setShowEditSheet(false)}
        matchIdString={form.matchIdString}
        teamSide={form.teamSide}
        onChangeMatchId={form.setMatchIdString}
        onChangeTeamSide={form.setTeamSide}
        onSubmit={handlers.submitEdit}
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

function MatchCenter({
  isLoading,
  hasError,
  heroes,
  highPerformingHeroes,
}: {
  isLoading: boolean;
  hasError: boolean;
  heroes: Hero[];
  highPerformingHeroes: Set<string>;
}) {
  return (
    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 transform flex h-8 items-center justify-center">
      {isLoading && !hasError ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      ) : (
        <HeroAvatars
          heroes={heroes}
          highPerformingHeroes={highPerformingHeroes}
          avatarSize={{ width: 'w-8', height: 'h-8' }}
        />
      )}
    </div>
  );
}

function HeroAvatars({
  heroes,
  highPerformingHeroes,
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = '',
}: {
  heroes: Hero[];
  highPerformingHeroes: Set<string>;
  avatarSize?: { width: string; height: string };
  className?: string;
}) {
  const totalHeroes = heroes.length;
  return (
    <div className={`-space-x-1 @[100px]:flex hidden ${className}`}>
      <div className="@[300px]:flex hidden">
        {heroes.slice(0, 5).map((hero) => (
          <HeroAvatar
            key={hero.id}
            hero={hero}
            avatarSize={avatarSize}
            isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
          />
        ))}
      </div>
      <div className="@[250px]:flex @[300px]:hidden hidden">
        {heroes.slice(0, 3).map((hero) => (
          <HeroAvatar
            key={hero.id}
            hero={hero}
            avatarSize={avatarSize}
            isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
          />
        ))}
        {totalHeroes > 3 && <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />}
      </div>
      <div className="@[200px]:flex @[250px]:hidden hidden">
        {heroes.slice(0, 2).map((hero) => (
          <HeroAvatar
            key={hero.id}
            hero={hero}
            avatarSize={avatarSize}
            isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
          />
        ))}
        {totalHeroes > 2 && <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />}
      </div>
      <div className="@[100px]:flex @[200px]:hidden hidden">
        {heroes.slice(0, 1).map((hero) => (
          <HeroAvatar
            key={hero.id}
            hero={hero}
            avatarSize={avatarSize}
            isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
          />
        ))}
        {totalHeroes > 1 && <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />}
      </div>
      <div className="@[100px]:hidden flex">
        {heroes.slice(0, 1).map((hero) => (
          <HeroAvatar
            key={hero.id}
            hero={hero}
            avatarSize={avatarSize}
            isHighPerforming={highPerformingHeroes.has(hero.id.toString())}
          />
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
  teamMatches,
  onScrollToMatch,
  highPerformingHeroes = new Set(),
}) => {
  const { containerRef, columns } = useResponsiveGrid();

  return (
    <div
      ref={containerRef}
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {matches.map((match) => {
        const teamMatch = teamMatches.get(match.id);
        if (!teamMatch) {
          throw new Error(
            `Match ${match.id} has no team participation metadata. This should never happen - all matches in the match list should have participation data.`,
          );
        }

        return (
          <div key={match.id} data-match-id={match.id}>
            <MatchCard
              match={match}
              selectedMatchId={selectedMatchId}
              onSelectMatch={onSelectMatch}
              onHideMatch={onHideMatch}
              onRefreshMatch={onRefreshMatch}
              teamMatch={teamMatch}
              onScrollToMatch={onScrollToMatch}
              highPerformingHeroes={highPerformingHeroes}
            />
          </div>
        );
      })}
    </div>
  );
};

export { MatchListViewCard };

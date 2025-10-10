import React, { useMemo, useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { Hero, Match, TeamMatchMetadata, Team } from '@/frontend/lib/app-data-types';
import { EditManualMatchButton } from '@/frontend/matches/components/stateless/common/EditManualMatchButton';
import { ExternalSiteButton } from '@/frontend/matches/components/stateless/common/ExternalSiteButton';
import { HideButton } from '@/frontend/matches/components/stateless/common/HideButton';
import { RefreshButton } from '@/frontend/matches/components/stateless/common/RefreshButton';
import { RemoveManualMatchButton } from '@/frontend/matches/components/stateless/common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '@/frontend/matches/components/stateless/EditManualMatchSheet';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import { validateMatchId } from '@/utils/validation';

import { ErrorBadge, HeroAvatars, PickOrderBadge, ResultBadge, TeamSideBadge } from './MatchListViewList.parts';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface MatchListViewProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  className?: string;
  teamMatches: Map<number, TeamMatchMetadata>;
  allMatches: Match[];
  onScrollToMatch?: (matchId: number) => void;
  highPerformingHeroes?: Set<string>;
}

function MatchInfo({
  match,
  onSelectMatch,
  teamMatches,
}: {
  match: Match;
  onSelectMatch: (matchId: number) => void;
  teamMatches: Map<number, TeamMatchMetadata>;
}) {
  const teamMatch = teamMatches.get(match.id);
  const opponentName = teamMatch?.opponentName || 'Unknown';
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  return (
    <div
      className={`min-w-0 flex-1 @[170px]:opacity-100 opacity-0 invisible @[170px]:visible ${hasError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => {
        if (!hasError) {
          onSelectMatch(match.id);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div className="font-medium truncate">
          {hasError ? `Match ${match.id}` : isLoading ? `Loading ${match.id}` : opponentName}
        </div>
        {isLoading && !hasError && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-label="Loading" />
        )}
      </div>
      {hasError ? (
        <div className="text-sm text-destructive truncate" role="alert">
          {match.error}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground truncate">
          <span className="@[350px]:inline hidden">
            {formatDate(match.date)} • {formatDuration(match.duration)}
          </span>
          <span className="@[280px]:inline @[350px]:hidden hidden">{formatDate(match.date)}</span>
          <span className="@[220px]:inline @[280px]:hidden hidden">{formatDate(match.date)}</span>
          <span className="@[220px]:hidden">{formatDate(match.date)}</span>
        </div>
      )}
    </div>
  );
}

const didActiveTeamWin = (teamMatch: TeamMatchMetadata | undefined): boolean => teamMatch?.result === 'won';

const getPickOrder = (match: Match, teamMatch: TeamMatchMetadata | undefined): string | null => {
  if (!match.pickOrder || !teamMatch) return null;
  const pickOrder = match.pickOrder[teamMatch.side];
  return pickOrder === 'first' ? 'First Pick' : pickOrder === 'second' ? 'Second Pick' : null;
};

function computeDuplicateError(
  newMatchId: number,
  currentMatchId: number,
  teamMatch: TeamMatchMetadata,
  selectedTeam: Team,
): string | undefined {
  if (!Number.isFinite(newMatchId) || newMatchId === currentMatchId) return undefined;
  const duplicate = selectedTeam.matches.has(newMatchId);
  return duplicate ? `Match ${newMatchId} is already present for the selected team` : undefined;
}

function useEditManualMatchForm(matchId: number, teamMatch: TeamMatchMetadata, selectedTeam: Team) {
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
  }, [matchId]); // Only depend on matchId to prevent infinite loops

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

const MatchBadgesContent: React.FC<{
  hasError: boolean;
  isLoading: boolean;
  teamWon: boolean;
  teamSide: 'radiant' | 'dire' | undefined;
  pickOrder: string | null;
}> = ({ hasError, isLoading, teamWon, teamSide, pickOrder }) => {
  const badges: React.ReactNode[] = [];
  if (hasError) badges.push(<ErrorBadge key="err" />);
  if (!hasError && !isLoading) {
    badges.push(<ResultBadge key="res" teamWon={teamWon} />);
    badges.push(<TeamSideBadge key="side" teamSide={teamSide} />);
    badges.push(<PickOrderBadge key="pick" pickOrder={pickOrder} />);
  }
  return <>{badges}</>;
};

const MatchBadges: React.FC<{ match: Match; teamMatches: Map<number, TeamMatchMetadata> }> = ({
  match,
  teamMatches,
}) => {
  const teamMatch = teamMatches.get(match.id);
  const teamWon = didActiveTeamWin(teamMatch);
  const pickOrder = getPickOrder(match, teamMatch);
  const teamSide = teamMatch?.side;
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  return (
    <div className="flex items-center gap-2">
      <MatchBadgesContent
        hasError={hasError}
        isLoading={isLoading}
        teamWon={teamWon}
        teamSide={teamSide}
        pickOrder={pickOrder}
      />
    </div>
  );
};

function MatchCardFooterSection({
  match,
  teamMatches,
  preferredSite,
  isManualMatch,
  onRefreshMatch,
  onOpenEdit,
  onRemoveManual,
  onHideMatch,
}: {
  match: Match;
  teamMatches: Map<number, TeamMatchMetadata>;
  preferredSite: PreferredExternalSite;
  isManualMatch: boolean;
  onRefreshMatch: (id: number) => void;
  onOpenEdit: () => void;
  onRemoveManual: () => void;
  onHideMatch: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <MatchBadges match={match} teamMatches={teamMatches} />
      <div
        className="flex items-center gap-0.5 opacity-0 invisible @[200px]:opacity-100 @[200px]:visible"
        style={{ marginRight: '-0.2rem' }}
      >
        <ExternalSiteButton matchId={match.id} preferredSite={preferredSite} size="sm" />
        <RefreshButton onClick={() => onRefreshMatch(match.id)} ariaLabel={`Refresh match`} />
        {isManualMatch ? (
          <>
            <EditManualMatchButton onClick={onOpenEdit} ariaLabel={`Edit manual match`} />
            <RemoveManualMatchButton onClick={onRemoveManual} ariaLabel={`Remove manual match`} />
          </>
        ) : (
          <HideButton onClick={() => onHideMatch(match.id)} ariaLabel={`Hide match`} />
        )}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  selectedMatchId: number | null;
  onSelectMatch: (matchId: number) => void;
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  teamMatches: Map<number, TeamMatchMetadata>;
  onScrollToMatch?: (matchId: number) => void;
  highPerformingHeroes: Set<string>;
}

const getHeroesFromDraft = (match: Match, teamSide: 'radiant' | 'dire'): Hero[] => {
  const draftPicks = teamSide === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
  const heroes = draftPicks?.map((pick) => pick.hero).slice(0, 5) || [];
  return heroes;
};

function useMatchCardState(
  match: Match,
  teamMatches: Map<number, TeamMatchMetadata>,
): {
  config: ReturnType<typeof useConfigContext>['config'];
  appData: ReturnType<typeof useAppData>;
  selectedTeamId: string;
  showEditSheet: boolean;
  setShowEditSheet: (b: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (b: boolean) => void;
  error: string | undefined;
  setError: (s: string | undefined) => void;
  hasError: boolean;
  isManualMatch: boolean;
  currentTeamSide: 'radiant' | 'dire';
  matchHeroes: Hero[];
} {
  const { config } = useConfigContext();
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const hasError = Boolean(match.error);

  const isManualMatch = useMemo(() => {
    const selectedTeam = appData.getTeam(selectedTeamId);
    if (!selectedTeam) {
      throw new Error(`Selected team ${selectedTeamId} not found`);
    }
    const matchMetadata = selectedTeam.matches.get(match.id);
    return matchMetadata?.isManual ?? false;
  }, [match.id, appData, selectedTeamId]);

  const currentTeamSide = useMemo(() => {
    if (!isManualMatch) return 'radiant' as const;
    const selectedTeam = appData.getTeam(selectedTeamId);
    if (!selectedTeam) {
      throw new Error(`Selected team ${selectedTeamId} not found`);
    }
    const matchMetadata = selectedTeam.matches.get(match.id);
    return matchMetadata?.side || 'radiant';
  }, [isManualMatch, match.id, appData, selectedTeamId]);

  const matchHeroes = useMemo(() => {
    const teamMatch = teamMatches.get(match.id);
    if (!teamMatch?.side) return [];
    const teamPlayers = match.players[teamMatch.side] || [];
    let heroes = teamPlayers.map((player) => player.hero).filter((hero) => hero);
    if (heroes.length === 0 && match.draft) heroes = getHeroesFromDraft(match, teamMatch.side).filter((hero) => hero);
    if (heroes.length === 0) return [];
    return heroes as Hero[];
  }, [match, teamMatches]);

  return {
    config,
    appData,
    selectedTeamId,
    showEditSheet,
    setShowEditSheet,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    hasError,
    isManualMatch,
    currentTeamSide,
    matchHeroes,
  };
}

function useMatchCardHandlers(
  match: Match,
  deps: ReturnType<typeof useMatchCardState>,
  onSelectMatch: (matchId: number) => void,
) {
  const handleClick = () => {
    if (!deps.hasError) {
      onSelectMatch(match.id);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!deps.hasError && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelectMatch(match.id);
    }
  };
  return { handleClick, handleKeyDown };
}

function useMatchCardFormHandlers(
  match: Match,
  form: ReturnType<typeof useEditManualMatchForm>,
  appData: ReturnType<typeof useAppData>,
  selectedTeamId: string,
  onScrollToMatch?: (matchId: number) => void,
  onSelectMatch?: (matchId: number) => void,
) {
  const handleEditManualMatchWithForm = async (newMatchId: number) => {
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
  };

  const submitEdit = async () => {
    if (!form.isFormValid) return;
    const newId = parseInt(form.matchIdString, 10);
    await handleEditManualMatchWithForm(newId);
  };

  return { handleEditManualMatchWithForm, submitEdit };
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  teamMatches,
  onScrollToMatch,
  highPerformingHeroes,
}) => {
  const state = useMatchCardState(match, teamMatches);
  const { handleClick, handleKeyDown } = useMatchCardHandlers(match, state, onSelectMatch);

  // Add the form state management
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const selectedTeam = appData.getTeam(selectedTeamId);

  if (!selectedTeam) {
    throw new Error(`Selected team ${selectedTeamId} not found`);
  }

  const teamMatch = teamMatches.get(match.id);
  if (!teamMatch) {
    throw new Error(`Match ${match.id} has no team participation metadata`);
  }

  const form = useEditManualMatchForm(match.id, teamMatch, selectedTeam);
  const { submitEdit } = useMatchCardFormHandlers(match, form, appData, selectedTeamId, onScrollToMatch, onSelectMatch);

  return (
    <Card
      className={`transition-all duration-200 ${selectedMatchId === match.id ? 'ring-2 ring-primary bg-primary/5' : state.hasError ? 'border-destructive bg-destructive/5 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer hover:shadow-md'}`}
      onClick={handleClick}
      role="button"
      tabIndex={state.hasError ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={state.hasError ? `Match ${match.id} - Error: ${match.error}` : `Select match`}
    >
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <MatchInfo match={match} onSelectMatch={onSelectMatch} teamMatches={teamMatches} />
            <HeroAvatars
              heroes={state.matchHeroes}
              highPerformingHeroes={highPerformingHeroes}
              avatarSize={{ width: 'w-8', height: 'h-8' }}
            />
          </div>
          <MatchCardFooterSection
            match={match}
            teamMatches={teamMatches}
            preferredSite={state.config.preferredExternalSite}
            isManualMatch={state.isManualMatch}
            onRefreshMatch={onRefreshMatch}
            onOpenEdit={() => form.setShowEditSheet(true)}
            onRemoveManual={() => {
              appData.removeManualMatchFromTeam(match.id, selectedTeamId);
            }}
            onHideMatch={onHideMatch}
          />
        </div>
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
};

export const MatchListViewList: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className,
  teamMatches,
  onScrollToMatch,
  highPerformingHeroes = new Set(),
}) => {
  if (matches.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No matches found</div>
          <div className="text-sm">Try adjusting your filters or adding more matches.</div>
        </div>
      </div>
    );
  }
  return (
    <div className={className}>
      {matches.map((match) => (
        <div key={match.id} className="p-1" data-match-id={match.id}>
          <MatchCard
            match={match}
            selectedMatchId={selectedMatchId}
            onSelectMatch={onSelectMatch}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            teamMatches={teamMatches}
            onScrollToMatch={onScrollToMatch}
            highPerformingHeroes={highPerformingHeroes}
          />
        </div>
      ))}
    </div>
  );
};

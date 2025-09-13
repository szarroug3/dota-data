import React, { useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/frontend/contexts/config-context';
import { EditManualMatchButton } from '@/frontend/matches/components/stateless/common/EditManualMatchButton';
import { ExternalSiteButton } from '@/frontend/matches/components/stateless/common/ExternalSiteButton';
import { HideButton } from '@/frontend/matches/components/stateless/common/HideButton';
import { RefreshButton } from '@/frontend/matches/components/stateless/common/RefreshButton';
import { RemoveManualMatchButton } from '@/frontend/matches/components/stateless/common/RemoveManualMatchButton';
import { EditManualMatchSheet } from '@/frontend/matches/components/stateless/EditManualMatchSheet';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

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
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
  allMatches?: Match[];
  onScrollToMatch?: (matchId: number) => void;
}

function MatchInfo({ match, onSelectMatch, teamMatches }: { match: Match; onSelectMatch: (matchId: number) => void; teamMatches?: Record<number, TeamMatchParticipation> }) {
  const teamMatch = teamMatches?.[match.id];
  const opponentName = teamMatch?.opponentName || `Match ${match.id}`;
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  return (
    <div className={`min-w-0 flex-1 @[170px]:opacity-100 opacity-0 invisible @[170px]:visible ${hasError ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => { if (!hasError) { onSelectMatch(match.id); } }}>
      <div className="flex items-center gap-2">
        <div className="font-medium truncate">{hasError ? `Match ${match.id}` : isLoading ? 'Loading...' : opponentName}</div>
        {isLoading && !hasError && (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>)}
      </div>
      <div className="text-sm text-muted-foreground truncate">
        <span className="@[350px]:inline hidden">{formatDate(match.date)} • {formatDuration(match.duration)}</span>
        <span className="@[280px]:inline @[350px]:hidden hidden">{formatDate(match.date)}</span>
        <span className="@[220px]:inline @[280px]:hidden hidden">{formatDate(match.date)}</span>
        <span className="@[220px]:hidden">{formatDate(match.date)}</span>
      </div>
    </div>
  );
}

const didActiveTeamWin = (teamMatch: TeamMatchParticipation | undefined): boolean => teamMatch?.result === 'won';
const getPickOrder = (teamMatch: TeamMatchParticipation | undefined): string | null => !teamMatch?.pickOrder ? null : (teamMatch.pickOrder === 'first' ? 'First Pick' : 'Second Pick');

const MatchBadgesContent: React.FC<{ hasError: boolean; isLoading: boolean; teamWon: boolean; teamSide: 'radiant' | 'dire' | undefined; pickOrder: string | null }> = ({ hasError, isLoading, teamWon, teamSide, pickOrder }) => {
  const badges: React.ReactNode[] = [];
  if (hasError) badges.push(<ErrorBadge key="err" />);
  if (!hasError && !isLoading) {
    badges.push(<ResultBadge key="res" teamWon={teamWon} />);
    badges.push(<TeamSideBadge key="side" teamSide={teamSide} />);
    badges.push(<PickOrderBadge key="pick" pickOrder={pickOrder} />);
  }
  return <>{badges}</>;
};

const MatchBadges: React.FC<{ match: Match; teamMatches?: Record<number, TeamMatchParticipation>; }> = ({ match, teamMatches }) => {
  const teamMatch = teamMatches?.[match.id];
  const teamWon = didActiveTeamWin(teamMatch);
  const pickOrder = getPickOrder(teamMatch);
  const teamSide = (teamMatch?.side ?? undefined) as 'radiant' | 'dire' | undefined;
  const hasError = Boolean(match.error);
  const isLoading = Boolean(match.isLoading);
  return <div className="flex items-center gap-2"><MatchBadgesContent hasError={hasError} isLoading={isLoading} teamWon={teamWon} teamSide={teamSide} pickOrder={pickOrder} /></div>;
};

function MatchCardFooterSection({ match, teamMatches, preferredSite, isManualMatch, onRefreshMatch, onOpenEdit, onRemoveManual, onHideMatch }: { match: Match; teamMatches?: Record<number, TeamMatchParticipation>; preferredSite: import('@/types/contexts/config-context-value').PreferredExternalSite; isManualMatch: boolean; onRefreshMatch: (id: number) => void; onOpenEdit: () => void; onRemoveManual: () => void; onHideMatch: (id: number) => void; }) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <MatchBadges match={match} teamMatches={teamMatches} />
      <div className="flex items-center gap-0.5 opacity-0 invisible @[200px]:opacity-100 @[200px]:visible" style={{ marginRight: '-0.2rem' }}>
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

interface MatchCardProps { match: Match; selectedMatchId: number | null; onSelectMatch: (matchId: number) => void; onHideMatch: (matchId: number) => void; onRefreshMatch: (matchId: number) => void; teamMatches?: Record<number, TeamMatchParticipation>; onScrollToMatch?: (matchId: number) => void; }

const getHeroesFromDraft = (match: Match, teamSide: 'radiant' | 'dire'): Hero[] => {
  const draftPicks = teamSide === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
  const heroes = draftPicks?.map(pick => pick.hero).slice(0, 5) || [];
  return heroes;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, selectedMatchId, onSelectMatch, onHideMatch, onRefreshMatch, teamMatches, onScrollToMatch }) => {
  const { config } = useConfigContext();
  const { getSelectedTeam, removeManualMatch, editManualMatch } = useTeamContext();
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const hasError = Boolean(match.error);
  const isManualMatch = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    if (!selectedTeam?.manualMatches) return false;
    return match.id in selectedTeam.manualMatches;
  }, [match.id, getSelectedTeam]);
  const currentTeamSide = useMemo(() => {
    if (!isManualMatch) return 'radiant' as const;
    const selectedTeam = getSelectedTeam();
    return selectedTeam?.manualMatches?.[match.id]?.side || 'radiant';
  }, [isManualMatch, match.id, getSelectedTeam]);
  const matchHeroes = useMemo(() => {
    const teamMatch = teamMatches?.[match.id];
    if (!teamMatch?.side) return [];
    const teamPlayers = match.players[teamMatch.side] || [];
    let heroes = teamPlayers.map(player => player.hero).filter(hero => hero);
    if (heroes.length === 0 && match.draft) heroes = getHeroesFromDraft(match, teamMatch.side).filter(hero => hero);
    if (heroes.length === 0) return [];
    return heroes as Hero[];
  }, [match, teamMatches]);
  const handleClick = () => { if (!hasError) { onSelectMatch(match.id); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (!hasError && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectMatch(match.id); } };
  const handleEditManualMatch = async (newMatchId: number, teamSide: 'radiant' | 'dire') => {
    setShowEditSheet(false); setIsSubmitting(true); setError(undefined);
    try { await editManualMatch(match.id, newMatchId, teamSide); onScrollToMatch?.(newMatchId); onSelectMatch(newMatchId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to edit match'); console.error('Failed to edit match:', err); }
    finally { setIsSubmitting(false); }
  };
  return (
    <Card 
      className={`transition-all duration-200 ${ selectedMatchId === match.id ? 'ring-2 ring-primary bg-primary/5' : hasError ? 'border-destructive bg-destructive/5 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer hover:shadow-md' }`}
      onClick={handleClick}
      role="button"
      tabIndex={hasError ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={hasError ? `Match ${match.id} - Error: ${match.error}` : `Select match`}
    >
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <MatchInfo match={match} onSelectMatch={onSelectMatch} teamMatches={teamMatches} />
            <HeroAvatars heroes={matchHeroes} avatarSize={{ width: 'w-8', height: 'h-8' }} />
          </div>
          <MatchCardFooterSection
            match={match}
            teamMatches={teamMatches}
            preferredSite={config.preferredExternalSite}
            isManualMatch={isManualMatch}
            onRefreshMatch={onRefreshMatch}
            onOpenEdit={() => setShowEditSheet(true)}
            onRemoveManual={() => removeManualMatch(match.id)}
            onHideMatch={onHideMatch}
          />
        </div>
      </CardContent>
      <EditManualMatchSheet 
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        matchIdString={match.id.toString()}
        teamSide={currentTeamSide}
        onChangeMatchId={() => {}}
        onChangeTeamSide={() => {}}
        onSubmit={() => handleEditManualMatch(match.id, currentTeamSide as 'radiant' | 'dire')}
        isSubmitting={isSubmitting}
        error={error}
        validationError={undefined}
        duplicateError={undefined}
        isFormValid={false}
      />
    </Card>
  );
};

export const MatchListViewList: React.FC<MatchListViewProps> = ({ matches, selectedMatchId, onSelectMatch, onHideMatch, onRefreshMatch, className, teamMatches, onScrollToMatch }) => {
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
          <MatchCard match={match} selectedMatchId={selectedMatchId} onSelectMatch={onSelectMatch} onHideMatch={onHideMatch} onRefreshMatch={onRefreshMatch} teamMatches={teamMatches} onScrollToMatch={onScrollToMatch} />
        </div>
      ))}
    </div>
  );
};


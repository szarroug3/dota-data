import React, { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Hero, Match, TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';

interface HiddenMatchesModalProps {
  hiddenMatches: Match[];
  onUnhide: (matchId: number) => void;
  onClose: () => void;
  teamMatches: Map<number, TeamMatchParticipation>;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const didActiveTeamWin = (teamMatch: TeamMatchParticipation | undefined): boolean => {
  return teamMatch?.result === 'won';
};

const getPickOrder = (match: Match, teamMatch: TeamMatchParticipation | undefined): string | null => {
  if (!match.pickOrder || !teamMatch) return null;
  const pickOrder = match.pickOrder[teamMatch.side];
  return pickOrder === 'first' ? 'First Pick' : pickOrder === 'second' ? 'Second Pick' : null;
};

const getHeroesFromMatch = (match: Match, teamMatch: TeamMatchParticipation | undefined): Hero[] => {
  if (!teamMatch) return [];
  const teamPlayers = match.players[teamMatch.side] || [];
  let heroes = teamPlayers
    .map((player) => player.hero)
    .filter((hero): hero is Hero => hero !== undefined && hero !== null);
  if (heroes.length === 0 && match.draft) {
    const draftPicks = teamMatch.side === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
    heroes = draftPicks?.map((pick) => pick.hero).slice(0, 5) || [];
  }
  return heroes;
};

const isHighPerformingHero = (
  hero: Hero,
  allMatches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): boolean => {
  const heroStats: { count: number; wins: number; totalGames: number } = { count: 0, wins: 0, totalGames: 0 };
  allMatches.forEach((matchData) => {
    if (hiddenMatchIds.has(matchData.id)) return;
    const matchTeamData = teamMatches.get(matchData.id);
    if (!matchTeamData?.side) return;
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    teamPlayers.forEach((player) => {
      if (player.hero?.id === hero.id) {
        heroStats.count++;
        heroStats.totalGames++;
        if (isWin) {
          heroStats.wins++;
        }
      }
    });
  });
  return heroStats.count >= 5 && heroStats.wins / heroStats.count >= 0.6;
};

export const HiddenMatchesModal: React.FC<HiddenMatchesModalProps> = ({
  hiddenMatches,
  onUnhide,
  onClose,
  teamMatches,
}) => {
  useEffect(() => {
    if (hiddenMatches.length === 0) {
      onClose();
    }
  }, [hiddenMatches.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="bg-card dark:bg-card rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Hidden Matches</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        {hiddenMatches.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No hidden matches.</div>
        ) : (
          <div className="space-y-3">
            {hiddenMatches.map((match) => (
              <HiddenMatchCard
                key={match.id}
                match={match}
                teamMatch={teamMatches.get(match.id)}
                onUnhide={onUnhide}
                teamMatches={teamMatches}
                hiddenMatches={hiddenMatches}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function HiddenMatchCard({
  match,
  teamMatch,
  onUnhide,
  teamMatches,
  hiddenMatches,
}: {
  match: Match;
  teamMatch: TeamMatchParticipation | undefined;
  onUnhide: (id: number) => void;
  teamMatches: Map<number, TeamMatchParticipation>;
  hiddenMatches: Match[];
}) {
  const opponentName = teamMatch?.opponentName || 'Unknown';
  const teamWon = didActiveTeamWin(teamMatch);
  const pickOrder = getPickOrder(match, teamMatch);
  const teamSide = teamMatch?.side;
  const matchHeroes = getHeroesFromMatch(match, teamMatch);
  return (
    <Card className="transition-all duration-200 hover:bg-accent/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{opponentName}</div>
              <div className="text-sm text-muted-foreground truncate">
                {formatDate(match.date)} • {formatDuration(match.duration)}
              </div>
            </div>
            <div className="flex -space-x-1">
              {matchHeroes.slice(0, 5).map((hero, index) => (
                <HeroAvatar
                  key={index}
                  hero={hero}
                  avatarSize={{ width: 'w-8', height: 'h-8' }}
                  isHighPerforming={isHighPerformingHero(hero, hiddenMatches, teamMatches, new Set())}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={teamWon ? 'success' : 'default'} className="text-xs">
                {teamWon ? 'Victory' : 'Defeat'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {teamSide === 'radiant' ? 'Radiant' : 'Dire'}
              </Badge>
              {pickOrder && (
                <Badge variant="secondary" className="text-xs">
                  {pickOrder}
                </Badge>
              )}
            </div>
            <button
              onClick={() => onUnhide(match.id)}
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
            >
              Unhide
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAppData } from '@/frontend/contexts/app-data-context';
import type { Hero, Match, TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';

interface HiddenMatchesModalProps {
  hiddenMatches: Match[];
  onUnhide: (matchId: number) => void;
  onClose: () => void;
  teamMatches: Map<number, TeamMatchParticipation>;
  selectedTeamId: string;
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

export const HiddenMatchesModal: React.FC<HiddenMatchesModalProps> = ({
  hiddenMatches,
  onUnhide,
  onClose,
  teamMatches,
  selectedTeamId,
}) => {
  const appData = useAppData();
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
                matchResultLabel={appData.getMatchResultLabel(match.id, selectedTeamId)}
                pickOrderLabel={appData.getMatchPickOrderLabel(match.id, selectedTeamId)}
                matchHeroes={appData.getMatchHeroesForTeam(match.id, selectedTeamId)}
                isHighPerformingHero={(heroId) => appData.isHighPerformingHero(heroId, selectedTeamId, new Set())}
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
  matchResultLabel,
  pickOrderLabel,
  matchHeroes,
  isHighPerformingHero,
}: {
  match: Match;
  teamMatch: TeamMatchParticipation | undefined;
  onUnhide: (id: number) => void;
  matchResultLabel: string;
  pickOrderLabel: string | null;
  matchHeroes: Hero[];
  isHighPerformingHero: (heroId: number) => boolean;
}) {
  const opponentName = teamMatch?.opponentName || 'Unknown';
  const teamWon = matchResultLabel === 'Victory';
  const teamSide = teamMatch?.side;
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
                  isHighPerforming={isHighPerformingHero(hero.id)}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={teamWon ? 'success' : 'default'} className="text-xs">
                {matchResultLabel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {teamSide === 'radiant' ? 'Radiant' : 'Dire'}
              </Badge>
              {pickOrderLabel && (
                <Badge variant="secondary" className="text-xs">
                  {pickOrderLabel}
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

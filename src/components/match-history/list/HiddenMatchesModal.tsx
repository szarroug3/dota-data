import React, { useEffect } from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface HiddenMatchesModalProps {
  hiddenMatches: Match[];
  onUnhide: (matchId: number) => void;
  onClose: () => void;
  teamMatches?: Record<number, TeamMatchParticipation>;
}

// Helper functions for formatting
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
    year: 'numeric'
  });
};

// Helper function to determine if the active team won using TeamMatchParticipation
const didActiveTeamWin = (teamMatch: TeamMatchParticipation | undefined): boolean => {
  if (!teamMatch) return false;
  return teamMatch.result === 'won';
};

// Helper function to determine pick order from TeamMatchParticipation
const getPickOrder = (teamMatch: TeamMatchParticipation | undefined): string | null => {
  if (!teamMatch?.pickOrder) {
    return null;
  }
  
  return teamMatch.pickOrder === 'first' ? 'First Pick' : 'Second Pick';
};

// Helper function to get heroes from match data
const getHeroesFromMatch = (match: Match, teamMatch: TeamMatchParticipation | undefined): Hero[] => {
  if (!teamMatch?.side) {
    return [];
  }
  
  // Get heroes from the team's side
  const teamPlayers = match.players[teamMatch.side] || [];
  let heroes = teamPlayers.map(player => player.hero).filter((hero): hero is Hero => hero !== undefined && hero !== null);
  
  // Fallback: if no heroes from players, try to get them from draft data
  if (heroes.length === 0 && match.draft) {
    const draftPicks = teamMatch.side === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
    heroes = draftPicks?.map(pick => pick.hero).slice(0, 5) || [];
  }
  
  return heroes;
};

// Helper function to determine if a hero is high-performing
const isHighPerformingHero = (hero: Hero, allMatches: Match[], teamMatches: Record<number, TeamMatchParticipation>, hiddenMatchIds: Set<number>): boolean => {
  const heroStats: { count: number; wins: number; totalGames: number } = { count: 0, wins: 0, totalGames: 0 };
  
  // Aggregate hero statistics from unhidden matches
  allMatches.forEach(matchData => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchData.id)) return;
    
    const matchTeamData = teamMatches[matchData.id];
    if (!matchTeamData?.side) return;
    
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    
    teamPlayers.forEach(player => {
      if (player.hero?.id === hero.id) {
        heroStats.count++;
        heroStats.totalGames++;
        if (isWin) {
          heroStats.wins++;
        }
      }
    });
  });
  
  // High-performing criteria: 5+ games, 60%+ win rate
  return heroStats.count >= 5 && (heroStats.wins / heroStats.count) >= 0.6;
};

export const HiddenMatchesModal: React.FC<HiddenMatchesModalProps> = ({ 
  hiddenMatches, 
  onUnhide, 
  onClose,
  teamMatches 
}) => {
  // Auto-close modal when no hidden matches remain
  useEffect(() => {
    if (hiddenMatches.length === 0) {
      onClose();
    }
  }, [hiddenMatches.length, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-card dark:bg-card rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Hidden Matches</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {hiddenMatches.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No hidden matches.</div>
        ) : (
          <div className="space-y-3">
            {hiddenMatches.map(match => {
              const teamMatch = teamMatches?.[match.id];
              const opponentName = teamMatch?.opponentName || `Match ${match.id}`;
              const teamWon = didActiveTeamWin(teamMatch);
              const pickOrder = getPickOrder(teamMatch);
              const teamSide = teamMatch?.side;
              const matchHeroes = getHeroesFromMatch(match, teamMatch);
              
              return (
                <Card key={match.id} className="transition-all duration-200 hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      {/* Row 1: Opponent name + date/duration on left, avatars on right */}
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
                              isHighPerforming={isHighPerformingHero(hero, hiddenMatches, teamMatches || {}, new Set())}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Row 2: Badges on left, unhide button on right */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Result Badge */}
                          <Badge 
                            variant={teamWon ? 'success' : 'default'} 
                            className="text-xs"
                          >
                            {teamWon ? 'Victory' : 'Defeat'}
                          </Badge>
                          
                          {/* Team Side Badge */}
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {teamSide === 'radiant' ? 'Radiant' : 'Dire'}
                          </Badge>
                          
                          {/* Pick Order Badge */}
                          {pickOrder && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {pickOrder}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Unhide Button */}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 
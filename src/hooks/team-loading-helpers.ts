import { useEffect } from 'react';

import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';

export function areAllTeamMatchesLoaded(teamId: number, matchIds: number[], matchContext: MatchContextValue): boolean {
  if (matchIds.length === 0) return true;
  return matchIds.every((mid) => {
    const m = matchContext.getMatch(mid);
    return m && !m.isLoading && !m.error;
  });
}

export function areAllTeamPlayersLoaded(
  teamId: number,
  matchIds: number[],
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): boolean {
  return matchIds.every((mid) => {
    const m = matchContext.getMatch(mid);
    if (!m) return false;
    const side = m.radiant.id === teamId ? 'radiant' : m.dire.id === teamId ? 'dire' : undefined;
    if (!side) return true;
    const teamPlayers = m.players[side] || [];
    return teamPlayers.every((p) => {
      const player = playerContext.getPlayer(p.accountId);
      return Boolean(player && !player.isLoading && !(player as { error?: string }).error);
    });
  });
}

export function isTeamFullyLoaded(
  teamId: number,
  matchIds: number[],
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): boolean {
  const matchesLoaded = areAllTeamMatchesLoaded(teamId, matchIds, matchContext);
  if (!matchesLoaded) return false;
  return areAllTeamPlayersLoaded(teamId, matchIds, matchContext, playerContext);
}

export function useTeamLoadingWatcher(
  teams: Map<string, TeamData>,
  setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): void {
  useEffect(() => {
    teams.forEach((teamData, key) => {
      if (!(teamData as { isLoading?: boolean }).isLoading) return;
      const teamId = teamData.team.id;
      const matchIds = Object.keys(teamData.matches || {}).map((id) => Number(id));
      if (matchIds.length === 0) return;
      if (isTeamFullyLoaded(teamId, matchIds, matchContext, playerContext)) {
        setTeamsForLoading((prev) => {
          const m = new Map(prev);
          const current = m.get(key);
          if (current) {
            m.set(key, { ...current, isLoading: false } as TeamData);
          }
          return m;
        });
      }
    });
  }, [teams, matchContext.matches, playerContext.players, setTeamsForLoading, matchContext, playerContext]);
}

import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';

export function areAllTeamMatchesLoaded(teamId: number, matchIds: number[], matchContext: MatchContextValue): boolean {
  if (matchIds.length === 0) return true;
  return matchIds.every((mid) => {
    const m = matchContext.getMatch(mid);
    return m && !m.isLoading;
  });
}

export function areAllTeamPlayersLoaded(
  teamId: number,
  playerIds: number[],
  playerContext: PlayerContextValue,
): boolean {
  if (playerIds.length === 0) return true;
  return playerIds.every((pid) => {
    const p = playerContext.getPlayer(pid);
    return p && !p.isLoading; // Player exists and is not loading
  });
}

export function isTeamFullyLoaded(
  teamId: number,
  matchIds: number[],
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): boolean {
  return areAllTeamMatchesLoaded(teamId, matchIds, matchContext) && areAllTeamPlayersLoaded(teamId, [], playerContext);
}

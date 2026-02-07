import type { Player } from './app-data-types';

export function sortPlayersByName(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const nameA = a.profile.personaname?.toLowerCase() || '';
    const nameB = b.profile.personaname?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Filter players by team player IDs
 * Returns only players whose accountId is in the teamPlayerIds set
 * If hasActiveTeam is false, returns all players
 *
 * @param players - Array of players to filter
 * @param teamPlayerIds - Set of player account IDs for the team
 * @param hasActiveTeam - Whether there is an active team selected
 * @returns Filtered array of players
 */
export function filterPlayersByTeam(players: Player[], teamPlayerIds: Set<number>, hasActiveTeam: boolean): Player[] {
  if (!hasActiveTeam) {
    return players;
  }

  if (teamPlayerIds.size === 0) {
    return [];
  }

  return players.filter((player) => teamPlayerIds.has(player.accountId));
}

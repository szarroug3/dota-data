import type { Player, Team } from './app-data-types';
import type { StoredPlayerData } from './storage-manager';

interface ComputeTeamPlayersOptions {
  team: Team;
  playersMap: Map<number, Player>;
}

interface ComputeTeamHiddenPlayersOptions {
  team: Team;
  playersMap: Map<number, Player>;
}

export function computeTeamPlayersForDisplay({ team, playersMap }: ComputeTeamPlayersOptions): Player[] {
  const players: Player[] = [];
  for (const [, storedPlayer] of team.players) {
    if (!storedPlayer.isHidden) {
      const fullPlayer = playersMap.get(storedPlayer.accountId);
      if (fullPlayer) {
        players.push(fullPlayer);
      }
    }
  }
  return players;
}

export function sortPlayersByName(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const nameA = a.profile.personaname?.toLowerCase() || '';
    const nameB = b.profile.personaname?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

export function computeTeamHiddenPlayersForDisplay({ team, playersMap }: ComputeTeamHiddenPlayersOptions): Player[] {
  const hiddenPlayers: Player[] = [];
  for (const [, storedPlayer] of team.players) {
    if (storedPlayer.isHidden) {
      const fullPlayer = playersMap.get(storedPlayer.accountId);
      if (fullPlayer) {
        hiddenPlayers.push(fullPlayer);
      }
    }
  }
  return hiddenPlayers;
}

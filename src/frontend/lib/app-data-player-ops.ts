/**
 * Player Operations for AppData
 *
 * Handles manual player operations (add, remove, edit) for teams.
 * Extracted to reduce app-data.ts file size.
 */

import type { Player, Team } from './app-data-types';
import type { StoredPlayerData } from './storage-manager';

/**
 * Interface for AppData instance methods needed by player operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataPlayerOpsContext {
  _teams: Map<string, Team>;
  _players: Map<number, Player>;
  updateTeam(teamKey: string, updates: Partial<Team>): void;
  saveToStorage(): void;
  loadPlayer(playerId: number): Promise<Player | null>;
  updateTeamPlayersMetadata(teamKey: string, options?: { skipSave?: boolean }): void;
}

/**
 * Add a manual player to a team
 */
export async function addManualPlayerToTeam(
  appData: AppDataPlayerOpsContext,
  playerId: number,
  teamKey: string,
): Promise<Player | null> {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Add to manual players if not already present
  const existingPlayerData = team.players.get(playerId);
  if (!existingPlayerData?.isManual) {
    // Create new player data for manual player
    const newPlayerData: StoredPlayerData = {
      accountId: playerId,
      name: 'Unknown Player',
      rank: 'Unknown',
      rank_tier: 0,
      leaderboard_rank: undefined,
      games: 0,
      winRate: 0,
      topHeroes: [],
      avatar: '',
      isManual: true,
      isHidden: false,
    };

    team.players.set(playerId, newPlayerData);
    appData.updateTeam(teamKey, { players: team.players });
  }

  // Load the player data
  const player = await appData.loadPlayer(playerId);
  appData.updateTeamPlayersMetadata(teamKey);
  return player;
}

/**
 * Remove a manual player from a team
 */
export function removeManualPlayerFromTeam(appData: AppDataPlayerOpsContext, playerId: number, teamKey: string): void {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Remove from manual players
  const playerData = team.players.get(playerId);
  if (playerData?.isManual) {
    team.players.delete(playerId);
    appData.updateTeam(teamKey, { players: team.players });
    appData.updateTeamPlayersMetadata(teamKey);
  }
}

/**
 * Edit a manual player (replace old with new) - atomic operation to prevent flickering
 */
export async function editManualPlayerToTeam(
  appData: AppDataPlayerOpsContext,
  oldPlayerId: number,
  newPlayerId: number,
  teamKey: string,
): Promise<Player | null> {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Load the new player data first (don't remove old player until we have the new one)
  const newPlayer = await appData.loadPlayer(newPlayerId);
  if (!newPlayer) {
    throw new Error(`Failed to load player ${newPlayerId}`);
  }

  // Now atomically swap: remove old, add new (single state update)
  const oldPlayerData = team.players.get(oldPlayerId);
  if (oldPlayerData?.isManual) {
    team.players.delete(oldPlayerId);
  }

  // Add new manual player
  const newPlayerData: StoredPlayerData = {
    accountId: newPlayerId,
    name: newPlayer.profile.personaname || 'Unknown Player',
    rank: 'Unknown',
    rank_tier: 0,
    leaderboard_rank: undefined,
    games: 0,
    winRate: 0,
    topHeroes: [],
    avatar: newPlayer.profile.avatar || '',
    isManual: true,
    isHidden: false,
  };

  team.players.set(newPlayerId, newPlayerData);

  // Single update triggers one re-render
  appData.updateTeam(teamKey, { players: team.players });
  appData.updateTeamPlayersMetadata(teamKey);

  return newPlayer;
}

function getPlayerName(fullPlayer: Player | undefined, playerId: number): string {
  return fullPlayer?.profile.personaname || `Player ${playerId}`;
}

function getPlayerRankTier(fullPlayer: Player | undefined): number {
  return fullPlayer?.profile.rank_tier ?? 0;
}

function getPlayerGames(fullPlayer: Player | undefined): number {
  return fullPlayer?.overallStats.totalGames ?? 0;
}

function getPlayerWinRate(fullPlayer: Player | undefined): number {
  return fullPlayer?.overallStats.winRate ?? 0;
}

function getPlayerAvatar(fullPlayer: Player | undefined): string {
  return fullPlayer?.profile.avatar || '';
}

function createStoredPlayerFromFullPlayer(
  playerId: number,
  fullPlayer: Player | undefined,
  hidden: boolean,
): StoredPlayerData {
  return {
    accountId: playerId,
    name: getPlayerName(fullPlayer, playerId),
    rank: 'Unknown',
    rank_tier: getPlayerRankTier(fullPlayer),
    leaderboard_rank: fullPlayer?.profile.leaderboard_rank,
    games: getPlayerGames(fullPlayer),
    winRate: getPlayerWinRate(fullPlayer),
    topHeroes: [],
    avatar: getPlayerAvatar(fullPlayer),
    isManual: false,
    isHidden: hidden,
  };
}

function ensureStoredPlayerExists(
  appData: AppDataPlayerOpsContext,
  playerId: number,
  teamKey: string,
  hidden: boolean,
): StoredPlayerData {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  let storedPlayer = team.players.get(playerId);
  if (!storedPlayer) {
    const fullPlayer = appData._players.get(playerId);
    storedPlayer = createStoredPlayerFromFullPlayer(playerId, fullPlayer, hidden);
    team.players.set(playerId, storedPlayer);
  }

  return storedPlayer;
}

function setPlayerHiddenForTeam(appData: AppDataPlayerOpsContext, playerId: number, teamKey: string, hidden: boolean) {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  const storedPlayer = ensureStoredPlayerExists(appData, playerId, teamKey, hidden);

  if (storedPlayer.isHidden === hidden) {
    return;
  }

  team.players.set(playerId, { ...storedPlayer, isHidden: hidden });
  appData.updateTeam(teamKey, { players: team.players });
  appData.updateTeamPlayersMetadata(teamKey);
}

export function hidePlayerOnTeam(appData: AppDataPlayerOpsContext, playerId: number, teamKey: string): void {
  setPlayerHiddenForTeam(appData, playerId, teamKey, true);
}

export function unhidePlayerOnTeam(appData: AppDataPlayerOpsContext, playerId: number, teamKey: string): void {
  setPlayerHiddenForTeam(appData, playerId, teamKey, false);
}

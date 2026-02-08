/**
 * Data Operations for AppData
 *
 * Handles core data access methods (get/set) for teams, matches, and players.
 * Extracted to reduce app-data.ts file size.
 */

import type { Match, Player, Team, TeamDisplayData } from '@/frontend/lib/app-data/app-data-types';
import {
  filterPlayersByTeam as filterPlayersByTeamDerivation,
  sortPlayersByName as sortPlayersByNameDerivation,
} from '@/frontend/lib/app-data/derivations/app-data-derivations';
import { formatTeamForDisplay, formatTeamsForDisplay } from '@/frontend/lib/team/team-display-formatter';

/**
 * Interface for AppData instance methods needed by data operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataDataOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  _players: Map<number, Player>;
  updateTeamsMap(teamId: string, team: Team): void;
  deleteFromTeamsMap(teamId: string): void;
  updateMatchesRef(): void;
  updatePlayersRef(): void;
  getTeam(teamId: string): Team | undefined;
  getMatch(matchId: number): Match | undefined;
  getPlayer(accountId: number): Player | undefined;
  getTeamPlayerIds(teamKey: string): Set<number>;
  saveToStorage(): void;
}

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

/**
 * Add a new team
 */
/**
 * Create a placeholder team with basic info that can be loaded from API
 */
export function createPlaceholderTeam(
  teamId: number,
  leagueId: number,
  timeAdded?: number,
): Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'> {
  const now = Date.now();
  const teamKey = `${teamId}-${leagueId}`;

  return {
    id: teamKey,
    teamId,
    leagueId,
    name: `Team ${teamId}`,
    leagueName: `League ${leagueId}`,
    timeAdded: timeAdded || now,
    isLoading: true,
    isGlobal: false,
  };
}

export function addTeam(
  appData: AppDataDataOpsContext,
  team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>,
): void {
  const now = Date.now();
  const newTeam: Team = {
    ...team,
    createdAt: now,
    updatedAt: now,
    matches: new Map(),
    players: new Map(),
    highPerformingHeroes: new Set(),
  };
  appData.updateTeamsMap(team.id, newTeam);
}

/**
 * Remove a team
 */
export function removeTeam(appData: AppDataDataOpsContext, teamId: string): void {
  appData.deleteFromTeamsMap(teamId);
}

/**
 * Update an existing team
 */
export function updateTeam(
  appData: AppDataDataOpsContext,
  teamId: string,
  updates: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>,
): void {
  const team = appData._teams.get(teamId);
  if (!team) return;

  const updatedTeam: Team = {
    ...team,
    ...updates,
    updatedAt: Date.now(),
  };
  appData.updateTeamsMap(teamId, updatedTeam);
}

/**
 * Get a team by ID
 */
export function getTeam(appData: AppDataDataOpsContext, teamId: string): Team | undefined {
  return appData._teams.get(teamId);
}

/**
 * Get all teams as an array
 */
export function getTeams(appData: AppDataDataOpsContext): Team[] {
  return Array.from(appData._teams.values());
}

/**
 * Get team data formatted for UI display
 * Returns a minimal structure - will be extended with computed data in future steps
 */
export function getTeamDataForDisplay(appData: AppDataDataOpsContext, teamId: string): TeamDisplayData | undefined {
  const team = appData._teams.get(teamId);
  if (!team) return undefined;
  return formatTeamForDisplay(team);
}

/**
 * Get all teams formatted for UI display
 */
export function getAllTeamsForDisplay(appData: AppDataDataOpsContext): TeamDisplayData[] {
  return formatTeamsForDisplay(getTeams(appData));
}

/**
 * Get all teams formatted for UI display, sorted by most recently added to oldest
 * @returns Array of TeamDisplayData sorted by timeAdded descending (newest first)
 */
export function getAllTeamsForDisplayOrdered(appData: AppDataDataOpsContext): TeamDisplayData[] {
  const list = getAllTeamsForDisplay(appData);

  // Sort by timeAdded descending (most recently added first)
  // timeAdded is an ISO string, which sorts correctly chronologically
  return [...list].sort((a, b) => {
    if (!a || !b) return 0;
    // Compare ISO strings - newer dates come first (descending)
    return b.timeAdded.localeCompare(a.timeAdded);
  });
}

// ============================================================================
// MATCH OPERATIONS
// ============================================================================

/**
 * Add a new match
 */
export function addMatch(appData: AppDataDataOpsContext, match: Match): void {
  appData._matches.set(match.id, match);
  appData.updateMatchesRef();
  appData.saveToStorage();
}

/**
 * Remove a match
 */
export function removeMatch(appData: AppDataDataOpsContext, matchId: number): void {
  appData._matches.delete(matchId);
  appData.updateMatchesRef();
}

/**
 * Update a match
 */
export function updateMatch(
  appData: AppDataDataOpsContext,
  matchId: number,
  updates: Partial<Match>,
  options?: { skipSave?: boolean },
): void {
  const match = appData.getMatch(matchId);
  if (!match) return;

  // Apply updates
  Object.assign(match, updates);

  // Update the match in the map
  appData._matches.set(matchId, match);
  appData.updateMatchesRef();

  // Save to storage unless skipSave is true
  if (!options?.skipSave) {
    appData.saveToStorage();
  }
}

/**
 * Get a match by ID
 */
export function getMatch(appData: AppDataDataOpsContext, matchId: number): Match | undefined {
  return appData._matches.get(matchId);
}

/**
 * Get all matches as an array
 */
export function getMatches(appData: AppDataDataOpsContext): Match[] {
  return Array.from(appData._matches.values());
}

// ============================================================================
// PLAYER OPERATIONS
// ============================================================================

/**
 * Add a new player
 */
export function addPlayer(appData: AppDataDataOpsContext, player: Player): void {
  appData._players.set(player.accountId, player);
  appData.updatePlayersRef();
  appData.saveToStorage();
}

/**
 * Remove a player
 */
export function removePlayer(appData: AppDataDataOpsContext, accountId: number): void {
  appData._players.delete(accountId);
  appData.updatePlayersRef();
}

/**
 * Update a player
 */
export function updatePlayer(
  appData: AppDataDataOpsContext,
  accountId: number,
  updates: Partial<Player>,
  options?: { skipSave?: boolean },
): void {
  const player = appData.getPlayer(accountId);
  if (!player) return;

  // Apply updates
  Object.assign(player, updates);

  // Update the player in the map
  appData._players.set(accountId, player);
  appData.updatePlayersRef();

  // Save to storage unless skipSave is true
  if (!options?.skipSave) {
    appData.saveToStorage();
  }
}

/**
 * Get a player by account ID
 */
export function getPlayer(appData: AppDataDataOpsContext, accountId: number): Player | undefined {
  return appData._players.get(accountId);
}

/**
 * Get all players as an array
 */
export function getPlayers(appData: AppDataDataOpsContext): Player[] {
  return Array.from(appData._players.values());
}

// ============================================================================
// PLAYER SORTING & FILTERING
// ============================================================================

/**
 * Sort players by name (alphabetically)
 * Returns a new sorted array without modifying the original
 *
 * @param appData - AppData context (unused but required for consistency)
 * @param players - Array of players to sort
 * @returns Sorted array of players
 */
export function sortPlayersByName(appData: AppDataDataOpsContext, players: Player[]): Player[] {
  return sortPlayersByNameDerivation(players);
}

/**
 * Filter players by team
 * Returns only players whose accountId is in the team's player IDs
 * If no team is selected, returns all players
 *
 * @param appData - AppData context
 * @param players - Array of players to filter
 * @param teamKey - The team key (teamId-leagueId), or null/undefined for no team
 * @returns Filtered array of players
 */
export function filterPlayersByTeam(
  appData: AppDataDataOpsContext,
  players: Player[],
  teamKey: string | null | undefined,
): Player[] {
  if (!teamKey) {
    return players;
  }

  const teamPlayerIds = appData.getTeamPlayerIds(teamKey);
  if (teamPlayerIds.size === 0) {
    return [];
  }

  return filterPlayersByTeamDerivation(players, teamPlayerIds, true);
}

// ============================================================================
// HIDDEN MATCH OPERATIONS
// ============================================================================

/**
 * Hide a match for a specific team
 */
export function hideMatch(appData: AppDataDataOpsContext, teamId: string, matchId: number): void {
  const team = appData.getTeam(teamId);
  if (!team) {
    console.error(`Cannot hide match ${matchId}: team ${teamId} not found`);
    return;
  }

  const matchMetadata = team.matches.get(matchId);
  if (matchMetadata && !matchMetadata.isHidden) {
    const updatedTeam = {
      ...team,
      matches: new Map(team.matches.set(matchId, { ...matchMetadata, isHidden: true })),
      updatedAt: Date.now(),
    };
    appData.updateTeamsMap(teamId, updatedTeam);
    appData.saveToStorage();
  }
}

/**
 * Unhide a match for a specific team
 */
export function unhideMatch(appData: AppDataDataOpsContext, teamId: string, matchId: number): void {
  const team = appData.getTeam(teamId);
  if (!team) {
    console.error(`Cannot unhide match ${matchId}: team ${teamId} not found`);
    return;
  }

  const matchMetadata = team.matches.get(matchId);
  if (matchMetadata && matchMetadata.isHidden) {
    const updatedTeam = {
      ...team,
      matches: new Map(team.matches.set(matchId, { ...matchMetadata, isHidden: false })),
      updatedAt: Date.now(),
    };
    appData.updateTeamsMap(teamId, updatedTeam);
    appData.saveToStorage();
  }
}

/**
 * Get hidden matches for a specific team
 */
export function getHiddenMatches(appData: AppDataDataOpsContext, teamId: string): Match[] {
  const team = appData.getTeam(teamId);
  if (!team) {
    return [];
  }

  const hiddenMatches: Match[] = [];
  team.matches.forEach((metadata, matchId) => {
    if (metadata.isHidden) {
      const match = appData.getMatch(matchId);
      if (match) {
        hiddenMatches.push(match);
      }
    }
  });

  return hiddenMatches;
}

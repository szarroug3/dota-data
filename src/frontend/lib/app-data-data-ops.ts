/**
 * Data Operations for AppData
 *
 * Handles core data access methods (get/set) for teams, matches, and players.
 * Extracted to reduce app-data.ts file size.
 */

import { computeTeamPerformanceSummary } from './app-data-derivations';
import type { Match, Player, TeamDisplayData, Team } from './app-data-types';
import { formatTeamForDisplay, formatTeamsForDisplay } from './team-display-formatter';

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
  const performance = computeTeamPerformanceSummary({ team, matchesMap: appData._matches });
  return formatTeamForDisplay(team, performance);
}

/**
 * Get all teams formatted for UI display
 */
export function getAllTeamsForDisplay(appData: AppDataDataOpsContext): TeamDisplayData[] {
  const performances = new Map<string, ReturnType<typeof computeTeamPerformanceSummary>>();
  appData._teams.forEach((team, teamId) => {
    performances.set(teamId, computeTeamPerformanceSummary({ team, matchesMap: appData._matches }));
  });

  return formatTeamsForDisplay(getTeams(appData), performances);
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

/**
 * Update an existing player with partial changes
 */
export function updatePlayer(
  appData: AppDataDataOpsContext,
  accountId: number,
  updates: Partial<Player>,
  options: { skipSave?: boolean } = {},
): void {
  const existing = appData._players.get(accountId);
  if (!existing) {
    return;
  }

  const updated: Player = {
    ...existing,
    ...updates,
    profile: { ...existing.profile, ...(updates.profile ?? {}) },
    overallStats: { ...existing.overallStats, ...(updates.overallStats ?? {}) },
    heroStats: updates.heroStats ?? existing.heroStats,
    recentMatchIds: updates.recentMatchIds ?? existing.recentMatchIds,
    updatedAt: Date.now(),
  };

  appData._players.set(accountId, updated);
  appData.updatePlayersRef();
  if (!options.skipSave) {
    appData.saveToStorage();
  }
}

export function updateMatch(
  appData: AppDataDataOpsContext,
  matchId: number,
  updates: Partial<Match>,
  options: { skipSave?: boolean } = {},
): void {
  const existing = appData._matches.get(matchId);
  if (!existing) {
    return;
  }

  // For simple updates like isLoading and error, we can use a simpler merge
  const updated: Match = {
    ...existing,
    ...updates,
  };

  // Only merge nested objects if they're being updated
  if (updates.radiant) {
    updated.radiant = { ...existing.radiant, ...updates.radiant };
  }
  if (updates.dire) {
    updated.dire = { ...existing.dire, ...updates.dire };
  }
  if (updates.draft) {
    updated.draft = { ...existing.draft, ...updates.draft };
  }
  if (updates.players) {
    updated.players = { ...existing.players, ...updates.players };
  }
  if (updates.statistics) {
    updated.statistics = { ...existing.statistics, ...updates.statistics };
  }

  appData._matches.set(matchId, updated);
  appData.updateMatchesRef();
  if (!options.skipSave) {
    appData.saveToStorage();
  }
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

/**
 * CRUD Operations for AppData
 *
 * Extracted from app-data.ts to reduce file size.
 * Contains all basic CRUD operations for teams, matches, and players.
 */

import * as DataOps from './app-data-data-ops';
import {
  computeTeamHeroSummaryForMatches,
  computeTeamHiddenMatchesForDisplay,
  computeTeamMatchFilters,
  computeTeamMatchesForDisplay,
  computeTeamPlayersForDisplay,
  computeTeamHiddenPlayersForDisplay,
  sortPlayersByName,
} from './app-data-derivations';
import type {
  Hero,
  Item,
  League,
  LeagueMatchesCache,
  Match,
  MatchFilters,
  MatchFiltersResult,
  Player,
  Team,
  TeamDisplayData,
  TeamHeroSummary,
} from './app-data-types';
import type { StoredMatchData } from './storage-manager';

/**
 * Interface for AppData instance methods needed by CRUD operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataCrudOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  _players: Map<number, Player>;
  heroes: Map<number, Hero>;
  items: Map<number, Item>;
  leagues: Map<number, League>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  getTeamPlayerIds(teamKey: string): Set<number>;
  getTeamMatchesMetadata(teamKey: string): Map<number, StoredMatchData>;
  // DataOps interface methods
  getTeam(teamId: string): Team | undefined;
  getMatch(matchId: number): Match | undefined;
  getPlayer(accountId: number): Player | undefined;
  saveToStorage(): void;
  updateTeamsMap(teamId: string, team: Team): void;
  deleteFromTeamsMap(teamId: string): void;
  updateMatchesRef(): void;
  updatePlayersRef(): void;
}

/**
 * Team CRUD Operations
 */
export function addTeam(
  appData: AppDataCrudOpsContext,
  team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>,
): void {
  DataOps.addTeam(appData, team);
}

export function removeTeam(appData: AppDataCrudOpsContext, teamId: string): void {
  DataOps.removeTeam(appData, teamId);
}

export function updateTeam(
  appData: AppDataCrudOpsContext,
  teamId: string,
  updates: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>,
): void {
  DataOps.updateTeam(appData, teamId, updates);
}

export function getTeam(appData: AppDataCrudOpsContext, teamId: string): Team | undefined {
  return DataOps.getTeam(appData, teamId);
}

export function getTeams(appData: AppDataCrudOpsContext): Team[] {
  return DataOps.getTeams(appData);
}

export function getTeamPlayersForDisplay(appData: AppDataCrudOpsContext, teamKey: string): Player[] {
  const team = getTeam(appData, teamKey);
  if (!team) {
    return Array.from(appData._players.values());
  }

  return computeTeamPlayersForDisplay({
    team,
    playersMap: appData._players,
  });
}

export function getTeamPlayersSortedForDisplay(appData: AppDataCrudOpsContext, teamKey: string): Player[] {
  const players = getTeamPlayersForDisplay(appData, teamKey);
  return sortPlayersByName(players);
}

export function getTeamHiddenPlayersForDisplay(appData: AppDataCrudOpsContext, teamKey: string): Player[] {
  const team = getTeam(appData, teamKey);
  if (!team) {
    return [];
  }

  return computeTeamHiddenPlayersForDisplay({
    team,
    playersMap: appData._players,
  });
}

export function getTeamHiddenMatchesForDisplay(appData: AppDataCrudOpsContext, teamKey: string): Match[] {
  const team = getTeam(appData, teamKey);
  if (!team) {
    return [];
  }

  return computeTeamHiddenMatchesForDisplay({
    team,
    matchesMap: appData._matches,
  });
}

export function getTeamMatchesForDisplay(appData: AppDataCrudOpsContext, teamKey: string): Match[] {
  const team = getTeam(appData, teamKey);
  if (!team) {
    return [];
  }

  return computeTeamMatchesForDisplay({
    team,
    matchesMap: appData._matches,
  });
}

export function getTeamMatchFilters(
  appData: AppDataCrudOpsContext,
  teamKey: string,
  filters: MatchFilters,
  hiddenMatchIds: Set<number>,
): MatchFiltersResult {
  return computeTeamMatchFilters({
    matches: getTeamMatchesForDisplay(appData, teamKey),
    teamMatches: appData.getTeamMatchesMetadata(teamKey),
    filters,
    hiddenMatchIds,
  });
}

export function getTeamHeroSummaryForMatches(
  appData: AppDataCrudOpsContext,
  teamKey: string,
  matches: Match[],
): TeamHeroSummary {
  return computeTeamHeroSummaryForMatches({
    matches,
    teamMatches: appData.getTeamMatchesMetadata(teamKey),
    heroesMap: appData.heroes,
  });
}

export function getTeamDataForDisplay(appData: AppDataCrudOpsContext, teamId: string): TeamDisplayData | undefined {
  return DataOps.getTeamDataForDisplay(appData, teamId);
}

export function getAllTeamsForDisplay(appData: AppDataCrudOpsContext): TeamDisplayData[] {
  return DataOps.getAllTeamsForDisplay(appData);
}

/**
 * Match CRUD Operations
 */
export function addMatch(appData: AppDataCrudOpsContext, match: Match): void {
  DataOps.addMatch(appData, match);
}

export function removeMatch(appData: AppDataCrudOpsContext, matchId: number): void {
  DataOps.removeMatch(appData, matchId);
}

export function updateMatch(
  appData: AppDataCrudOpsContext,
  matchId: number,
  updates: Partial<Match>,
  options?: { skipSave?: boolean },
): void {
  DataOps.updateMatch(appData, matchId, updates, options);
}

export function getMatch(appData: AppDataCrudOpsContext, matchId: number): Match | undefined {
  return DataOps.getMatch(appData, matchId);
}

export function getMatches(appData: AppDataCrudOpsContext): Match[] {
  return DataOps.getMatches(appData);
}

/**
 * Player CRUD Operations
 */
export function addPlayer(appData: AppDataCrudOpsContext, player: Player): void {
  DataOps.addPlayer(appData, player);
}

export function removePlayer(appData: AppDataCrudOpsContext, accountId: number): void {
  DataOps.removePlayer(appData, accountId);
}

export function getPlayer(appData: AppDataCrudOpsContext, accountId: number): Player | undefined {
  return DataOps.getPlayer(appData, accountId);
}

export function updatePlayer(
  appData: AppDataCrudOpsContext,
  accountId: number,
  updates: Partial<Player>,
  options?: { skipSave?: boolean },
): void {
  DataOps.updatePlayer(appData, accountId, updates, options);
}

export function getPlayers(appData: AppDataCrudOpsContext): Player[] {
  return DataOps.getPlayers(appData);
}

/**
 * Statistics Operations for AppData
 *
 * Handles all statistics calculation methods for players, heroes, and teams.
 * Extracted to reduce app-data.ts file size.
 */

import { processPlayerDetailedStats } from '@/utils/player-statistics';
import type { PlayerDetailedStats } from '@/utils/player-statistics';

import type { Hero, Match, Player, Team } from './app-data-types';
import {
  calculatePlayerStats,
  calculateHeroStats,
  calculateTeamPlayerStats,
  getPlayerParticipatedMatches as getPlayerParticipatedMatchesFromCalculator,
  filterPlayerMatches,
} from './player-statistics-calculator';
import type { PlayerStats, HeroStats, TeamPlayerStats, DateRangeSelection } from './player-statistics-calculator';
import type { StoredMatchData } from './storage-manager';

/**
 * Interface for AppData instance methods needed by statistics operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataStatisticsOpsContext {
  _teams: Map<string, Team>;
  getPlayer(playerId: number): Player | undefined;
  getMatch(matchId: number): Match | undefined;
  heroes: Map<number, Hero>;
  getTeam(teamKey: string): Team | undefined;
}

export interface TeamPlayerOverview {
  teamStats: TeamPlayerStats | null;
  detailedStats: PlayerDetailedStats | null;
}

/**
 * Get player statistics (cached)
 * Calculates comprehensive player stats from all matches
 */
export function getPlayerStats(appData: AppDataStatisticsOpsContext, playerId: number): PlayerStats {
  const player = appData.getPlayer(playerId);
  if (!player) {
    return {
      totalGames: 0,
      totalWins: 0,
      winRate: 0,
      averageKDA: 0,
      averageGPM: 0,
      averageXPM: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageAssists: 0,
    };
  }

  // Get all matches for this player
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  return calculatePlayerStats(playerId, matches);
}

/**
 * Get hero statistics for a player (cached)
 * Calculates hero-specific stats for a player
 */
export function getPlayerHeroStats(appData: AppDataStatisticsOpsContext, playerId: number): Map<number, HeroStats> {
  const player = appData.getPlayer(playerId);
  if (!player) {
    return new Map();
  }

  // Get all matches for this player
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  return calculateHeroStats(playerId, matches, appData.heroes);
}

/**
 * Get team-specific player statistics (cached)
 * Calculates player stats within a specific team context
 */
export function getTeamPlayerStats(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  teamKey: string,
): TeamPlayerStats {
  const player = appData.getPlayer(playerId);
  if (!player) {
    return {
      totalGames: 0,
      totalWins: 0,
      winRate: 0,
      averageKDA: 0,
      averageGPM: 0,
      averageXPM: 0,
    };
  }

  // Get all matches for this player
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  // Create team matches map for this team
  const team = appData._teams.get(teamKey);
  const teamMatches = team?.matches || new Map<number, StoredMatchData>();

  return calculateTeamPlayerStats(playerId, teamKey, matches, teamMatches);
}

/**
 * Get player participated matches for a team
 * Returns matches where the player participated within a team context
 */
export function getPlayerParticipatedMatches(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  teamKey: string,
): Match[] {
  const player = appData.getPlayer(playerId);
  if (!player) {
    return [];
  }

  // Get all matches for this player
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  // Create team matches map for this team
  const team = appData._teams.get(teamKey);
  const teamMatches = team?.matches || new Map<number, StoredMatchData>();

  return getPlayerParticipatedMatchesFromCalculator(matches, teamMatches, playerId);
}

/**
 * Filter player matches by date range
 * Returns matches filtered by the specified date range
 */
export function filterPlayerMatchesByDateRange(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  dateRange: DateRangeSelection,
): Match[] {
  const player = appData.getPlayer(playerId);
  if (!player) {
    return [];
  }

  // Get all matches for this player
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  return filterPlayerMatches(matches, dateRange);
}

export function getTeamPlayerOverview(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  teamKey: string,
): TeamPlayerOverview {
  const teamStatsRaw = getTeamPlayerStats(appData, playerId, teamKey);
  const matches = getPlayerParticipatedMatches(appData, playerId, teamKey);
  const player = appData.getPlayer(playerId);

  const teamStats = teamStatsRaw.totalGames > 0 ? teamStatsRaw : null;

  if (!player || matches.length === 0) {
    return {
      teamStats,
      detailedStats: null,
    };
  }

  const heroesRecord = Object.fromEntries(
    Array.from(appData.heroes.entries()).map(([id, hero]) => [id.toString(), hero]),
  );

  const detailedStats = processPlayerDetailedStats(player, matches, heroesRecord);

  return {
    teamStats,
    detailedStats,
  };
}

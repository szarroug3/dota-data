/**
 * Statistics Operations for AppData
 *
 * Handles all statistics calculation methods for players, heroes, and teams.
 * Extracted to reduce app-data.ts file size.
 */

import * as ParticipationHelpers from '@/frontend/lib/app-data/app-data-participation-helpers';
import type {
  Hero,
  LeagueMatchesCache,
  Match,
  Player,
  Team,
  TeamMatchParticipation,
} from '@/frontend/lib/app-data/app-data-types';
import {
  calculatePlayerStats,
  calculateHeroStats,
  calculateTeamPlayerStats,
  getPlayerParticipatedMatches as getPlayerParticipatedMatchesFromCalculator,
  filterPlayerMatches,
  sortHeroStats,
} from '@/frontend/lib/player/player-statistics-calculator';
import type {
  PlayerStats,
  HeroStats,
  TeamPlayerStats,
  DateRangeSelection,
} from '@/frontend/lib/player/player-statistics-calculator';

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
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
}

export type PlayerRecentHeroSortKey = 'games' | 'winRate' | 'name';
export type PlayerRecentHeroSortDirection = 'asc' | 'desc';
export type PlayerRecentHeroDateRange = 'all' | '7days' | '30days' | 'custom';
export type PlayerRecentHeroCustomRange = { start: string | null; end: string | null };

export type PlayerRecentHeroRow = { hero: Hero; games: number; winRate: number };
export type PlayerRecentHeroRowsResult = { rows: PlayerRecentHeroRow[]; totalGames: number };

export type PlayerTopHeroSummaryRow = { hero: Hero; games: number; wins: number; winRate: number };

export type TeamRoleStats = { role: string; games: number; wins: number; winRate: number };
export type TeamPlayerDetailStats = { teamRoles: TeamRoleStats[]; teamHeroes: HeroStats[] };

function resolveTeamSide(
  teamId: number,
  match: Match,
  matchInfo: { radiantTeamId?: number; direTeamId?: number } | undefined,
): 'radiant' | 'dire' {
  if (match.radiant?.id === teamId) return 'radiant';
  if (match.dire?.id === teamId) return 'dire';
  return ParticipationHelpers.determineTeamSide(teamId, matchInfo);
}

function getTeamMatchesContext(
  appData: AppDataStatisticsOpsContext,
  teamKey: string,
): {
  team: Team | null;
  matches: Match[];
  teamMatches: Map<number, TeamMatchParticipation>;
} {
  const team = appData._teams.get(teamKey) ?? null;
  if (!team) {
    return { team: null, matches: [], teamMatches: new Map() };
  }

  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
  const storedMatchIds = Array.from(team.matches.keys());
  const allTeamMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

  const matches: Match[] = [];
  const teamMatches = new Map<number, TeamMatchParticipation>();

  for (const matchId of allTeamMatchIds) {
    const match = appData.getMatch(matchId);
    if (!match) {
      continue;
    }
    matches.push(match);

    const storedData = team.matches.get(matchId);
    if (storedData) {
      teamMatches.set(matchId, storedData);
      continue;
    }

    const matchInfo = leagueCache?.matches.get(matchId);
    const side = resolveTeamSide(team.teamId, match, matchInfo);
    const result = ParticipationHelpers.getMatchResult(side, match);
    teamMatches.set(matchId, {
      side,
      result: result === 'won' ? 'won' : 'lost',
      opponentName: ParticipationHelpers.getOpponentName(side, match),
      isManual: false,
      isHidden: false,
    });
  }

  return { team, matches, teamMatches };
}

function getPlayerRoleInfo(match: Match, playerId: number): { role: string; isWin: boolean } | null {
  const radiantPlayer = match.players.radiant.find((player) => player.accountId === playerId);
  if (radiantPlayer) {
    if (!radiantPlayer.role?.role) {
      return null;
    }
    return {
      role: radiantPlayer.role.role,
      isWin: match.result === 'radiant',
    };
  }

  const direPlayer = match.players.dire.find((player) => player.accountId === playerId);
  if (direPlayer) {
    if (!direPlayer.role?.role) {
      return null;
    }
    return {
      role: direPlayer.role.role,
      isWin: match.result === 'dire',
    };
  }

  return null;
}

function buildTeamRoleStats(matches: Match[], playerId: number): TeamRoleStats[] {
  const roleStats = new Map<string, { games: number; wins: number }>();

  for (const match of matches) {
    const roleInfo = getPlayerRoleInfo(match, playerId);
    if (!roleInfo) {
      continue;
    }

    const existing = roleStats.get(roleInfo.role) ?? { games: 0, wins: 0 };
    roleStats.set(roleInfo.role, {
      games: existing.games + 1,
      wins: existing.wins + (roleInfo.isWin ? 1 : 0),
    });
  }

  return Array.from(roleStats.entries())
    .map(([role, stats]) => ({
      role,
      games: stats.games,
      wins: stats.wins,
      winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.games !== a.games) {
        return b.games - a.games;
      }
      return a.role.localeCompare(b.role);
    });
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

  // Matches are computed from loaded match payloads only; missing matches
  // in recentMatchIds will undercount stats until they load.
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

  // Matches are computed from loaded match payloads only; missing matches
  // in recentMatchIds will undercount stats until they load.
  const matches = player.recentMatchIds
    .map((matchId) => appData.getMatch(matchId))
    .filter((match): match is Match => match != null);

  return calculateHeroStats(playerId, matches, appData.heroes);
}

/**
 * Get hero statistics for a player from specific matches
 * Calculates hero-specific stats from the provided matches array
 * Returns an array of HeroStats sorted by games (descending)
 *
 * @param playerId - The player's account ID
 * @param matches - Array of matches to analyze
 * @returns Array of HeroStats
 */
export function getPlayerHeroStatsForMatches(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  matches: Match[],
): HeroStats[] {
  const heroStatsMap = calculateHeroStats(playerId, matches, appData.heroes);
  return sortHeroStats(Array.from(heroStatsMap.values()), 'games', 'desc');
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

  const { team, matches, teamMatches } = getTeamMatchesContext(appData, teamKey);
  if (!team) {
    return {
      totalGames: 0,
      totalWins: 0,
      winRate: 0,
      averageKDA: 0,
      averageGPM: 0,
      averageXPM: 0,
    };
  }

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

  const { team, matches, teamMatches } = getTeamMatchesContext(appData, teamKey);
  if (!team) {
    return [];
  }

  return getPlayerParticipatedMatchesFromCalculator(matches, teamMatches, playerId);
}

/**
 * Get team role stats for a player
 * Returns display-ready role stats sorted by games desc
 */
export function getTeamRoleStats(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  teamKey: string,
): TeamRoleStats[] {
  const teamPlayerMatches = getPlayerParticipatedMatches(appData, playerId, teamKey);
  if (teamPlayerMatches.length === 0) {
    return [];
  }

  return buildTeamRoleStats(teamPlayerMatches, playerId);
}

/**
 * Get team-scoped detailed stats for a player
 * Returns role stats and hero stats sorted by games desc
 */
export function getTeamPlayerDetailStats(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  teamKey: string,
): TeamPlayerDetailStats {
  const teamPlayerMatches = getPlayerParticipatedMatches(appData, playerId, teamKey);
  if (teamPlayerMatches.length === 0) {
    return { teamRoles: [], teamHeroes: [] };
  }

  const teamHeroes = getPlayerHeroStatsForMatches(appData, playerId, teamPlayerMatches);
  const teamRoles = buildTeamRoleStats(teamPlayerMatches, playerId);

  return { teamRoles, teamHeroes };
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

type PlayerRecentMatch = NonNullable<Player['recentMatches']>[number];

function getRecentMatchCutoffs(
  selection: PlayerRecentHeroDateRange,
  custom: PlayerRecentHeroCustomRange,
): { startCutoffSec: number | null; endCutoffSec: number | null } {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1);

  const yesterdayEndSec = Math.floor(yesterdayEnd.getTime() / 1000);

  if (selection === 'all') {
    return { startCutoffSec: null, endCutoffSec: null };
  }

  if (selection === '7days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 7);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
    };
  }

  if (selection === '30days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 30);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
    };
  }

  let startCutoffSec: number | null = null;
  let endCutoffSec: number | null = null;

  if (custom.start) {
    const startDate = new Date(custom.start);
    startDate.setHours(0, 0, 0, 0);
    startCutoffSec = Math.floor(startDate.getTime() / 1000);
  }

  if (custom.end) {
    const endDate = new Date(custom.end);
    endDate.setHours(23, 59, 59, 999);
    endCutoffSec = Math.floor(endDate.getTime() / 1000);
  }

  return { startCutoffSec, endCutoffSec };
}

function filterRecentMatchesByDateRange(
  matches: PlayerRecentMatch[],
  cutoffs: { startCutoffSec: number | null; endCutoffSec: number | null },
): PlayerRecentMatch[] {
  const { startCutoffSec, endCutoffSec } = cutoffs;
  return matches.filter((match) => {
    if (!match || match.start_time === undefined) return false;

    if (startCutoffSec !== null && match.start_time < startCutoffSec) return false;
    if (endCutoffSec !== null && match.start_time > endCutoffSec) return false;
    return true;
  });
}

function buildRecentHeroRows(filtered: PlayerRecentMatch[], heroesMap: Map<number, Hero>): PlayerRecentHeroRow[] {
  const byHero: Record<number, { games: number; wins: number }> = {};
  for (const match of filtered) {
    const heroId = match.hero_id;
    const isRadiantPlayer = match.player_slot < 128;
    const isWin = match.radiant_win ? isRadiantPlayer : !isRadiantPlayer;
    if (!byHero[heroId]) byHero[heroId] = { games: 0, wins: 0 };
    byHero[heroId].games += 1;
    if (isWin) byHero[heroId].wins += 1;
  }

  return Object.entries(byHero).map(([heroIdStr, agg]) => {
    const heroId = parseInt(heroIdStr, 10);
    const hero =
      heroesMap.get(heroId) ||
      ({
        id: heroId,
        name: `npc_dota_hero_${heroId}`,
        localizedName: `Hero ${heroId}`,
        primaryAttribute: 'strength',
        attackType: 'melee',
        roles: [],
        imageUrl: '',
      } as Hero);
    const winRate = agg.games > 0 ? (agg.wins / agg.games) * 100 : 0;
    return { hero, games: agg.games, winRate };
  });
}

function resolveHeroSummaryHero(heroId: number, heroesMap: Map<number, Hero>): Hero {
  return (
    heroesMap.get(heroId) || {
      id: heroId,
      name: `npc_dota_hero_${heroId}`,
      localizedName: `Hero ${heroId}`,
      primaryAttribute: 'strength',
      attackType: 'melee',
      roles: [],
      imageUrl: '',
    }
  );
}

function sortTopHeroSummaryRows(rows: PlayerTopHeroSummaryRow[]): PlayerTopHeroSummaryRow[] {
  return [...rows].sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    const nameCompare = a.hero.localizedName.localeCompare(b.hero.localizedName);
    if (nameCompare !== 0) return nameCompare;
    return a.hero.id - b.hero.id;
  });
}

function sortRecentHeroRows(
  rows: PlayerRecentHeroRow[],
  sortKey: PlayerRecentHeroSortKey,
  sortDirection: PlayerRecentHeroSortDirection,
): PlayerRecentHeroRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'name') return a.hero.localizedName.localeCompare(b.hero.localizedName);
    if (sortKey === 'games') return b.games - a.games;
    return b.winRate - a.winRate;
  });
  return sortDirection === 'asc' ? sorted.reverse() : sorted;
}

export function getPlayerRecentHeroRows(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  dateRange: PlayerRecentHeroDateRange,
  customRange: PlayerRecentHeroCustomRange,
  sortKey: PlayerRecentHeroSortKey,
  sortDirection: PlayerRecentHeroSortDirection,
): PlayerRecentHeroRowsResult {
  const player = appData.getPlayer(playerId);
  if (!player?.recentMatches?.length) {
    return { rows: [], totalGames: 0 };
  }

  const cutoffs = getRecentMatchCutoffs(dateRange, customRange);
  const filteredMatches = filterRecentMatchesByDateRange(player.recentMatches, cutoffs);
  const rows = buildRecentHeroRows(filteredMatches, appData.heroes);
  const sortedRows = sortRecentHeroRows(rows, sortKey, sortDirection);

  return { rows: sortedRows, totalGames: filteredMatches.length };
}

export function getPlayerTopHeroesSummary(
  appData: AppDataStatisticsOpsContext,
  playerId: number,
  limit = 5,
): PlayerTopHeroSummaryRow[] {
  const player = appData.getPlayer(playerId);
  if (!player?.heroStats?.length) {
    return [];
  }

  const normalizedLimit = Math.max(0, Math.floor(limit));
  if (normalizedLimit === 0) {
    return [];
  }

  const rows = player.heroStats.map((heroStat) => {
    const hero = resolveHeroSummaryHero(heroStat.heroId, appData.heroes);
    const winRate = heroStat.games > 0 ? (heroStat.wins / heroStat.games) * 100 : 0;
    return {
      hero,
      games: heroStat.games,
      wins: heroStat.wins,
      winRate,
    };
  });

  return sortTopHeroSummaryRows(rows).slice(0, normalizedLimit);
}

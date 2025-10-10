/**
 * Player Statistics Calculator
 *
 * Centralized calculations for all player-related statistics.
 * This replaces scattered calculations in UI components with a single source of truth.
 */

import type { Hero, Match, TeamMatchParticipation } from './app-data-types';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
}

export interface HeroStats {
  hero: Hero;
  games: number;
  wins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  roles: string[];
}

export interface TeamPlayerStats {
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export interface DateRangeSelection {
  type: 'all' | '7days' | '30days' | 'custom';
  customStart?: string | null;
  customEnd?: string | null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate KDA ratio
 */
function calculateKDA(kills: number, deaths: number, assists: number): number {
  return deaths > 0 ? (kills + assists) / deaths : kills + assists;
}

/**
 * Find player in match by account ID
 */
function findPlayerInMatch(
  match: Match,
  accountId: number,
): {
  heroId: number;
  isWin: boolean;
  stats: { kills?: number; deaths?: number; assists?: number; gpm?: number; xpm?: number };
} | null {
  // Check radiant players
  const radiantPlayer = match.players.radiant.find((p) => p.accountId === accountId);
  if (radiantPlayer) {
    return {
      heroId: radiantPlayer.hero.id,
      isWin: match.result === 'radiant',
      stats: radiantPlayer.stats,
    };
  }

  // Check dire players
  const direPlayer = match.players.dire.find((p) => p.accountId === accountId);
  if (direPlayer) {
    return {
      heroId: direPlayer.hero.id,
      isWin: match.result === 'dire',
      stats: direPlayer.stats,
    };
  }

  return null;
}

/**
 * Safe stat extraction with fallback to 0
 */
function safeStat(value: number | undefined | null): number {
  return typeof value === 'number' && !isNaN(value) ? value : 0;
}

/**
 * Get date cutoffs for filtering
 */
function getDateCutoffs(selection: DateRangeSelection): { startCutoffSec: number | null; endCutoffSec: number | null } {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1); // 23:59:59.999 of the previous day

  const yesterdayEndSec = Math.floor(yesterdayEnd.getTime() / 1000);

  if (selection.type === 'all') {
    return { startCutoffSec: null, endCutoffSec: null };
  }

  if (selection.type === '7days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 7);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
    };
  }

  if (selection.type === '30days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 30);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
    };
  }

  // Custom date range
  let startCutoffSec: number | null = null;
  let endCutoffSec: number | null = null;

  if (selection.customStart) {
    const startDate = new Date(selection.customStart);
    startDate.setHours(0, 0, 0, 0);
    startCutoffSec = Math.floor(startDate.getTime() / 1000);
  }

  if (selection.customEnd) {
    const endDate = new Date(selection.customEnd);
    endDate.setHours(23, 59, 59, 999);
    endCutoffSec = Math.floor(endDate.getTime() / 1000);
  }

  return { startCutoffSec, endCutoffSec };
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Process a single match for player statistics
 */
function processMatchForPlayerStats(
  match: Match,
  playerId: number,
  accumulator: {
    totalGames: number;
    totalWins: number;
    totalKDA: number;
    totalGPM: number;
    totalXPM: number;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
  },
): void {
  const playerData = findPlayerInMatch(match, playerId);
  if (!playerData) return;

  accumulator.totalGames++;
  if (playerData.isWin) accumulator.totalWins++;

  const { stats } = playerData;
  const kills = safeStat(stats?.kills);
  const deaths = safeStat(stats?.deaths);
  const assists = safeStat(stats?.assists);
  const gpm = safeStat(stats?.gpm);
  const xpm = safeStat(stats?.xpm);

  accumulator.totalKDA += calculateKDA(kills, deaths, assists);
  accumulator.totalGPM += gpm;
  accumulator.totalXPM += xpm;
  accumulator.totalKills += kills;
  accumulator.totalDeaths += deaths;
  accumulator.totalAssists += assists;
}

/**
 * Calculate player performance statistics from matches
 */
export function calculatePlayerStats(playerId: number, matches: Match[]): PlayerStats {
  const accumulator = {
    totalGames: 0,
    totalWins: 0,
    totalKDA: 0,
    totalGPM: 0,
    totalXPM: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0,
  };

  for (const match of matches) {
    processMatchForPlayerStats(match, playerId, accumulator);
  }

  return {
    totalGames: accumulator.totalGames,
    totalWins: accumulator.totalWins,
    winRate: accumulator.totalGames > 0 ? (accumulator.totalWins / accumulator.totalGames) * 100 : 0,
    averageKDA: accumulator.totalGames > 0 ? accumulator.totalKDA / accumulator.totalGames : 0,
    averageGPM: accumulator.totalGames > 0 ? accumulator.totalGPM / accumulator.totalGames : 0,
    averageXPM: accumulator.totalGames > 0 ? accumulator.totalXPM / accumulator.totalGames : 0,
    averageKills: accumulator.totalGames > 0 ? accumulator.totalKills / accumulator.totalGames : 0,
    averageDeaths: accumulator.totalGames > 0 ? accumulator.totalDeaths / accumulator.totalGames : 0,
    averageAssists: accumulator.totalGames > 0 ? accumulator.totalAssists / accumulator.totalGames : 0,
  };
}

/**
 * Initialize hero aggregate if it doesn't exist
 */
function initializeHeroAggregate(
  heroId: number,
  heroAggregates: Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >,
): void {
  if (!heroAggregates.has(heroId)) {
    heroAggregates.set(heroId, {
      games: 0,
      wins: 0,
      totalKDA: 0,
      totalGPM: 0,
      totalXPM: 0,
      roles: new Set(),
    });
  }
}

/**
 * Update hero aggregate with match stats
 */
function updateHeroAggregate(
  heroId: number,
  isWin: boolean,
  stats: { kills?: number; deaths?: number; assists?: number; gpm?: number; xpm?: number },
  heroAggregates: Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >,
): void {
  const aggregate = heroAggregates.get(heroId)!;
  const kills = safeStat(stats?.kills);
  const deaths = safeStat(stats?.deaths);
  const assists = safeStat(stats?.assists);
  const gpm = safeStat(stats?.gpm);
  const xpm = safeStat(stats?.xpm);

  aggregate.games++;
  if (isWin) aggregate.wins++;
  aggregate.totalKDA += calculateKDA(kills, deaths, assists);
  aggregate.totalGPM += gpm;
  aggregate.totalXPM += xpm;
}

/**
 * Add role to hero aggregate if available
 */
function addRoleToHeroAggregate(
  heroId: number,
  match: Match,
  playerId: number,
  heroAggregates: Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >,
): void {
  const player =
    match.players.radiant.find((p) => p.accountId === playerId) ||
    match.players.dire.find((p) => p.accountId === playerId);
  if (player?.role?.role) {
    const aggregate = heroAggregates.get(heroId);
    if (aggregate) {
      aggregate.roles.add(player.role.role);
    }
  }
}

/**
 * Process a single match for hero statistics
 */
function processMatchForHeroStats(
  match: Match,
  playerId: number,
  heroAggregates: Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >,
): void {
  const playerData = findPlayerInMatch(match, playerId);
  if (!playerData) return;

  const { heroId, isWin, stats } = playerData;

  initializeHeroAggregate(heroId, heroAggregates);
  updateHeroAggregate(heroId, isWin, stats, heroAggregates);
  addRoleToHeroAggregate(heroId, match, playerId, heroAggregates);
}

/**
 * Convert hero aggregates to HeroStats map
 */
function convertHeroAggregatesToStats(
  heroAggregates: Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >,
  heroes: Map<number, Hero>,
): Map<number, HeroStats> {
  const heroStatsMap = new Map<number, HeroStats>();

  for (const [heroId, aggregate] of heroAggregates) {
    const hero = heroes.get(heroId) || {
      id: heroId,
      name: `npc_dota_hero_${heroId}`,
      localizedName: `Hero ${heroId}`,
      primaryAttribute: 'strength',
      attackType: 'melee',
      roles: [],
      imageUrl: '',
    };

    heroStatsMap.set(heroId, {
      hero,
      games: aggregate.games,
      wins: aggregate.wins,
      winRate: aggregate.games > 0 ? (aggregate.wins / aggregate.games) * 100 : 0,
      averageKDA: aggregate.games > 0 ? aggregate.totalKDA / aggregate.games : 0,
      averageGPM: aggregate.games > 0 ? aggregate.totalGPM / aggregate.games : 0,
      averageXPM: aggregate.games > 0 ? aggregate.totalXPM / aggregate.games : 0,
      roles: Array.from(aggregate.roles),
    });
  }

  return heroStatsMap;
}

/**
 * Calculate hero-specific statistics for a player
 */
export function calculateHeroStats(
  playerId: number,
  matches: Match[],
  heroes: Map<number, Hero>,
): Map<number, HeroStats> {
  // Aggregate stats per hero
  const heroAggregates = new Map<
    number,
    {
      games: number;
      wins: number;
      totalKDA: number;
      totalGPM: number;
      totalXPM: number;
      roles: Set<string>;
    }
  >();

  for (const match of matches) {
    processMatchForHeroStats(match, playerId, heroAggregates);
  }

  return convertHeroAggregatesToStats(heroAggregates, heroes);
}

/**
 * Calculate team-specific player statistics
 */
export function calculateTeamPlayerStats(
  playerId: number,
  teamKey: string,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
): TeamPlayerStats {
  // Filter matches to only those where the team participated
  // For now, we'll use all matches since TeamMatchParticipation doesn't have teamId/leagueId
  const teamMatchesArray = Array.from(teamMatches.keys());

  const teamMatchesOnly = matches.filter((match) => teamMatchesArray.includes(match.id));

  const stats = calculatePlayerStats(playerId, teamMatchesOnly);

  return {
    totalGames: stats.totalGames,
    totalWins: stats.totalWins,
    winRate: stats.winRate,
    averageKDA: stats.averageKDA,
    averageGPM: stats.averageGPM,
    averageXPM: stats.averageXPM,
  };
}

/**
 * Filter player matches by date range
 */
export function filterPlayerMatches(matches: Match[], dateRange: DateRangeSelection): Match[] {
  const { startCutoffSec, endCutoffSec } = getDateCutoffs(dateRange);

  return matches.filter((match) => {
    if (!match || !match.date) return false;

    const matchStartTimeSec = new Date(match.date).getTime() / 1000;
    if (startCutoffSec !== null && matchStartTimeSec < startCutoffSec) return false;
    if (endCutoffSec !== null && matchStartTimeSec > endCutoffSec) return false;
    return true;
  });
}

/**
 * Get player participated matches for a team
 */
export function getPlayerParticipatedMatches(
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  accountId: number,
): Match[] {
  return matches.filter((match) => {
    const teamMatch = teamMatches.get(match.id);
    if (!teamMatch) return false;

    // Check if player participated in this match
    const radiantPlayer = match.players.radiant.find((p) => p.accountId === accountId);
    const direPlayer = match.players.dire.find((p) => p.accountId === accountId);

    return !!(radiantPlayer || direPlayer);
  });
}

/**
 * Sort hero stats by various criteria
 */
export function sortHeroStats(
  heroStats: HeroStats[],
  sortKey: 'games' | 'winRate' | 'name',
  sortDirection: 'asc' | 'desc' = 'desc',
): HeroStats[] {
  const sorted = [...heroStats].sort((a, b) => {
    if (sortKey === 'name') {
      return a.hero.localizedName.localeCompare(b.hero.localizedName);
    }
    if (sortKey === 'games') {
      return b.games - a.games;
    }
    return b.winRate - a.winRate;
  });

  return sortDirection === 'asc' ? sorted.reverse() : sorted;
}

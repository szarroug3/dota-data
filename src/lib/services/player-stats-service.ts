/**
 * Player stats processing service
 * 
 * Handles fetching and transforming player data from OpenDota API
 */

import { getPlayerData, getPlayerHeroes, getPlayerMatches, getPlayerRecentMatches, getPlayerWL } from "../api";
import type { PlayerStats } from "../types/data-service";
import { getRankTierInfo } from "../utils";
import { calculateKDA, calculateWinRate, getHeroDisplayName, getHeroImage } from "../utils/data-calculations";

/**
 * Process player data from OpenDota API into app format
 */
function hasAnyError(...results: unknown[]): boolean {
  return results.some(r => r && typeof r === 'object' && 'error' in r);
}

function isStatusObject(obj: any): obj is { status: string; signature: string } {
  return obj && typeof obj === 'object' && 'status' in obj && 'signature' in obj;
}

function assemblePlayerStats(
  playerData: import('@/types/opendota').OpenDotaPlayer,
  playerWL: import('@/types/opendota').OpenDotaPlayerWL,
  playerHeroes: import('@/types/opendota').OpenDotaPlayerHeroes[],
  playerRecentMatches: import('@/types/opendota').OpenDotaPlayerRecentMatches[]
): PlayerStats {
  const overallStats = processOverallStats(playerData, playerWL);
  const recentPerformance = processRecentPerformance(playerRecentMatches);
  const topHeroes = processTopHeroes(playerHeroes);
  const trends = processPlayerTrends(playerData, playerWL);
  const rankInfo = processRankInfo(playerData);
  const recentlyPlayed = processRecentlyPlayed(playerHeroes);
  return {
    name: playerData.personaname || 'Unknown Player',
    role: determinePlayerRole(playerData),
    overallStats,
    recentPerformance,
    topHeroes,
    trends,
    ...rankInfo,
    recentlyPlayed
  };
}

export async function getPlayerStats(accountId: number): Promise<PlayerStats> {
  const [playerDataRaw, playerHeroesRaw, playerMatchesRaw, playerRecentMatchesRaw, playerWLRaw] = await Promise.all([
    getPlayerData(accountId),
    getPlayerHeroes(accountId),
    getPlayerMatches(accountId),
    getPlayerRecentMatches(accountId),
    getPlayerWL(accountId)
  ]);
  if (
    isStatusObject(playerDataRaw) ||
    isStatusObject(playerHeroesRaw) ||
    isStatusObject(playerMatchesRaw) ||
    isStatusObject(playerRecentMatchesRaw) ||
    isStatusObject(playerWLRaw)
  ) {
    throw new Error('Failed to fetch player stats');
  }
  const playerData = playerDataRaw as import('@/types/opendota').OpenDotaPlayer;
  const playerHeroes = playerHeroesRaw as import('@/types/opendota').OpenDotaPlayerHeroes[];
  const playerRecentMatches = playerRecentMatchesRaw as import('@/types/opendota').OpenDotaPlayerRecentMatches[];
  const playerWL = playerWLRaw as import('@/types/opendota').OpenDotaPlayerWL;
  return assemblePlayerStats(playerData, playerWL, playerHeroes, playerRecentMatches);
}

/**
 * Process overall player statistics
 */
function processOverallStats(playerData: import('@/types/opendota').OpenDotaPlayer, playerWL: import('@/types/opendota').OpenDotaPlayerWL) {
  const totalMatches = playerWL.win + playerWL.lose;
  const winRate = calculateWinRate(playerWL.win, totalMatches);
  
  return {
    matches: totalMatches,
    winRate,
    avgKDA: 0,
    avgGPM: 0,
    avgXPM: 0,
    avgGameLength: '0:00'
  };
}

/**
 * Process recent performance data
 */
function processRecentPerformance(recentMatches: import('@/types/opendota').OpenDotaPlayerRecentMatches[]) {
  return recentMatches.slice(0, 10).map(match => ({
    date: new Date(match.start_time * 1000).toLocaleDateString(),
    hero: (match as any).hero_name || getHeroDisplayName('unknown'),
    result: match.radiant_win === (match.player_slot < 128) ? 'Win' : 'Loss',
    KDA: `${match.kills}/${match.deaths}/${match.assists}`,
    GPM: (match as any).gold_per_min || 0
  }));
}

/**
 * Process top heroes data
 */
function processTopHeroes(playerHeroes: import('@/types/opendota').OpenDotaPlayerHeroes[]) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 5)
    .map(hero => ({
      hero: (hero as any).hero_name || getHeroDisplayName('unknown'),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0),
      avgKDA: calculateKDA((hero as any).kills || 0, (hero as any).deaths || 0, (hero as any).assists || 0),
      avgGPM: (hero as any).gold_per_min || 0
    }));
}

/**
 * Process player trends
 */
function getWinRateTrend(winRate: number) {
  return {
    metric: 'Win Rate',
    value: `${winRate.toFixed(1)}%`,
    trend: winRate > 50 ? 'Improving' : 'Needs work',
    direction: winRate > 50 ? 'up' as const : 'down' as const
  };
}
function getKDATrend(kda: number) {
  return {
    metric: 'Average KDA',
    value: kda.toFixed(2),
    trend: kda > 2.5 ? 'Good' : 'Could improve',
    direction: kda > 2.5 ? 'up' as const : 'down' as const
  };
}
function getGPMTrend(gpm: number) {
  return {
    metric: 'Average GPM',
    value: gpm.toFixed(0),
    trend: gpm > 500 ? 'Strong' : 'Below average',
    direction: gpm > 500 ? 'up' as const : 'down' as const
  };
}
function processPlayerTrends(playerData: import('@/types/opendota').OpenDotaPlayer, playerWL: import('@/types/opendota').OpenDotaPlayerWL) {
  const totalMatches = playerWL.win + playerWL.lose;
  const winRate = calculateWinRate(playerWL.win, totalMatches);
  return [
    getWinRateTrend(winRate),
    getKDATrend(0),
    getGPMTrend(0)
  ];
}

/**
 * Process rank information
 */
function processRankInfo(playerData: import('@/types/opendota').OpenDotaPlayer) {
  const rankTier = playerData.rank_tier || 0;
  const rankInfo = getRankTierInfo(rankTier);
  return {
    rank: rankInfo.rank,
    stars: rankInfo.stars,
    rankImage: `/ranks/${rankInfo.rank.toLowerCase()}.png`
  };
}

/**
 * Process recently played heroes
 */
function processRecentlyPlayed(playerHeroes: import('@/types/opendota').OpenDotaPlayerHeroes[]) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 8)
    .map(hero => ({
      hero: (hero as any).hero_name || getHeroDisplayName('unknown'),
      heroImage: getHeroImage((hero as any).hero_name || 'unknown'),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0)
    }));
}

/**
 * Determine player role based on stats
 */
function determinePlayerRole(playerData: import('@/types/opendota').OpenDotaPlayer): string {
  // No gpm/xpm in OpenDotaPlayer, so just return 'Support' for now
  return 'Support';
}

/**
 * Format game length from seconds to readable string
 */
function formatGameLength(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 
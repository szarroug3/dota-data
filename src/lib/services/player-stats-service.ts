/**
 * Player stats processing service
 * 
 * Handles fetching and transforming player data from OpenDota API
 */

import type { OpenDotaPlayer, OpenDotaPlayerHeroes, OpenDotaPlayerRecentMatches, OpenDotaPlayerWL } from '@/types/opendota';
import { getPlayerData, getPlayerHeroes, getPlayerMatches, getPlayerRecentMatches, getPlayerWL } from "../api";
import type { PlayerStats } from "../types/data-service";
import { getRankTierInfo, logWithTimestamp } from "../utils";
import { calculateKDA, calculateWinRate, getHeroDisplayName, getHeroImage } from "../utils/data-calculations";

/**
 * Process player data from OpenDota API into app format
 */
function hasAnyError(...results: unknown[]): boolean {
  return results.some(r => r && typeof r === 'object' && 'error' in r);
}

function assemblePlayerStats(
  playerData: OpenDotaPlayer,
  playerWL: OpenDotaPlayerWL,
  playerHeroes: OpenDotaPlayerHeroes,
  playerRecentMatches: OpenDotaPlayerRecentMatches
): PlayerStats {
  const overallStats = processOverallStats(playerData, playerWL);
  const recentPerformance = processRecentPerformance(playerRecentMatches);
  const topHeroes = processTopHeroes(playerHeroes);
  const trends = processPlayerTrends(playerData, playerWL);
  const rankInfo = processRankInfo(playerData);
  const recentlyPlayed = processRecentlyPlayed(playerHeroes);
  return {
    name: playerData.profile.personaname || 'Unknown Player',
    role: determinePlayerRole(playerData),
    overallStats,
    recentPerformance,
    topHeroes,
    trends,
    ...rankInfo,
    recentlyPlayed
  };
}

export async function getPlayerStats(accountId: number): Promise<PlayerStats | { status: string; signature: string }> {
  try {
    logWithTimestamp(`Fetching player stats for account ID: ${accountId}`);
    const [playerData, playerHeroes, playerMatches, playerRecentMatches, playerWL] = await Promise.all([
      getPlayerData(accountId),
      getPlayerHeroes(accountId),
      getPlayerMatches(accountId),
      getPlayerRecentMatches(accountId),
      getPlayerWL(accountId)
    ]);
    if (hasAnyError(playerData, playerHeroes, playerMatches, playerRecentMatches, playerWL)) {
      return { status: 'error', signature: 'Failed to fetch player data' };
    }
    return assemblePlayerStats(playerData, playerWL, playerHeroes, playerRecentMatches);
  } catch (error) {
    logWithTimestamp(`Error fetching player stats for ${accountId}:`, error);
    return { status: 'error', signature: 'Failed to process player data' };
  }
}

/**
 * Process overall player statistics
 */
function processOverallStats(playerData: OpenDotaPlayer, playerWL: OpenDotaPlayerWL) {
  const totalMatches = playerWL.win + playerWL.lose;
  const winRate = calculateWinRate(playerWL.win, totalMatches);
  
  return {
    matches: totalMatches,
    winRate,
    avgKDA: playerData.kda || 0,
    avgGPM: playerData.gpm || 0,
    avgXPM: playerData.xpm || 0,
    avgGameLength: formatGameLength(playerData.avg_seconds_per_match || 0)
  };
}

/**
 * Process recent performance data
 */
function processRecentPerformance(recentMatches: OpenDotaPlayerRecentMatches) {
  return recentMatches.slice(0, 10).map(match => ({
    date: new Date(match.start_time * 1000).toLocaleDateString(),
    hero: getHeroDisplayName(match.hero_name || 'unknown'),
    result: match.radiant_win === (match.player_slot < 128) ? 'Win' : 'Loss',
    KDA: `${match.kills}/${match.deaths}/${match.assists}`,
    GPM: match.gold_per_min || 0
  }));
}

/**
 * Process top heroes data
 */
function processTopHeroes(playerHeroes: OpenDotaPlayerHeroes) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 5)
    .map(hero => ({
      hero: getHeroDisplayName(hero.hero_name || 'unknown'),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0),
      avgKDA: calculateKDA(hero.kills || 0, hero.deaths || 0, hero.assists || 0),
      avgGPM: hero.gold_per_min || 0
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
function processPlayerTrends(playerData: OpenDotaPlayer, playerWL: OpenDotaPlayerWL) {
  const totalMatches = playerWL.win + playerWL.lose;
  const winRate = calculateWinRate(playerWL.win, totalMatches);
  return [
    getWinRateTrend(winRate),
    getKDATrend(playerData.kda || 0),
    getGPMTrend(playerData.gpm || 0)
  ];
}

/**
 * Process rank information
 */
function processRankInfo(playerData: OpenDotaPlayer) {
  const rankTier = playerData.rank_tier || 0;
  const rankInfo = getRankTierInfo(rankTier);
  
  return {
    rank: rankInfo.name,
    stars: rankInfo.stars,
    immortalRank: rankInfo.immortalRank,
    rankImage: rankInfo.image
  };
}

/**
 * Process recently played heroes
 */
function processRecentlyPlayed(playerHeroes: OpenDotaPlayerHeroes) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 8)
    .map(hero => ({
      hero: getHeroDisplayName(hero.hero_name || 'unknown'),
      heroImage: getHeroImage(hero.hero_name || 'unknown'),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0)
    }));
}

/**
 * Determine player role based on stats
 */
function determinePlayerRole(playerData: OpenDotaPlayer): string {
  const gpm = playerData.gpm || 0;
  const xpm = playerData.xpm || 0;
  
  if (gpm > 600 && xpm > 600) return 'Carry';
  if (gpm > 500 && xpm > 500) return 'Mid';
  if (gpm > 400 && xpm > 400) return 'Offlane';
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
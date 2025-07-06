/**
 * Player stats processing service
 * 
 * Handles fetching and transforming player data from OpenDota API
 */

import type { OpenDotaPlayer, OpenDotaPlayerHeroes, OpenDotaPlayerRecentMatch, OpenDotaPlayerWL } from "@/types/opendota";
import { getPlayerData, getPlayerHeroes, getPlayerMatches, getPlayerRecentMatches, getPlayerWL } from "../api";
import type { PlayerStats } from "../types/data-service";
import { getRankTierInfo } from "../utils";
import { calculateKDA, calculateWinRate, getHeroDisplayName, getHeroImage } from "../utils/data-calculations";

interface StatusObject {
  status: string;
  signature: string;
}

/**
 * Process player data from OpenDota API into app format
 */
function isStatusObject(obj: unknown): obj is StatusObject {
  return Boolean(obj && typeof obj === 'object' && obj !== null &&
    'status' in obj && typeof (obj as Record<string, unknown>).status === 'string' &&
    'signature' in obj && typeof (obj as Record<string, unknown>).signature === 'string');
}

function assemblePlayerStats(
  playerData: OpenDotaPlayer,
  playerWL: OpenDotaPlayerWL,
  playerHeroes: OpenDotaPlayerHeroes[],
  playerRecentMatches: OpenDotaPlayerRecentMatch[]
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
  const playerData = playerDataRaw as OpenDotaPlayer;
  const playerHeroes = playerHeroesRaw as OpenDotaPlayerHeroes[];
  const playerRecentMatches = playerRecentMatchesRaw as OpenDotaPlayerRecentMatch[];
  const playerWL = playerWLRaw as OpenDotaPlayerWL;
  return assemblePlayerStats(playerData, playerWL, playerHeroes, playerRecentMatches);
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
    avgKDA: 0,
    avgGPM: 0,
    avgXPM: 0,
    avgGameLength: '0:00'
  };
}

/**
 * Process recent performance data
 */
function processRecentPerformance(recentMatches: OpenDotaPlayerRecentMatch[]) {
  return recentMatches.slice(0, 10).map(match => ({
    date: new Date(match.start_time * 1000).toLocaleDateString(),
    hero: getHeroDisplayName(match.hero_id.toString()),
    result: match.radiant_win === (match.player_slot < 128) ? 'Win' : 'Loss',
    KDA: `${match.kills}/${match.deaths}/${match.assists}`,
    GPM: match.gold_per_min || 0
  }));
}

/**
 * Process top heroes data
 */
function processTopHeroes(playerHeroes: OpenDotaPlayerHeroes[]) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 5)
    .map(hero => ({
      hero: getHeroDisplayName(hero.hero_id.toString()),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0),
      avgKDA: calculateKDA(0, 0, 0), // No individual hero stats available
      avgGPM: 0 // No individual hero stats available
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
    getKDATrend(0),
    getGPMTrend(0)
  ];
}

/**
 * Process rank information
 */
function processRankInfo(playerData: OpenDotaPlayer) {
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
function processRecentlyPlayed(playerHeroes: OpenDotaPlayerHeroes[]) {
  return playerHeroes
    .sort((a, b) => (b.games || 0) - (a.games || 0))
    .slice(0, 8)
    .map(hero => ({
      hero: getHeroDisplayName(hero.hero_id.toString()),
      heroImage: getHeroImage(hero.hero_id.toString()),
      games: hero.games || 0,
      winRate: calculateWinRate(hero.win || 0, hero.games || 0)
    }));
}

/**
 * Determine player role based on stats
 */
function determinePlayerRole(_playerData: OpenDotaPlayer): string {
  // No gpm/xpm in OpenDotaPlayer, so just return 'Support' for now
  return 'Support';
} 
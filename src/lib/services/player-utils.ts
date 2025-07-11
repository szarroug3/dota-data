import { OpenDotaPlayerHero, OpenDotaPlayerMatch, OpenDotaPlayerRecentMatches } from '@/types/external-apis';

import {
    ProcessedPlayerHeroes,
    ProcessedPlayerPerformance,
    ProcessedPlayerProfile,
    ProcessedPlayerRecentActivity,
    ProcessedPlayerStatistics,
    ProcessedPlayerTrends,
    RawPlayerData
} from './player-types';

// Rank tiers mapping
const RANK_TIERS: Record<number, string> = {
  0: 'Unranked',
  10: 'Herald I',
  11: 'Herald II',
  12: 'Herald III',
  13: 'Herald IV',
  14: 'Herald V',
  20: 'Guardian I',
  21: 'Guardian II',
  22: 'Guardian III',
  23: 'Guardian IV',
  24: 'Guardian V',
  30: 'Crusader I',
  31: 'Crusader II',
  32: 'Crusader III',
  33: 'Crusader IV',
  34: 'Crusader V',
  40: 'Archon I',
  41: 'Archon II',
  42: 'Archon III',
  43: 'Archon IV',
  44: 'Archon V',
  50: 'Legend I',
  51: 'Legend II',
  52: 'Legend III',
  53: 'Legend IV',
  54: 'Legend V',
  60: 'Ancient I',
  61: 'Ancient II',
  62: 'Ancient III',
  63: 'Ancient IV',
  64: 'Ancient V',
  70: 'Divine I',
  71: 'Divine II',
  72: 'Divine III',
  73: 'Divine IV',
  74: 'Divine V',
  80: 'Immortal'
};

/**
 * Determines skill bracket based on rank tier
 */
export function determineSkillBracket(rankTier?: number): ProcessedPlayerProfile['skillBracket'] {
  if (!rankTier || rankTier === 0) return 'unknown';
  if (rankTier < 30) return 'normal';
  if (rankTier < 50) return 'high';
  return 'very_high';
}

/**
 * Estimates MMR based on rank tier and leaderboard rank
 */
export function estimateMMR(rankTier?: number, leaderboardRank?: number): number | undefined {
  if (!rankTier) return undefined;
  if (leaderboardRank) return 5500 + (1000 - leaderboardRank) * 5; // Rough estimate
  
  const baseMMR = Math.floor(rankTier / 10) * 770; // Each major rank ~770 MMR
  const subRank = rankTier % 10;
  return baseMMR + (subRank * 154); // Each sub-rank ~154 MMR
}

/**
 * Determines skill level based on rank tier
 */
export function determineSkillLevel(rankTier: number): ProcessedPlayerPerformance['skillLevel'] {
  if (rankTier === 0) return 'beginner';
  if (rankTier < 30) return 'beginner';
  if (rankTier < 50) return 'intermediate';
  if (rankTier < 70) return 'advanced';
  if (rankTier < 80) return 'expert';
  return 'professional';
}

/**
 * Calculates average KDA from matches
 */
export function calculateAverageKDA(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const totalKDA = matches.reduce((sum, match) => {
    const kda = match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists;
    return sum + kda;
  }, 0);
  
  return Math.round((totalKDA / matches.length) * 100) / 100;
}

/**
 * Calculates average GPM from matches
 */
export function calculateAverageGPM(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const totalGPM = matches.reduce((sum, match) => sum + match.gold_per_min, 0);
  return Math.round(totalGPM / matches.length);
}

/**
 * Calculates average XPM from matches
 */
export function calculateAverageXPM(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const totalXPM = matches.reduce((sum, match) => sum + match.xp_per_min, 0);
  return Math.round(totalXPM / matches.length);
}

/**
 * Calculates average duration from matches
 */
export function calculateAverageDuration(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
  return Math.round(totalDuration / matches.length);
}

/**
 * Processes favorite heroes
 */
export function processFavoriteHeroes(heroes: OpenDotaPlayerHero[]): ProcessedPlayerStatistics['favoriteHeroes'] {
  return heroes
    .sort((a, b) => b.games - a.games)
    .slice(0, 10)
    .map(hero => ({
      heroId: hero.hero_id,
      games: hero.games,
      winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
      avgKDA: hero.games > 0 ? hero.win / hero.games : 0, // Simplified
      lastPlayed: hero.last_played,
    }));
}

/**
 * Processes game modes
 * Note: OpenDotaPlayerCounts doesn't have games/win fields, so return empty array for now
 * This would need to be processed from actual match data
 */
export function processGameModes(): ProcessedPlayerStatistics['gameModes'] {
  return [];
}

/**
 * Processes positions
 * Note: OpenDotaPlayerCounts doesn't have games/win fields, so return empty array for now
 * This would need to be processed from actual match data
 */
export function processPositions(): ProcessedPlayerStatistics['positions'] {
  return [];
}

/**
 * Calculates consistency score
 */
export function calculateConsistency(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const gpms = matches.map(m => m.gold_per_min);
  const avgGPM = gpms.reduce((sum, gpm) => sum + gpm, 0) / gpms.length;
  const variance = gpms.reduce((sum, gpm) => sum + Math.pow(gpm - avgGPM, 2), 0) / gpms.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency
  const consistencyScore = Math.max(0, 100 - (standardDeviation / avgGPM) * 100);
  return Math.round(consistencyScore);
}

/**
 * Calculates versatility score
 */
export function calculateVersatility(heroes: OpenDotaPlayerHero[]): number {
  if (heroes.length === 0) return 0;
  
  const uniqueHeroes = heroes.length;
  
  // More heroes played with reasonable game distribution = higher versatility
  const versatilityScore = Math.min(100, (uniqueHeroes / 50) * 100);
  return Math.round(versatilityScore);
}

/**
 * Calculates teamwork score
 */
export function calculateTeamwork(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgAssists = matches.reduce((sum, match) => sum + match.assists, 0) / matches.length;
  const teamworkScore = Math.min(100, (avgAssists / 10) * 100);
  return Math.round(teamworkScore);
}

/**
 * Calculates laning score
 */
export function calculateLaningScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgLastHits = matches.reduce((sum, match) => sum + match.last_hits, 0) / matches.length;
  const avgGPM = matches.reduce((sum, match) => sum + match.gold_per_min, 0) / matches.length;
  
  const laningScore = Math.min(100, ((avgLastHits / 200) * 50) + ((avgGPM / 500) * 50));
  return Math.round(laningScore);
}

/**
 * Calculates farming score
 */
export function calculateFarmingScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgGPM = matches.reduce((sum, match) => sum + match.gold_per_min, 0) / matches.length;
  const farmingScore = Math.min(100, (avgGPM / 600) * 100);
  return Math.round(farmingScore);
}

/**
 * Calculates fighting score
 */
export function calculateFightingScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgKDA = calculateAverageKDA(matches);
  const avgHeroDamage = matches.reduce((sum, match) => sum + match.hero_damage, 0) / matches.length;
  
  const fightingScore = Math.min(100, (avgKDA * 20) + ((avgHeroDamage / 20000) * 50));
  return Math.round(fightingScore);
}

/**
 * Calculates supporting score
 */
export function calculateSupportingScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgAssists = matches.reduce((sum, match) => sum + match.assists, 0) / matches.length;
  const avgHealing = matches.reduce((sum, match) => sum + match.hero_healing, 0) / matches.length;
  
  const supportingScore = Math.min(100, ((avgAssists / 15) * 60) + ((avgHealing / 5000) * 40));
  return Math.round(supportingScore);
}

/**
 * Calculates leadership score
 */
export function calculateLeadershipScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length === 0) return 0;
  
  const winRate = matches.filter(m => m.radiant_win === (m.player_slot < 5)).length / matches.length;
  const avgTowerDamage = matches.reduce((sum, match) => sum + match.tower_damage, 0) / matches.length;
  
  const leadershipScore = Math.min(100, (winRate * 70) + ((avgTowerDamage / 3000) * 30));
  return Math.round(leadershipScore);
}

/**
 * Calculates improvement score
 */
export function calculateImprovementScore(matches: OpenDotaPlayerMatch[]): number {
  if (matches.length < 10) return 0;
  
  const recentMatches = matches.slice(0, 10);
  const olderMatches = matches.slice(-10);
  
  const recentWinRate = recentMatches.filter(m => m.radiant_win === (m.player_slot < 5)).length / recentMatches.length;
  const olderWinRate = olderMatches.filter(m => m.radiant_win === (m.player_slot < 5)).length / olderMatches.length;
  
  const improvement = (recentWinRate - olderWinRate) * 100;
  return Math.round(Math.max(-100, Math.min(100, improvement)));
}

/**
 * Determines strengths based on performance metrics
 */
export function determineStrengths(metrics: Record<string, number>): string[] {
  const strengths: string[] = [];
  
  Object.entries(metrics).forEach(([key, value]) => {
    if (value >= 80) {
      strengths.push(key);
    }
  });
  
  return strengths;
}

/**
 * Determines weaknesses based on performance metrics
 */
export function determineWeaknesses(metrics: Record<string, number>): string[] {
  const weaknesses: string[] = [];
  
  Object.entries(metrics).forEach(([key, value]) => {
    if (value < 50) {
      weaknesses.push(key);
    }
  });
  
  return weaknesses;
}

/**
 * Processes recent matches
 */
export function processRecentMatches(recentMatches: OpenDotaPlayerRecentMatches[]): ProcessedPlayerRecentActivity['recentMatches'] {
  return recentMatches.slice(0, 20).map(match => ({
    matchId: match.match_id,
    heroId: match.hero_id,
    result: match.radiant_win === (match.player_slot < 5) ? 'win' : 'loss',
    duration: match.duration,
    startTime: match.start_time,
    kda: match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists,
    gpm: match.gold_per_min,
    xpm: match.xp_per_min,
    gameMode: `Mode ${match.game_mode}`,
    lobbyType: `Lobby ${match.lobby_type}`,
  }));
}

/**
 * Determines activity level
 */
export function determineActivityLevel(recentMatches: ProcessedPlayerRecentActivity['recentMatches']): ProcessedPlayerRecentActivity['activityLevel'] {
  const now = Date.now() / 1000;
  const last7Days = recentMatches.filter(m => now - m.startTime < 7 * 24 * 60 * 60);
  
  if (last7Days.length === 0) return 'inactive';
  if (last7Days.length < 5) return 'low';
  if (last7Days.length < 15) return 'moderate';
  if (last7Days.length < 30) return 'high';
  return 'very_high';
}

/**
 * Calculates win/loss streaks
 */
export function calculateStreaks(recentMatches: ProcessedPlayerRecentActivity['recentMatches']): ProcessedPlayerRecentActivity['streaks'] {
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  
  for (const match of recentMatches) {
    if (match.result === 'win') {
      tempWinStreak++;
      tempLossStreak = 0;
      if (currentWinStreak === 0) currentWinStreak = tempWinStreak;
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      if (currentLossStreak === 0) currentLossStreak = tempLossStreak;
    }
    
    longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
  }
  
  return {
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
  };
}

/**
 * Calculates play time statistics
 */
export function calculatePlayTime(recentMatches: ProcessedPlayerRecentActivity['recentMatches']): ProcessedPlayerRecentActivity['playTime'] {
  const now = Date.now() / 1000;
  const last7Days = recentMatches.filter(m => now - m.startTime < 7 * 24 * 60 * 60);
  const last30Days = recentMatches.filter(m => now - m.startTime < 30 * 24 * 60 * 60);
  
  const hoursLast7Days = last7Days.reduce((sum, match) => sum + match.duration, 0) / 3600;
  const hoursLast30Days = last30Days.reduce((sum, match) => sum + match.duration, 0) / 3600;
  const avgSessionLength = recentMatches.length > 0 ? 
    recentMatches.reduce((sum, match) => sum + match.duration, 0) / recentMatches.length / 60 : 0;
  
  return {
    hoursLast7Days: Math.round(hoursLast7Days * 100) / 100,
    hoursLast30Days: Math.round(hoursLast30Days * 100) / 100,
    avgSessionLength: Math.round(avgSessionLength),
  };
}

/**
 * Processes most played heroes
 */
export function processMostPlayedHeroes(heroes: OpenDotaPlayerHero[]): ProcessedPlayerHeroes['mostPlayedHeroes'] {
  return heroes
    .sort((a, b) => b.games - a.games)
    .slice(0, 10)
    .map(hero => ({
      heroId: hero.hero_id,
      games: hero.games,
      winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
      avgKDA: hero.games > 0 ? hero.win / hero.games : 0, // Simplified
      avgGPM: 0, // Would need match data
      avgXPM: 0, // Would need match data
      lastPlayed: hero.last_played,
      performance: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
    }));
}

/**
 * Processes best performing heroes
 */
export function processBestPerformingHeroes(heroes: OpenDotaPlayerHero[]): ProcessedPlayerHeroes['bestPerformingHeroes'] {
  return heroes
    .filter(hero => hero.games >= 3) // Minimum games for meaningful stats
    .sort((a, b) => (b.win / b.games) - (a.win / a.games))
    .slice(0, 10)
    .map(hero => ({
      heroId: hero.hero_id,
      games: hero.games,
      winRate: (hero.win / hero.games) * 100,
      avgKDA: hero.games > 0 ? hero.win / hero.games : 0, // Simplified
      performance: (hero.win / hero.games) * 100,
    }));
}

/**
 * Processes recently played heroes
 */
export function processRecentlyPlayedHeroes(heroes: OpenDotaPlayerHero[]): ProcessedPlayerHeroes['recentlyPlayedHeroes'] {
  return heroes
    .sort((a, b) => b.last_played - a.last_played)
    .slice(0, 10)
    .map(hero => ({
      heroId: hero.hero_id,
      games: hero.games,
      winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
      lastPlayed: hero.last_played,
    }));
}

/**
 * Processes hero roles
 */
export function processHeroRoles(): ProcessedPlayerHeroes['heroRoles'] {
  // This would need hero role mapping - simplified for now
  const defaultRole = { games: 0, winRate: 0 };
  
  return {
    carry: defaultRole,
    support: defaultRole,
    initiator: defaultRole,
    nuker: defaultRole,
    disabler: defaultRole,
    jungler: defaultRole,
    durable: defaultRole,
    escape: defaultRole,
    pusher: defaultRole,
  };
}

/**
 * Calculates MMR trend
 */
export function calculateMMRTrend(matches: OpenDotaPlayerMatch[]): ProcessedPlayerTrends['mmrTrend'] {
  // Simplified - would need actual MMR data
  const recentWinRate = matches.slice(0, 10).filter(m => m.radiant_win === (m.player_slot < 5)).length / 10;
  
  if (recentWinRate > 0.6) return 'improving';
  if (recentWinRate < 0.4) return 'declining';
  return 'stable';
}

/**
 * Calculates win rate trend
 */
export function calculateWinRateTrend(matches: OpenDotaPlayerMatch[]): ProcessedPlayerTrends['winRateTrend'] {
  if (matches.length < 20) return 'stable';
  
  const recentWinRate = matches.slice(0, 10).filter(m => m.radiant_win === (m.player_slot < 5)).length / 10;
  const olderWinRate = matches.slice(10, 20).filter(m => m.radiant_win === (m.player_slot < 5)).length / 10;
  
  const diff = recentWinRate - olderWinRate;
  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

/**
 * Calculates performance trend
 */
export function calculatePerformanceTrend(matches: OpenDotaPlayerMatch[]): ProcessedPlayerTrends['performanceTrend'] {
  if (matches.length < 20) return 'stable';
  
  const recentAvgKDA = matches.slice(0, 10).reduce((sum, match) => {
    const kda = match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists;
    return sum + kda;
  }, 0) / 10;
  
  const olderAvgKDA = matches.slice(10, 20).reduce((sum, match) => {
    const kda = match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists;
    return sum + kda;
  }, 0) / 10;
  
  const diff = recentAvgKDA - olderAvgKDA;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

/**
 * Calculates activity trend
 */
export function calculateActivityTrend(matches: OpenDotaPlayerMatch[]): ProcessedPlayerTrends['activityTrend'] {
  if (matches.length < 20) return 'stable';
  
  const now = Date.now() / 1000;
  const recentMatches = matches.filter(m => now - m.start_time < 7 * 24 * 60 * 60);
  const olderMatches = matches.filter(m => now - m.start_time >= 7 * 24 * 60 * 60 && now - m.start_time < 14 * 24 * 60 * 60);
  
  if (recentMatches.length > olderMatches.length * 1.2) return 'increasing';
  if (recentMatches.length < olderMatches.length * 0.8) return 'decreasing';
  return 'stable';
}

/**
 * Generates predictions
 */
export function generatePredictions(rawData: RawPlayerData): ProcessedPlayerTrends['predictions'] {
  const rankTier = rawData.profile.rank_tier || 0;
  const nextRank = rankTier + 1;
  
  return {
    nextRankPrediction: RANK_TIERS[nextRank] || 'Unknown',
    improvementAreas: ['farming', 'map awareness', 'team coordination'],
    recommendedHeroes: [1, 2, 3, 4, 5], // Simplified - would need complex analysis
  };
} 
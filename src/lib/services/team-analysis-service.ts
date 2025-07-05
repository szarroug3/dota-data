/**
 * Team analysis processing service
 * 
 * Handles analyzing team performance and generating insights
 */

import type { OpenDotaMatch, OpenDotaPlayer, OpenDotaPlayerHeroes } from '@/types/opendota';
import { getPlayerData, getPlayerHeroes, getPlayerMatches } from "../api";
import type { TeamAnalysis } from "../types/data-service";
import { formatDuration, logWithTimestamp } from "../utils";
import { calculateKDA, getHeroDisplayName } from "../utils/data-calculations";

// Aggregated hero stats type
export type HeroStat = {
  hero: string;
  games: number;
  wins: number;
  winRate: number;
};

/**
 * Generate team analysis for multiple players
 */
export async function getTeamAnalysis(
  accountIds: number[]
): Promise<TeamAnalysis | { error: string }> {
  try {
    logWithTimestamp('log', `Generating team analysis for ${accountIds.length} players`);

    // Fetch all data in parallel
    const [playerDataResults, heroResults, matchResults] = await Promise.all([
      Promise.all(accountIds.map(id => getPlayerData(id))),
      Promise.all(accountIds.map(id => getPlayerHeroes(id))),
      Promise.all(accountIds.map(id => getPlayerMatches(id)))
    ]);

    // Check for errors
    const hasError = playerDataResults.some(r => 'error' in r) ||
                    heroResults.some(r => 'error' in r) ||
                    matchResults.some(r => 'error' in r);
    
    if (hasError) {
      return { error: 'Failed to fetch team data' };
    }

    const players = playerDataResults as OpenDotaPlayer[];
    const allHeroes = heroResults.flat() as OpenDotaPlayerHeroes[];
    const allMatches = matchResults.flat() as OpenDotaMatch[];

    // Calculate overall team stats
    const overallStats = calculateOverallTeamStats(players);
    
    // Calculate role performance
    const rolePerformance = calculateRolePerformance(players);
    
    // Calculate game phase stats
    const gamePhaseStats = calculateGamePhaseStats(allMatches);
    
    // Calculate hero pool analysis
    const heroPool = analyzeHeroPool(allHeroes);
    
    // Calculate trends
    const trends = calculateTeamTrends(players, allMatches);

    return {
      overallStats,
      rolePerformance,
      gamePhaseStats,
      heroPool,
      trends
    };
  } catch (error) {
    logWithTimestamp('error', `Error generating team analysis:`, error);
    return { error: 'Failed to generate team analysis' };
  }
}

/**
 * Calculate overall team statistics
 */
function calculateOverallTeamStats(players: OpenDotaPlayer[]) {
  const totalMatches = players.reduce((sum, player) => sum + (player.total_matches || 0), 0);
  const totalWins = players.reduce((sum, player) => sum + (player.win || 0), 0);
  const totalKDA = players.reduce((sum, player) => sum + (player.kda || 0), 0);
  const totalGPM = players.reduce((sum, player) => sum + (player.gpm || 0), 0);
  const totalXPM = players.reduce((sum, player) => sum + (player.xpm || 0), 0);
  const totalGameTime = players.reduce((sum, player) => sum + (player.avg_seconds_per_match || 0), 0);

  const avgKDA = players.length > 0 ? totalKDA / players.length : 0;
  const avgGPM = players.length > 0 ? totalGPM / players.length : 0;
  const avgXPM = players.length > 0 ? totalXPM / players.length : 0;
  const avgGameLength = players.length > 0 ? formatDuration(totalGameTime / players.length) : '0:00';
  const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

  return {
    totalMatches,
    winRate,
    avgGameLength,
    avgKDA,
    avgGPM,
    avgXPM
  };
}

/**
 * Calculate performance by role
 */
function calculateRolePerformance(players: OpenDotaPlayer[]) {
  const roles = {
    carry: players.filter(p => determinePlayerRole(p) === 'Carry'),
    mid: players.filter(p => determinePlayerRole(p) === 'Mid'),
    offlane: players.filter(p => determinePlayerRole(p) === 'Offlane'),
    support: players.filter(p => determinePlayerRole(p) === 'Support')
  };

  return {
    carry: calculateRoleStats(roles.carry),
    mid: calculateRoleStats(roles.mid),
    offlane: calculateRoleStats(roles.offlane),
    support: calculateRoleStats(roles.support)
  };
}

/**
 * Calculate statistics for a specific role
 */
function calculateRoleStats(rolePlayers: OpenDotaPlayer[]) {
  if (rolePlayers.length === 0) {
    return { winRate: 0, avgKDA: 0, avgGPM: 0 };
  }

  const totalWins = rolePlayers.reduce((sum, p) => sum + (p.win || 0), 0);
  const totalMatches = rolePlayers.reduce((sum, p) => sum + (p.total_matches || 0), 0);
  const avgKDA = rolePlayers.reduce((sum, p) => sum + (p.kda || 0), 0) / rolePlayers.length;
  const avgGPM = rolePlayers.reduce((sum, p) => sum + (p.gpm || 0), 0) / rolePlayers.length;

  return {
    winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
    avgKDA,
    avgGPM
  };
}

/**
 * Calculate game phase statistics
 */
function calculateGamePhaseStats(matches: OpenDotaMatch[]) {
  const earlyGameMatches = matches.filter(m => m.duration < 1800); // < 30 min
  const midGameMatches = matches.filter(m => m.duration >= 1800 && m.duration < 2700); // 30-45 min
  const lateGameMatches = matches.filter(m => m.duration >= 2700); // > 45 min

  return {
    earlyGame: calculatePhaseStats(earlyGameMatches),
    midGame: calculatePhaseStats(midGameMatches),
    lateGame: calculatePhaseStats(lateGameMatches)
  };
}

/**
 * Calculate statistics for a game phase
 */
function calculatePhaseStats(matches: OpenDotaMatch[]) {
  if (matches.length === 0) {
    return { winRate: 0, avgDuration: '0:00' };
  }

  const wins = matches.filter(m => {
    const isRadiant = m.player_slot < 128;
    return (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
  }).length;

  const avgDuration = matches.reduce((sum, m) => sum + m.duration, 0) / matches.length;

  return {
    winRate: (wins / matches.length) * 100,
    avgDuration: formatDuration(avgDuration)
  };
}

/**
 * Analyze hero pool
 */
function analyzeHeroPool(heroes: OpenDotaPlayerHeroes[]): { mostPicked: Array<{ hero: string; games: number; winRate: number }>; mostBanned: Array<{ hero: string; bans: number; banRate: number }> } {
  const heroStats: HeroStat[] = aggregateHeroStats(heroes);
  const mostPicked = heroStats
    .sort((a, b) => b.games - a.games)
    .slice(0, 10)
    .map(hero => ({
      hero: hero.hero,
      games: hero.games,
      winRate: hero.winRate
    }));
  
  // For now, return empty mostBanned array since we don't have ban data
  const mostBanned: Array<{ hero: string; bans: number; banRate: number }> = [];
  
  return {
    mostPicked,
    mostBanned
  };
}

/**
 * Calculate team trends
 */
function calculateTeamTrends(players: OpenDotaPlayer[], matches: OpenDotaMatch[]) {
  const recentMatches = matches.slice(0, 20);
  const olderMatches = matches.slice(20, 40);

  const recentWinRate = calculateMatchWinRate(recentMatches);
  const olderWinRate = calculateMatchWinRate(olderMatches);

  const recentAvgKDA = calculateAverageKDA(recentMatches);
  const olderAvgKDA = calculateAverageKDA(olderMatches);

  return [
    {
      metric: 'Recent Performance',
      value: `${recentWinRate.toFixed(1)}%`,
      trend: recentWinRate > olderWinRate ? 'Improving' : 'Declining',
      direction: recentWinRate > olderWinRate ? 'up' as const : 'down' as const
    },
    {
      metric: 'Team KDA',
      value: recentAvgKDA.toFixed(2),
      trend: recentAvgKDA > olderAvgKDA ? 'Better coordination' : 'Needs improvement',
      direction: recentAvgKDA > olderAvgKDA ? 'up' as const : 'down' as const
    },
    {
      metric: 'Hero Diversity',
      value: `${getUniqueHeroes(matches).length} heroes`,
      trend: 'Good hero pool coverage',
      direction: 'neutral' as const
    }
  ];
}

/**
 * Aggregate hero statistics
 */
function aggregateHeroStats(heroes: OpenDotaPlayerHeroes[]): HeroStat[] {
  const heroMap = new Map<number, HeroStat>();
  for (const hero of heroes) {
    const heroId = hero.hero_id;
    const heroName = heroId ? String(heroId) : 'unknown';
    const existing = heroMap.get(heroId);
    if (existing) {
      existing.games += hero.games || 0;
      existing.wins += hero.win || 0;
    } else {
      heroMap.set(heroId, {
        hero: heroName,
        games: hero.games || 0,
        wins: hero.win || 0,
        winRate: 0
      });
    }
  }
  for (const stat of heroMap.values()) {
    stat.winRate = stat.games > 0 ? (stat.wins / stat.games) * 100 : 0;
  }
  return Array.from(heroMap.values());
}

/**
 * Determine player role based on stats
 */
function determinePlayerRole(player: OpenDotaPlayer): string {
  const gpm = player.gpm || 0;
  const xpm = player.xpm || 0;
  
  if (gpm > 600 && xpm > 600) return 'Carry';
  if (gpm > 500 && xpm > 500) return 'Mid';
  if (gpm > 400 && xpm > 400) return 'Offlane';
  return 'Support';
}

/**
 * Calculate win rate from matches
 */
function calculateMatchWinRate(matches: OpenDotaMatch[]): number {
  if (matches.length === 0) return 0;
  
  const wins = matches.filter(match => {
    const isRadiant = match.player_slot < 128;
    return (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);
  }).length;
  
  return (wins / matches.length) * 100;
}

/**
 * Calculate average KDA from matches
 */
function calculateAverageKDA(matches: OpenDotaMatch[]): number {
  if (matches.length === 0) return 0;
  
  const totalKDA = matches.reduce((sum, match) => {
    return sum + calculateKDA(match.kills, match.deaths, match.assists);
  }, 0);
  
  return totalKDA / matches.length;
}

/**
 * Get unique heroes from matches
 */
function getUniqueHeroes(matches: OpenDotaMatch[]): string[] {
  const heroes = new Set<string>();
  
  for (const match of matches) {
    if (match.hero_name) {
      heroes.add(getHeroDisplayName(match.hero_name));
    }
  }
  
  return Array.from(heroes);
} 
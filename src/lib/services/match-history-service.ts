/**
 * Match history processing service
 * 
 * Handles fetching and transforming match data from OpenDota API
 */

import type { OpenDotaMatch } from '@/types/opendota';
import { getPlayerMatches } from "../api";
import type { MatchHistory } from "../types/data-service";
import { formatDuration, logWithTimestamp } from "../utils";
import { getHeroDisplayName } from "../utils/data-calculations";

// Type for processed match object
export type ProcessedMatch = {
  id: string;
  date: string;
  opponent: string;
  result: string;
  score: string;
  duration: string;
  league: string;
  map: string;
  picks: string[];
  bans: string[];
  opponentPicks: string[];
  opponentBans: string[];
  draftOrder: string[];
  highlights: string[];
  playerStats: {
    kills: number;
    deaths: number;
    assists: number;
    gpm?: number;
    xpm?: number;
    hero: string;
    heroDamage?: number;
    towerDamage?: number;
    lastHits?: number;
    denies?: number;
  };
  games: Array<{
    picks: string[];
    bans: string[];
    opponentPicks: string[];
    opponentBans: string[];
    draftOrder: string[];
    highlights: string[];
    playerStats: {
      kills: number;
      deaths: number;
      assists: number;
      gpm?: number;
      xpm?: number;
    };
    duration: string;
    score: string;
  }>;
};

/**
 * Process match history for multiple players
 */
export async function getMatchHistory(
  accountIds: number[]
): Promise<MatchHistory | { status: string; signature: string }> {
  try {
    logWithTimestamp(`Fetching match history for ${accountIds.length} players`);

    // Fetch matches for all players in parallel
    const matchPromises = accountIds.map(accountId => getPlayerMatches(accountId));
    const matchResults = await Promise.all(matchPromises);

    // Check for errors
    const hasError = matchResults.some(result => 'error' in result);
    if (hasError) {
      return { status: 'error', signature: 'Failed to fetch match data' };
    }

    // Combine and deduplicate matches
    const allMatches = matchResults.flat() as OpenDotaMatch[];
    const uniqueMatches = deduplicateMatches(allMatches);
    
    // Sort by date (newest first)
    const sortedMatches = uniqueMatches.sort((a, b) => b.start_time - a.start_time);

    // Process matches into app format
    const processedMatches: ProcessedMatch[] = sortedMatches.slice(0, 50).map(match => processMatch(match));

    // Calculate summary statistics
    const summary = calculateMatchSummary(processedMatches);

    // Calculate trends
    const trends = calculateMatchTrends(processedMatches);

    return {
      summary,
      matches: processedMatches,
      trends
    };
  } catch (error) {
    logWithTimestamp(`Error fetching match history:`, error);
    return { status: 'error', signature: 'Failed to process match history' };
  }
}

/**
 * Deduplicate matches by match ID
 */
function deduplicateMatches(matches: OpenDotaMatch[]): OpenDotaMatch[] {
  const seen = new Set<number>();
  return matches.filter(match => {
    if (seen.has(match.match_id)) {
      return false;
    }
    seen.add(match.match_id);
    return true;
  });
}

function getOptionalNumberField(match: object, field: string): number | undefined {
  return (typeof field === 'string' && field in match && typeof (match as Record<string, unknown>)[field] === 'number')
    ? (match as Record<string, number>)[field]
    : undefined;
}

function getOptionalStringField(match: object, field: string): string | undefined {
  return (typeof field === 'string' && field in match && typeof (match as Record<string, unknown>)[field] === 'string')
    ? (match as Record<string, string>)[field]
    : undefined;
}

/**
 * Process individual match data
 */
function getPlayerStats(match: OpenDotaMatch): ProcessedMatch["playerStats"] {
  const heroName = getOptionalStringField(match, "hero_name");
  return {
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    gpm: getOptionalNumberField(match, "gold_per_min"),
    xpm: getOptionalNumberField(match, "xp_per_min"),
    hero: getHeroDisplayName(heroName || 'unknown'),
    heroDamage: getOptionalNumberField(match, "hero_damage"),
    towerDamage: getOptionalNumberField(match, "tower_damage"),
    lastHits: getOptionalNumberField(match, "last_hits"),
    denies: getOptionalNumberField(match, "denies")
  };
}

function getGameObject(match: OpenDotaMatch): ProcessedMatch["games"][number] {
  return {
    picks: [],
    bans: [],
    opponentPicks: [],
    opponentBans: [],
    draftOrder: [],
    highlights: generateHighlights(match),
    playerStats: {
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      gpm: getOptionalNumberField(match, "gold_per_min"),
      xpm: getOptionalNumberField(match, "xp_per_min")
    },
    duration: formatDuration(match.duration),
    score: `${match.kills}/${match.deaths}/${match.assists}`
  };
}

function processMatch(match: OpenDotaMatch): ProcessedMatch {
  const isRadiant = match.player_slot < 128;
  const radiantWin = match.radiant_win;
  const result = (isRadiant && radiantWin) || (!isRadiant && !radiantWin) ? 'Win' : 'Loss';
  return {
    id: match.match_id.toString(),
    date: new Date(match.start_time * 1000).toLocaleDateString(),
    opponent: 'Unknown Team',
    result,
    score: `${match.kills}/${match.deaths}/${match.assists}`,
    duration: formatDuration(match.duration),
    league: ("league" in match && match.league && typeof match.league === "object" && "name" in match.league) ? (match.league as { name?: string }).name || 'Unknown League' : 'Unknown League',
    map: 'Dota 2',
    picks: [],
    bans: [],
    opponentPicks: [],
    opponentBans: [],
    draftOrder: [],
    highlights: generateHighlights(match),
    playerStats: getPlayerStats(match),
    games: [getGameObject(match)]
  };
}

/**
 * Generate match highlights based on performance
 */
function generateHighlights(match: OpenDotaMatch): string[] {
  const highlights: string[] = [];
  
  if (match.kills >= 10) highlights.push('High Kill Count');
  if (match.assists >= 15) highlights.push('Excellent Support Play');
  if (match.gold_per_min >= 600) highlights.push('Strong Farming');
  if (match.xp_per_min >= 600) highlights.push('Good Experience Gain');
  if (match.hero_damage >= 20000) highlights.push('High Hero Damage');
  if (match.tower_damage >= 5000) highlights.push('Strong Push');
  if (match.last_hits >= 200) highlights.push('Excellent Last Hitting');
  
  return highlights;
}

/**
 * Calculate match summary statistics
 */
function calculateMatchSummary(matches: ProcessedMatch[]): {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgGameLength: string;
  longestWinStreak: number;
  currentStreak: number;
} {
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.result === 'Win').length;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  
  // Calculate average game length
  const totalDuration = matches.reduce((sum, match) => {
    const duration = match.duration;
    const minutes = parseInt(duration.split(':')[0]);
    const seconds = parseInt(duration.split(':')[1]);
    return sum + (minutes * 60 + seconds);
  }, 0);
  const avgGameLength = totalMatches > 0 ? formatDuration(totalDuration / totalMatches) : '0:00';
  
  // Calculate streaks
  const streaks = calculateStreaks(matches);
  
  return {
    totalMatches,
    wins,
    losses: totalMatches - wins,
    winRate,
    avgGameLength,
    longestWinStreak: streaks.longest,
    currentStreak: streaks.current
  };
}

/**
 * Calculate win/loss streaks
 */
function calculateStreaks(matches: ProcessedMatch[]): { longest: number; current: number } {
  let currentStreak = 0;
  let longestStreak = 0;
  let currentDirection: 'win' | 'loss' | null = null;

  function updateStreak(isWin: boolean) {
    if (currentDirection === null) {
      currentDirection = isWin ? 'win' : 'loss';
      currentStreak = 1;
    } else if ((currentDirection === 'win' && isWin) || (currentDirection === 'loss' && !isWin)) {
      currentStreak++;
    } else {
      if (currentDirection === 'win') {
        longestStreak = Math.max(longestStreak, currentStreak);
      }
      currentDirection = isWin ? 'win' : 'loss';
      currentStreak = 1;
    }
  }

  for (const match of matches) {
    updateStreak(match.result === 'Win');
  }

  // Check final streak
  if (currentDirection === 'win') {
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return {
    longest: longestStreak,
    current: currentDirection === 'win' ? currentStreak : -currentStreak
  };
}

/**
 * Calculate match trends
 */
function calculateMatchTrends(matches: ProcessedMatch[]): Array<{ metric: string; value: string; trend: string; direction: 'up' | 'down' }> {
  if (matches.length < 2) return [];
  
  const recentMatches = matches.slice(0, 10);
  const olderMatches = matches.slice(10, 20);
  
  const recentWinRate = calculateWinRate(recentMatches);
  const olderWinRate = calculateWinRate(olderMatches);
  
  const recentAvgKills = calculateAverageKills(recentMatches);
  const olderAvgKills = calculateAverageKills(olderMatches);
  
  return [
    {
      metric: 'Recent Win Rate',
      value: `${recentWinRate.toFixed(1)}%`,
      trend: recentWinRate > olderWinRate ? 'Improving' : 'Declining',
      direction: recentWinRate > olderWinRate ? 'up' as const : 'down' as const
    },
    {
      metric: 'Average Kills',
      value: recentAvgKills.toFixed(1),
      trend: recentAvgKills > olderAvgKills ? 'More Aggressive' : 'More Defensive',
      direction: recentAvgKills > olderAvgKills ? 'up' as const : 'down' as const
    }
  ];
}

/**
 * Calculate win rate from matches
 */
function calculateWinRate(matches: ProcessedMatch[]): number {
  if (matches.length === 0) return 0;
  const wins = matches.filter(m => m.result === 'Win').length;
  return (wins / matches.length) * 100;
}

/**
 * Calculate average kills from matches
 */
function calculateAverageKills(matches: ProcessedMatch[]): number {
  if (matches.length === 0) return 0;
  const totalKills = matches.reduce((sum, match) => {
    const kills = parseInt(match.playerStats.kills) || 0;
    return sum + kills;
  }, 0);
  return totalKills / matches.length;
} 
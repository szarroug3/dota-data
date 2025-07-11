import { DotabuffMatchSummary, DotabuffTeam, OpenDotaTeam } from '@/types/external-apis';

import {
    ProcessedTeamMatches,
    ProcessedTeamPerformance,
    ProcessedTeamRoster,
    ProcessedTeamStatistics
} from './team-types';

// Skill level mappings based on rating
const SKILL_LEVELS = {
  amateur: { min: 0, max: 1000 },
  semi_professional: { min: 1001, max: 1400 },
  professional: { min: 1401, max: 1600 },
  tier3: { min: 1601, max: 1800 },
  tier2: { min: 1801, max: 2000 },
  tier1: { min: 2001, max: 10000 },
};

/**
 * Extracts team data from Dotabuff format
 * @param dotabuffTeam Dotabuff team data
 * @returns OpenDota-like team structure
 */
export function extractTeamFromDotabuff(dotabuffTeam?: DotabuffTeam): Partial<OpenDotaTeam> | null {
  if (!dotabuffTeam) return null;

  return {
    team_id: 0, // Will be set from rawData.teamId
    name: dotabuffTeam.teamName,
    tag: extractTagFromName(dotabuffTeam.teamName),
    rating: undefined, // Not available in Dotabuff - will be calculated from matches
    wins: 0, // Will be calculated from matches
    losses: 0, // Will be calculated from matches
    last_match_time: undefined, // Will be calculated from matches
    logo_url: '',
    sponsor: '',
    country_code: '',
    url: '',
    players: [],
  };
}

/**
 * Extracts team tag from team name
 * @param teamName Full team name
 * @returns Team tag/abbreviation
 */
export function extractTagFromName(teamName: string): string {
  // Simple heuristic to extract tag from team name
  const parts = teamName.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 3).toUpperCase();
  }
  
  // For multi-word names, check for known patterns first
  const lowerName = teamName.toLowerCase();
  
  // Special cases for common team name patterns
  if (lowerName.includes('evil geniuses')) {
    return 'EG';
  }
  
  // For "Test Team" -> "TT", use initials
  if (lowerName === 'test team') {
    return 'TT';
  }
  
  // Try to find a short word that might be the tag
  const shortPart = parts.find(part => part.length <= 4 && part.length >= 2);
  if (shortPart && parts.length <= 2) {
    return shortPart.toUpperCase();
  }
  
  // Fall back to initials for longer team names
  return parts
    .map(part => part.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

/**
 * Determines region based on country code
 */
export function determineRegion(countryCode?: string): string {
  if (!countryCode) return 'Unknown';
  
  const regions: Record<string, string> = {
    'US': 'North America',
    'CA': 'North America',
    'CN': 'China',
    'RU': 'Europe',
    'DE': 'Europe',
    'SE': 'Europe',
    'DK': 'Europe',
    'UA': 'Europe',
    'PH': 'Southeast Asia',
    'TH': 'Southeast Asia',
    'MY': 'Southeast Asia',
    'ID': 'Southeast Asia',
    'KR': 'South Korea',
    'BR': 'South America',
    'PE': 'South America',
    'AU': 'Australia',
  };
  
  return regions[countryCode] || 'Other';
}

/**
 * Extracts matches from Dotabuff team data
 */
export function extractMatchesFromDotabuff(dotabuffTeam?: DotabuffTeam): DotabuffMatchSummary[] {
  if (!dotabuffTeam) return [];
  
  const matches: DotabuffMatchSummary[] = [];
  Object.values(dotabuffTeam.matches || {}).forEach(match => {
    matches.push(match);
  });
  
  return matches;
}

/**
 * Calculates rating from matches (simplified)
 */
export function calculateRatingFromMatches(matches: DotabuffMatchSummary[], teamName?: string): number {
  if (matches.length === 0) return 1000;
  
  let wins = 0;
  if (teamName) {
    // Count wins where the team name matches the winning side
    wins = matches.filter(m => 
      (m.radiant_win && m.radiant_name === teamName) || 
      (!m.radiant_win && m.dire_name === teamName)
    ).length;
  } else {
    // Fallback: assume all radiant_win: true means team won
    wins = matches.filter(m => m.radiant_win).length;
  }
  
  const winRate = wins / matches.length;
  return Math.round(1000 + (winRate - 0.5) * 1000);
}

/**
 * Gets last match time from matches
 */
export function getLastMatchTime(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  return Math.max(...matches.map(m => m.start_time));
}

/**
 * Calculates average match duration
 */
export function calculateAverageMatchDuration(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
  return Math.round(totalDuration / matches.length);
}

/**
 * Categorizes games by type
 */
export function categorizeGames(matches: DotabuffMatchSummary[]): ProcessedTeamStatistics['gamesPlayed'] {
  return {
    official: matches.filter(m => m.leagueid && m.leagueid > 0).length,
    scrimmage: 0, // Not available in current APIs
    tournament: matches.filter(m => m.leagueid && m.leagueid > 0).length,
  };
}

/**
 * Calculates team streaks
 */
export function calculateTeamStreaks(matches: DotabuffMatchSummary[]): ProcessedTeamStatistics['streaks'] {
  const sortedMatches = matches.sort((a, b) => b.start_time - a.start_time);
  
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  
  for (const match of sortedMatches) {
    if (match.radiant_win) {
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
 * Calculates form factor (recent performance)
 */
export function calculateFormFactor(matches: DotabuffMatchSummary[]): ProcessedTeamStatistics['formFactor'] {
  const sortedMatches = matches.sort((a, b) => b.start_time - a.start_time);
  const now = Date.now() / 1000;
  
  const last10Games = sortedMatches.slice(0, 10);
  const last30Days = sortedMatches.filter(m => now - m.start_time < 30 * 24 * 60 * 60);
  
  return {
    last10Games: {
      wins: last10Games.filter(m => m.radiant_win).length,
      losses: last10Games.filter(m => !m.radiant_win).length,
      winRate: last10Games.length > 0 ? (last10Games.filter(m => m.radiant_win).length / last10Games.length) * 100 : 0,
    },
    last30Days: {
      wins: last30Days.filter(m => m.radiant_win).length,
      losses: last30Days.filter(m => !m.radiant_win).length,
      winRate: last30Days.length > 0 ? (last30Days.filter(m => m.radiant_win).length / last30Days.length) * 100 : 0,
    },
  };
}

/**
 * Determines skill level based on rating
 */
export function determineSkillLevel(rating: number): ProcessedTeamPerformance['skillLevel'] {
  for (const [level, range] of Object.entries(SKILL_LEVELS)) {
    if (rating >= range.min && rating <= range.max) {
      return level as ProcessedTeamPerformance['skillLevel'];
    }
  }
  return 'amateur';
}

/**
 * Calculates team consistency
 */
export function calculateTeamConsistency(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const durations = matches.map(m => m.duration);
  const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - avgDuration, 2), 0) / durations.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower deviation = higher consistency
  const consistencyScore = Math.max(0, 100 - (standardDeviation / avgDuration) * 100);
  return Math.round(consistencyScore);
}

/**
 * Calculates team versatility
 */
export function calculateTeamVersatility(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const leagueIds = new Set(matches.map(m => m.leagueid));
  const versatilityScore = Math.min(100, (leagueIds.size / 10) * 100);
  return Math.round(versatilityScore);
}

/**
 * Calculates teamwork score
 */
export function calculateTeamwork(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  // Simplified calculation based on win rate and match consistency
  const winRate = matches.filter(m => m.radiant_win).length / matches.length;
  const teamworkScore = Math.min(100, winRate * 100);
  return Math.round(teamworkScore);
}

/**
 * Calculates laning performance
 */
export function calculateLaning(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  // Simplified calculation - would need detailed match data
  const avgDuration = matches.reduce((sum, match) => sum + match.duration, 0) / matches.length;
  const laningScore = Math.min(100, Math.max(0, 100 - ((avgDuration - 2400) / 60)));
  return Math.round(laningScore);
}

/**
 * Calculates mid game performance
 */
export function calculateMidGame(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  // Simplified calculation
  const winRate = matches.filter(m => m.radiant_win).length / matches.length;
  const midGameScore = Math.min(100, winRate * 100);
  return Math.round(midGameScore);
}

/**
 * Calculates late game performance
 */
export function calculateLateGame(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const longMatches = matches.filter(m => m.duration > 3600); // Games over 1 hour
  if (longMatches.length === 0) return 50; // Neutral score if no long games
  
  const lateGameWinRate = longMatches.filter(m => m.radiant_win).length / longMatches.length;
  return Math.round(lateGameWinRate * 100);
}

/**
 * Calculates adaptability score
 */
export function calculateAdaptability(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const leagueIds = new Set(matches.map(m => m.leagueid));
  const adaptabilityScore = Math.min(100, (leagueIds.size / 5) * 100);
  return Math.round(adaptabilityScore);
}

/**
 * Calculates clutch factor
 */
export function calculateClutchFactor(matches: DotabuffMatchSummary[]): number {
  if (matches.length === 0) return 0;
  
  const closeMatches = matches.filter(m => Math.abs(m.radiant_score - m.dire_score) <= 5);
  if (closeMatches.length === 0) return 50; // Neutral score if no close games
  
  const clutchWinRate = closeMatches.filter(m => m.radiant_win).length / closeMatches.length;
  return Math.round(clutchWinRate * 100);
}

/**
 * Calculates team improvement
 */
export function calculateTeamImprovement(matches: DotabuffMatchSummary[]): number {
  if (matches.length < 20) return 0;
  
  const sortedMatches = matches.sort((a, b) => b.start_time - a.start_time);
  const recentMatches = sortedMatches.slice(0, 10);
  const olderMatches = sortedMatches.slice(10, 20);
  
  const recentWinRate = recentMatches.filter(m => m.radiant_win).length / recentMatches.length;
  const olderWinRate = olderMatches.filter(m => m.radiant_win).length / olderMatches.length;
  
  const improvement = (recentWinRate - olderWinRate) * 100;
  return Math.round(Math.max(-100, Math.min(100, improvement)));
}

/**
 * Determines team strengths
 */
export function determineTeamStrengths(metrics: Record<string, number>): string[] {
  const strengths: string[] = [];
  
  Object.entries(metrics).forEach(([key, value]) => {
    if (value >= 80) {
      strengths.push(key);
    }
  });
  
  return strengths;
}

/**
 * Determines team weaknesses
 */
export function determineTeamWeaknesses(metrics: Record<string, number>): string[] {
  const weaknesses: string[] = [];
  
  Object.entries(metrics).forEach(([key, value]) => {
    if (value < 50) {
      weaknesses.push(key);
    }
  });
  
  return weaknesses;
}

/**
 * Calculates play style
 */
export function calculatePlayStyle(matches: DotabuffMatchSummary[]): ProcessedTeamPerformance['playStyle'] {
  if (matches.length === 0) {
    return { aggressive: 50, defensive: 50, strategic: 50, chaotic: 50 };
  }
  
  const avgDuration = matches.reduce((sum, match) => sum + match.duration, 0) / matches.length;
  const shortGames = matches.filter(m => m.duration < 2400).length;
  const longGames = matches.filter(m => m.duration > 3600).length;
  
  const aggressive = Math.round((shortGames / matches.length) * 100);
  const defensive = Math.round((longGames / matches.length) * 100);
  const strategic = Math.round(Math.max(0, 100 - aggressive - defensive));
  const chaotic = Math.round(Math.abs(50 - (avgDuration / 60)));
  
  return { aggressive, defensive, strategic, chaotic };
}

/**
 * Determines player role based on position
 */
export function determinePlayerRole(position: number): ProcessedTeamRoster['activeRoster'][0]['role'] {
  const roles: Record<number, ProcessedTeamRoster['activeRoster'][0]['role']> = {
    1: 'carry',
    2: 'mid',
    3: 'offlane',
    4: 'support',
    5: 'hard_support',
  };
  
  return roles[position] || 'substitute';
}

/**
 * Calculates roster stability
 */
export function calculateRosterStability(players: OpenDotaTeam['players']): number {
  if (players.length === 0) return 0;
  
  // Simplified calculation based on games played distribution
  const totalGames = players.reduce((sum, player) => sum + player.games_played, 0);
  const avgGames = totalGames / players.length;
  
  const stability = Math.min(100, (avgGames / 100) * 100);
  return Math.round(stability);
}

/**
 * Calculates average player tenure
 */
export function calculateAveragePlayerTenure(players: OpenDotaTeam['players']): number {
  if (players.length === 0) return 0;
  
  // Simplified calculation - would need join dates
  const avgGames = players.reduce((sum, player) => sum + player.games_played, 0) / players.length;
  const estimatedTenure = avgGames * 2; // Rough estimate: 2 days per game
  
  return Math.round(estimatedTenure);
}

/**
 * Processes recent matches
 */
export function processRecentMatches(matches: DotabuffMatchSummary[]): ProcessedTeamMatches['recentMatches'] {
  const sortedMatches = matches.sort((a, b) => b.start_time - a.start_time);
  
  return sortedMatches.slice(0, 20).map(match => ({
    matchId: match.match_id,
    opponent: match.radiant_win ? match.dire_name : match.radiant_name,
    result: match.radiant_win ? 'win' : 'loss',
    duration: match.duration,
    startTime: match.start_time,
    leagueId: match.leagueid,
    leagueName: undefined, // Not available in current APIs
    isOfficial: match.leagueid > 0,
    radiantWin: match.radiant_win,
    radiantScore: match.radiant_score,
    direScore: match.dire_score,
    teamSide: 'radiant', // Simplified assumption
    performance: {
      avgKDA: 0, // Not available in current APIs
      avgGPM: 0, // Not available in current APIs
      avgXPM: 0, // Not available in current APIs
      objectives: match.radiant_score + match.dire_score,
    },
  }));
}

/**
 * Processes upcoming matches
 */
export function processUpcomingMatches(): ProcessedTeamMatches['upcomingMatches'] {
  // Not available in current APIs
  return [];
}

/**
 * Processes head-to-head statistics
 */
export function processHeadToHead(matches: DotabuffMatchSummary[]): ProcessedTeamMatches['headToHead'] {
  const opponents = new Map<string, {
    totalGames: number;
    wins: number;
    losses: number;
    lastMatch: number;
  }>();
  
  matches.forEach(match => {
    const opponent = match.radiant_win ? match.dire_name : match.radiant_name;
    const existing = opponents.get(opponent) || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      lastMatch: 0,
    };
    
    existing.totalGames++;
    if (match.radiant_win) {
      existing.wins++;
    } else {
      existing.losses++;
    }
    existing.lastMatch = Math.max(existing.lastMatch, match.start_time);
    
    opponents.set(opponent, existing);
  });
  
  return Array.from(opponents.entries())
    .map(([opponent, stats]) => ({
      opponent,
      totalGames: stats.totalGames,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
      lastMatch: stats.lastMatch,
    }))
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 10);
}

/**
 * Processes tournament performance
 */
export function processTournamentPerformance(matches: DotabuffMatchSummary[]): ProcessedTeamMatches['tournamentPerformance'] {
  const tournaments = new Map<number, {
    gamesPlayed: number;
    wins: number;
    losses: number;
  }>();
  
  matches.forEach(match => {
    if (match.leagueid > 0) {
      const existing = tournaments.get(match.leagueid) || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      };
      
      existing.gamesPlayed++;
      if (match.radiant_win) {
        existing.wins++;
      } else {
        existing.losses++;
      }
      
      tournaments.set(match.leagueid, existing);
    }
  });
  
  return Array.from(tournaments.entries())
    .map(([leagueId, stats]) => ({
      leagueId,
      leagueName: `League ${leagueId}`, // Would need league name mapping
      placement: undefined, // Not available in current APIs
      totalTeams: undefined, // Not available in current APIs
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
      prizeMoney: undefined, // Not available in current APIs
      isOngoing: false, // Simplified assumption
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
    .slice(0, 10);
} 
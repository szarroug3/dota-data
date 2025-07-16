/**
 * Team utility functions
 * 
 * Provides utility functions for processing team data, filtering by league,
 * determining team sides in matches, and extracting player data.
 */

import type { Match, Player } from '@/types/contexts/team-types';
import type { DotabuffMatchSummary, DotabuffTeam, OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// ============================================================================
// LEAGUE FILTERING
// ============================================================================

/**
 * Filter team matches by league ID
 */
export function getTeamMatchesForLeague(team: DotabuffTeam, leagueId: string): DotabuffMatchSummary[] {
  return team.matches.filter(match => match.leagueId === leagueId);
}

// ============================================================================
// TEAM SIDE DETERMINATION
// ============================================================================

/**
 * Determine which side (radiant/dire) the team was on in a match
 */
export function determineTeamSide(matchSummary: DotabuffMatchSummary, matchData: OpenDotaMatch): 'radiant' | 'dire' {
  const teamWon = matchSummary.result === 'won';
  const radiantWon = matchData.radiant_win;
  
  // If team won and radiant won, team was radiant
  // If team won and dire won, team was dire
  // If team lost and radiant won, team was dire
  // If team lost and dire won, team was radiant
  return (teamWon === radiantWon) ? 'radiant' : 'dire';
}

// ============================================================================
// PLAYER EXTRACTION
// ============================================================================

/**
 * Extract players from the team's side in a match
 */
export function extractTeamPlayers(matchData: OpenDotaMatch, teamSide: 'radiant' | 'dire'): OpenDotaMatchPlayer[] {
  return matchData.players.filter(player => {
    const isRadiant = player.player_slot < 128; // OpenDota convention
    return (teamSide === 'radiant' && isRadiant) || (teamSide === 'dire' && !isRadiant);
  });
}

/**
 * Convert OpenDota player to internal Player format
 */
export function convertOpenDotaPlayerToPlayer(
  openDotaPlayer: OpenDotaMatchPlayer, 
  teamId: string
): Player {
  return {
    id: openDotaPlayer.account_id.toString(),
    name: openDotaPlayer.personaname || `Player ${openDotaPlayer.account_id}`,
    accountId: openDotaPlayer.account_id,
    teamId,
    role: undefined, // Will be determined later if needed
    totalMatches: 1, // Will be aggregated later
    winRate: openDotaPlayer.win ? 100 : 0, // Will be aggregated later
    lastUpdated: new Date().toISOString()
  };
}

// ============================================================================
// MATCH CONVERSION
// ============================================================================

/**
 * Convert Dotabuff match summary and OpenDota match data to internal Match format
 */
export function convertToMatch(
  matchSummary: DotabuffMatchSummary,
  matchData: OpenDotaMatch,
  teamId: string,
  leagueId: string
): Match {
  const teamSide = determineTeamSide(matchSummary, matchData);
  const teamPlayers = extractTeamPlayers(matchData, teamSide);
  
  return {
    id: matchSummary.matchId,
    teamId,
    leagueId,
    opponent: matchSummary.opponentName,
    result: matchSummary.result === 'won' ? 'win' : 'loss',
    date: new Date(matchSummary.startTime * 1000).toISOString(),
    duration: matchSummary.duration,
    teamSide,
    players: teamPlayers.map(player => convertOpenDotaPlayerToPlayer(player, teamId)),
    heroes: teamPlayers.map(player => player.hero_id.toString())
  };
}

// ============================================================================
// PLAYER AGGREGATION
// ============================================================================

/**
 * Aggregate players from multiple matches, deduplicating by account ID
 */
export function aggregatePlayers(matches: Match[]): Player[] {
  const playerMap = new Map<string, Player>();
  
  matches.forEach(match => {
    match.players.forEach(player => {
      const existingPlayer = playerMap.get(player.id);
      
      if (existingPlayer) {
        // Update existing player stats
        const totalMatches = existingPlayer.totalMatches + player.totalMatches;
        const totalWins = Math.round((existingPlayer.winRate * existingPlayer.totalMatches / 100) + 
                                   (player.winRate * player.totalMatches / 100));
        const newWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
        
        playerMap.set(player.id, {
          ...existingPlayer,
          totalMatches,
          winRate: newWinRate,
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Add new player
        playerMap.set(player.id, player);
      }
    });
  });
  
  return Array.from(playerMap.values());
}

// ============================================================================
// TEAM SUMMARY CALCULATION
// ============================================================================

/**
 * Calculate team summary from matches
 */
export function calculateTeamSummary(matches: Match[]): {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  lastMatchDate: string | null;
  averageMatchDuration: number;
  totalPlayers: number;
} {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      lastMatchDate: null,
      averageMatchDuration: 0,
      totalPlayers: 0
    };
  }
  
  const totalWins = matches.filter(match => match.result === 'win').length;
  const totalLosses = matches.filter(match => match.result === 'loss').length;
  const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
  
  // Get unique players from all matches
  const uniquePlayers = new Set<string>();
  matches.forEach(match => {
    match.players.forEach(player => {
      uniquePlayers.add(player.id);
    });
  });
  
  return {
    totalMatches: matches.length,
    totalWins,
    totalLosses,
    overallWinRate: (totalWins / matches.length) * 100,
    lastMatchDate: matches[0]?.date || null,
    averageMatchDuration: totalDuration / matches.length,
    totalPlayers: uniquePlayers.size
  };
} 
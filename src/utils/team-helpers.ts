/**
 * Team Helper Functions
 * 
 * Utility functions for team operations and data processing.
 * Extracted from team context to improve code organization.
 */

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// TEAM KEY GENERATION
// ============================================================================

/**
 * Generate a team key from team ID and league ID
 */
export function generateTeamKey(teamId: string, leagueId: string): string {
  return `${teamId}-${leagueId}`;
}

// ============================================================================
// TEAM SIDE DETERMINATION
// ============================================================================

/**
 * Determine team side from match data
 */
export function determineTeamSideFromMatch(match: Match, teamId: string): 'radiant' | 'dire' {
  if (match.radiantTeamId === teamId) {
    return 'radiant';
  } else if (match.direTeamId === teamId) {
    return 'dire';
  }
  
  // If we can't determine the side, throw an error
  throw new Error(`Could not determine team side for team ${teamId} in match ${match.id}`);
}

// ============================================================================
// PLAYER EXTRACTION
// ============================================================================

/**
 * Extract player IDs from a specific team side in a match
 */
export function extractPlayersFromMatchSide(
  match: Match,
  teamSide: 'radiant' | 'dire'
): string[] {
  const players = teamSide === 'radiant' ? match.players.radiant : match.players.dire;
  return players.map(player => player.playerId);
}

// ============================================================================
// TEAM DATA CREATION
// ============================================================================

/**
 * Create basic team data structure
 */
export function createBasicTeamData(processedTeam: { team: DotabuffTeam; league: DotabuffLeague }): TeamData {
  return {
    team: {
      id: processedTeam.team.id,
      name: processedTeam.team.name,
      isActive: false,
      isLoading: false,
      error: undefined
    },
    league: {
      id: processedTeam.league.id,
      name: processedTeam.league.name
    },
    matches: [], // Will be populated with correct sides
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      heroUsage: {
        picks: [],
        bans: [],
        picksAgainst: [],
        bansAgainst: [],
        picksByPlayer: {}
      },
      draftStats: {
        firstPickCount: 0,
        secondPickCount: 0,
        firstPickWinRate: 0,
        secondPickWinRate: 0,
        uniqueHeroesPicked: 0,
        uniqueHeroesBanned: 0,
        mostPickedHero: '',
        mostBannedHero: ''
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    }
  };
}

// ============================================================================
// TEAM PERFORMANCE UPDATES
// ============================================================================

/**
 * Update team performance based on matches
 */
export function updateTeamPerformance(
  team: TeamData,
  matchesWithCorrectSides: Array<{ matchId: string; side: 'radiant' | 'dire'; opponentTeamName: string }>,
  originalTeamData: { matches: Array<{ matchId: string; result: string }> }
): TeamData {
  return {
    ...team,
    matches: matchesWithCorrectSides,
    performance: {
      ...team.performance,
      totalMatches: matchesWithCorrectSides.length,
      totalWins: matchesWithCorrectSides.filter(match => {
        // We need to determine win/loss from the original match summary data
        const originalMatch = originalTeamData.matches.find(m => m.matchId === match.matchId);
        return originalMatch?.result === 'won';
      }).length,
      totalLosses: matchesWithCorrectSides.filter(match => {
        const originalMatch = originalTeamData.matches.find(m => m.matchId === match.matchId);
        return originalMatch?.result === 'lost';
      }).length
    }
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that an active team is selected
 */
export function validateActiveTeam(activeTeam: { teamId: string; leagueId: string } | null): { teamId: string; leagueId: string } {
  if (!activeTeam) {
    throw new Error('No active team selected');
  }
  return activeTeam;
} 
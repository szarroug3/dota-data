/**
 * Team Processing Logic
 *
 * Extracted from team-helpers.ts to separate complex processing logic
 * from state management. This module handles all data transformation and
 * analysis for team data.
 */

import type { Match, MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// TEAM SIDE DETERMINATION
// ============================================================================

/**
 * Determine team side from match data
 */
export function determineTeamSideFromMatch(match: Match, teamId: number): 'radiant' | 'dire' {
  // Check if we have team IDs in the processed match data
  if (match.radiant.id && match.radiant.id === teamId) {
    return 'radiant';
  } else if (match.dire.id && match.dire.id === teamId) {
    return 'dire';
  }

  // If we can't determine the side, throw an error
  throw new Error(
    `Could not determine team side for team ${teamId} in match ${match.id}. Radiant ID: ${match.radiant.id}, Dire ID: ${match.dire.id}`,
  );
}

// ============================================================================
// PLAYER EXTRACTION
// ============================================================================

/**
 * Extract player IDs from a specific team side in a match
 */
export function extractPlayersFromMatchSide(match: Match, side: 'radiant' | 'dire'): number[] {
  const players = side === 'radiant' ? match.players.radiant : match.players.dire;
  return players.map((player) => player.accountId);
}

/**
 * Extract all player IDs from a match for a specific team
 */
export function extractPlayersFromMatchForTeam(match: Match, teamId: number): number[] {
  const side = determineTeamSideFromMatch(match, teamId);
  return extractPlayersFromMatchSide(match, side);
}

// ============================================================================
// TEAM PERFORMANCE CALCULATION
// ============================================================================

/**
 * Calculate team performance metrics from matches
 */
export function calculateTeamPerformance(
  team: TeamData,
  summaryData: { matches: Array<{ result: 'win' | 'loss' }> },
): TeamData['performance'] {
  const totalMatches = summaryData.matches.length;
  const totalWins = summaryData.matches.filter((match) => match.result === 'win').length;
  const totalLosses = totalMatches - totalWins;
  const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

  return {
    ...team.performance,
    totalMatches,
    totalWins,
    totalLosses,
    overallWinRate,
  };
}

// ============================================================================
// PLAYER DATA PROCESSING
// ============================================================================

/**
 * Create team player data from OpenDota player data
 */
export function createTeamPlayerFromOpenDota(player: OpenDotaPlayerComprehensive): TeamData['players'][0] {
  return {
    accountId: player.profile.profile.account_id,
    playerName: player.profile.profile.personaname || 'Unknown Player',
    roles: [], // Will be populated based on match data
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    averageKDA: 0,
    averageGPM: 0,
    averageXPM: 0,
    averageLastHits: 0,
    averageDenies: 0,
  };
}

/**
 * Process match and extract players for team
 */
function validateMatch(match: Match | null, matchId: number, teamId: number): boolean {
  if (!match) {
    console.warn(`Match ${matchId} not found for team ${teamId}`);
    return false;
  }

  if (match.isLoading) {
    return false;
  }

  if (match.error) {
    console.warn(`Match ${matchId} has error for team ${teamId}: ${match.error}`);
    return false;
  }

  return true;
}

function processPlayersFromMatch(
  match: Match,
  teamSide: 'radiant' | 'dire',
  playerContext: PlayerContextValue,
): Promise<void> {
  const playerIds = extractPlayersFromMatchSide(match, teamSide);
  return Promise.all(playerIds.map((playerId) => playerContext.addPlayer(playerId))).then(() => {});
}

function createMatchParticipation(
  matchId: number,
  match: Match,
  teamSide: 'radiant' | 'dire',
  pickOrder: 'first' | 'second' | null,
): TeamMatchParticipation {
  const opponentName = teamSide === 'radiant' ? match.dire.name : match.radiant.name;

  return {
    matchId,
    result: (match.result === teamSide ? 'won' : 'lost') as 'won' | 'lost',
    duration: match.duration,
    opponentName: opponentName || '',
    leagueId: '',
    startTime: new Date(match.date).getTime(),
    side: teamSide,
    pickOrder,
  };
}

export async function processMatchAndExtractPlayers(
  matchId: number,
  teamId: number,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  knownTeamSide?: 'radiant' | 'dire',
  forceRefresh = false,
): Promise<TeamMatchParticipation | null> {
  try {
    const match = forceRefresh ? await matchContext.refreshMatch(matchId) : await matchContext.addMatch(matchId);

    if (!validateMatch(match, matchId, teamId)) {
      return null;
    }

    // At this point, match is guaranteed to be non-null due to validateMatch
    const validMatch = match!;
    const teamSide = knownTeamSide || determineTeamSideFromMatch(validMatch, teamId);
    const pickOrder = validMatch.pickOrder?.[teamSide] || null;

    await processPlayersFromMatch(validMatch, teamSide, playerContext);

    return createMatchParticipation(matchId, validMatch, teamSide, pickOrder);
  } catch (error) {
    console.error(`Error processing match ${matchId} for team ${teamId}:`, error);
    return null;
  }
}

// ============================================================================
// DATA CLEANUP
// ============================================================================

/**
 * Clean up unused data when a team is removed
 */
export function cleanupUnusedData(
  teamToRemove: TeamData,
  remainingTeams: TeamData[],
  matchContext: { removeMatch: (matchId: number) => void },
  playerContext: { removePlayer: (playerId: number) => void },
) {
  // Get all match IDs from remaining teams
  const remainingMatchIds = new Set<number>();
  remainingTeams.forEach((team) => {
    Object.keys(team.matches).forEach((matchId) => {
      remainingMatchIds.add(Number(matchId));
    });
  });

  // Get all player IDs from remaining teams
  const remainingPlayerIds = new Set<number>();
  remainingTeams.forEach((team) => {
    team.players.forEach((player) => {
      remainingPlayerIds.add(player.accountId);
    });
  });

  // Remove matches that are no longer used by any team
  Object.keys(teamToRemove.matches).forEach((matchId) => {
    if (!remainingMatchIds.has(Number(matchId))) {
      matchContext.removeMatch(Number(matchId));
    }
  });

  // Remove players that are no longer used by any team
  teamToRemove.players.forEach((player) => {
    if (!remainingPlayerIds.has(player.accountId)) {
      playerContext.removePlayer(player.accountId);
    }
  });
}

// ============================================================================
// TEAM DATA VALIDATION
// ============================================================================

/**
 * Validate active team data
 */
export function validateActiveTeam(activeTeam: { teamId: number; leagueId: number } | null): {
  teamId: number;
  leagueId: number;
} {
  if (!activeTeam || !activeTeam.teamId || !activeTeam.leagueId) {
    throw new Error('Invalid active team data');
  }

  return {
    teamId: activeTeam.teamId,
    leagueId: activeTeam.leagueId,
  };
}

/**
 * Generate a unique key for a team
 */
export function generateTeamKey(teamId: number, leagueId: number): string {
  return `${teamId}-${leagueId}`;
}

/**
 * Create initial team data with loading state
 */
export function createInitialTeamData(teamId: number, leagueId: number): TeamData {
  return {
    team: {
      id: teamId,
      name: `Loading ${teamId}`,
    },
    league: {
      id: leagueId,
      name: `Loading ${leagueId}`,
    },
    timeAdded: new Date().toISOString(),
    matches: {},
    manualMatches: {},
    manualPlayers: [],
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      erroredMatches: 0,
      heroUsage: {
        picks: [],
        bans: [],
        picksAgainst: [],
        bansAgainst: [],
        picksByPlayer: {},
      },
      draftStats: {
        firstPickCount: 0,
        secondPickCount: 0,
        firstPickWinRate: 0,
        secondPickWinRate: 0,
        uniqueHeroesPicked: 0,
        uniqueHeroesBanned: 0,
        mostPickedHero: '',
        mostBannedHero: '',
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0,
    },
    isLoading: true,
  };
}

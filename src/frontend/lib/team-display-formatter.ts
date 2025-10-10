/**
 * Team Display Formatter
 * Converts internal Team data to UI display format
 */

import type { TeamDisplayData, Team, TeamPerformanceSummary } from './app-data-types';

/**
 * Format a single team for UI display
 * Returns a minimal structure - will be extended with computed data in future steps
 */
export function formatTeamForDisplay(team: Team, performance?: TeamPerformanceSummary): TeamDisplayData {
  // Build user-friendly error message from team-specific errors
  let errorMessage: string | undefined;
  if (team.teamError && team.leagueError) {
    errorMessage = 'Failed to fetch team and league';
  } else if (team.teamError) {
    errorMessage = 'Failed to fetch team';
  } else if (team.leagueError) {
    errorMessage = 'Failed to fetch league';
  }

  const manualPlayerIds = Array.from(team.players.entries())
    .filter(([, playerData]) => playerData.isManual)
    .map(([playerId]) => playerId);

  const manualMatches: Record<number, { side: 'radiant' | 'dire' }> = {};
  team.matches.forEach((match, matchId) => {
    if (match.isManual) {
      manualMatches[matchId] = { side: match.side };
    }
  });

  return {
    team: { id: team.teamId, name: team.name },
    league: { id: team.leagueId, name: team.leagueName },
    timeAdded: new Date(team.timeAdded).toISOString(),
    matches: {},
    manualMatches,
    manualPlayers: manualPlayerIds,
    players: [],
    performance: performance ?? {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      erroredMatches: 0,
      totalDurationSeconds: 0,
      averageMatchDurationSeconds: 0,
      manualMatchCount: 0,
      manualPlayerCount: manualPlayerIds.length,
    },
    isLoading: team.isLoading,
    error: errorMessage,
    isGlobal: team.isGlobal,
  };
}

/**
 * Format multiple teams for UI display
 */
export function formatTeamsForDisplay(teams: Team[], performances?: Map<string, TeamPerformanceSummary>): TeamDisplayData[] {
  return teams.map((team) => formatTeamForDisplay(team, performances?.get(team.id)));
}

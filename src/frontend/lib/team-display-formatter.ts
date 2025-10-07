/**
 * Team Display Formatter
 * Converts internal Team data to UI display format
 */

import type { Team, TeamDisplayData } from './app-data-types';

/**
 * Format a single team for UI display
 * Returns a minimal structure - will be extended with computed data in future steps
 */
export function formatTeamForDisplay(team: Team): TeamDisplayData {
  // Build user-friendly error message from team-specific errors
  let errorMessage: string | undefined;
  if (team.teamError && team.leagueError) {
    errorMessage = 'Failed to fetch team and league';
  } else if (team.teamError) {
    errorMessage = 'Failed to fetch team';
  } else if (team.leagueError) {
    errorMessage = 'Failed to fetch league';
  }

  return {
    team: { id: team.teamId, name: team.name },
    league: { id: team.leagueId, name: team.leagueName },
    timeAdded: new Date(team.timeAdded).toISOString(),
    matches: {},
    manualMatches: {},
    manualPlayers: Array.from(team.players.entries())
      .filter(([, playerData]) => playerData.isManual)
      .map(([playerId]) => playerId),
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      erroredMatches: 0,
    },
    isLoading: team.isLoading,
    error: errorMessage,
    isGlobal: team.isGlobal,
  };
}

/**
 * Format multiple teams for UI display
 */
export function formatTeamsForDisplay(teams: Team[]): TeamDisplayData[] {
  return teams.map((team) => formatTeamForDisplay(team));
}

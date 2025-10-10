/**
 * Team Operations for AppData
 *
 * Extracted from app-data.ts to reduce file size.
 * Contains loadTeam and refreshTeam functions.
 */

import type { AppDataState, League, LeagueMatchesCache, Team } from './app-data-types';

/**
 * Interface for AppData instance methods needed by team operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataTeamOpsContext {
  state: AppDataState;
  leagues: Map<number, League>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  getTeam(teamKey: string): Team | undefined;
  addTeam(teamData: Partial<Team> & { id: string; teamId: number; leagueId: number }): void;
  updateTeam(teamKey: string, updates: Partial<Team>): void;
  setSelectedTeam(teamKey: string): void;
  saveToStorage(): void;
  loadTeamMatches(teamKey: string, force?: boolean): Promise<void>;
  fetchTeamAndLeagueData(
    teamId: number,
    leagueId: number,
    shouldFetchTeam: boolean,
    shouldFetchLeague: boolean,
  ): Promise<{ teamData: { name?: string; error?: string }; teamError?: string; leagueError?: string }>;
}

/**
 * Load team data from API and add to store
 * Fetches team data and league matches (cached), uses league name from already-loaded leagues Map
 */
export async function loadTeam(appData: AppDataTeamOpsContext, teamId: number, leagueId: number): Promise<void> {
  const teamKey = `${teamId}-${leagueId}`;

  try {
    appData.state.isLoading = true;
    appData.state.error = null;

    // Create a placeholder team with loading state
    appData.addTeam({
      id: teamKey,
      teamId,
      leagueId,
      name: `Team ${teamId}`,
      leagueName: `League ${leagueId}`,
      timeAdded: Date.now(),
      matches: new Map(),
      players: new Map(),
      isLoading: true,
    });

    // Fetch team data and league matches in parallel (if not cached)
    const { teamData, teamError, leagueError } = await appData.fetchTeamAndLeagueData(teamId, leagueId, true, false);

    // Update team with fetched data and clear loading state
    appData.updateTeam(teamKey, {
      name: teamData.name || `Team ${teamId}`,
      leagueName: appData.leagues.get(leagueId)?.name || `League ${leagueId}`,
      isLoading: false,
      teamError,
      leagueError,
    });

    // Only set as active if there are no errors
    if (!teamError && !leagueError) {
      appData.setSelectedTeam(teamKey);

      // Load full match data for all team matches (in background)
      // force=true on initial load to fetch all matches
      // Don't await - let matches load asynchronously
      appData.loadTeamMatches(teamKey, true).catch((err: unknown) => {
        console.error(`Failed to load matches for team ${teamKey}:`, err);
      });
    }

    appData.saveToStorage();
  } catch (error) {
    // Clear loading state on error
    const team = appData.getTeam(teamKey);
    if (team) {
      appData.updateTeam(teamKey, { isLoading: false });
    }

    appData.state.error = error instanceof Error ? error.message : 'Failed to load team';
    throw error;
  } finally {
    appData.state.isLoading = false;
  }
}

/**
 * Refresh team data from API
 * Re-fetches team data and league matches
 * Always bypasses backend cache to get fresh data
 * @param teamId - Team ID to refresh
 * @param leagueId - League ID to refresh
 */
export async function refreshTeam(appData: AppDataTeamOpsContext, teamId: number, leagueId: number): Promise<void> {
  const teamKey = `${teamId}-${leagueId}`;

  try {
    appData.state.isLoading = true;
    appData.state.error = null;

    const existingTeam = appData.getTeam(teamKey);

    if (!existingTeam) {
      throw new Error('Team not found');
    }

    // Set loading state for this specific team
    appData.updateTeam(teamKey, { isLoading: true });

    // Always force refresh to get latest data
    // Only force team data if previous fetch had an error
    const { teamData, teamError, leagueError } = await appData.fetchTeamAndLeagueData(
      teamId,
      leagueId,
      !!existingTeam.teamError,
      true,
    );

    // Update team in store with fresh data and clear loading state
    appData.updateTeam(teamKey, {
      name: teamData.name || existingTeam.name,
      leagueName: existingTeam.leagueName,
      isLoading: false,
      teamError,
      leagueError,
    });

    // Load/refresh matches if no errors
    if (!teamError && !leagueError) {
      appData.loadTeamMatches(teamKey).catch((err: unknown) => {
        console.error(`Failed to load matches for team ${teamKey}:`, err);
      });
    }

    appData.saveToStorage();
  } catch (error) {
    // Clear loading state on error
    const team = appData.getTeam(teamKey);
    if (team) {
      appData.updateTeam(teamKey, { isLoading: false });
    }

    appData.state.error = error instanceof Error ? error.message : 'Failed to refresh team';
    throw error;
  } finally {
    appData.state.isLoading = false;
  }
}

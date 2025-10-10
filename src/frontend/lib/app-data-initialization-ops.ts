/**
 * Initialization Operations for AppData
 *
 * Handles data loading and initialization methods.
 * Extracted to reduce app-data.ts file size.
 */

import * as TeamOps from './app-data-team-ops';
import type { AppDataState, Hero, Item, League, LeagueMatchesCache, Match, Player, Team } from './app-data-types';
import { fetchAndProcessMatch } from './match-loader';
import { fetchAndProcessPlayer } from './player-loader';
import { loadHeroes, loadItems, loadLeagues } from './reference-data-loader';

/**
 * Interface for AppData instance methods needed by initialization operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataInitializationOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  _players: Map<number, Player>;
  heroes: Map<number, Hero>;
  items: Map<number, Item>;
  leagues: Map<number, League>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  getTeam(teamKey: string): Team | undefined;
  getMatch(matchId: number): Match | undefined;
  getPlayer(accountId: number): Player | undefined;
  addMatch(match: Match): void;
  updateMatch(matchId: number, updates: Partial<Match>, options?: { skipSave?: boolean }): void;
  addPlayer(player: Player): void;
  updatePlayer(accountId: number, updates: Partial<Player>, options?: { skipSave?: boolean }): void;
  addTeam(team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>): void;
  updateTeam(teamId: string, updates: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): void;
  setSelectedTeam(teamId: string): void;
  saveToStorage(): void;
  updateTeamMatchParticipation(teamKey: string, matchIds: number[]): void;
  updateTeamPlayersMetadata(teamKey: string, options?: { skipSave?: boolean }): void;
  getTeamPlayerIds(teamKey: string): Set<number>;
  loadPlayersFromMatchForTeam(match: Match, side: 'radiant' | 'dire'): Promise<void>;
  loadTeamMatches(teamKey: string, force?: boolean): Promise<void>;
  fetchTeamAndLeagueData(
    teamId: number,
    leagueId: number,
    shouldFetchTeam: boolean,
    shouldFetchLeague: boolean,
  ): Promise<{ teamData: { name?: string; error?: string }; teamError?: string; leagueError?: string }>;
  getTeams(): Team[];
  state: AppDataState;
}

// ============================================================================
// REFERENCE DATA LOADING
// ============================================================================

/**
 * Load heroes data from API
 * Fetches all heroes from /api/heroes and populates the heroes Map
 */
export async function loadHeroesData(appData: AppDataInitializationOpsContext): Promise<void> {
  appData.heroes = await loadHeroes();
}

/**
 * Load items data from API
 * Fetches all items from /api/items and populates the items Map
 */
export async function loadItemsData(appData: AppDataInitializationOpsContext): Promise<void> {
  appData.items = await loadItems();
}

/**
 * Load leagues data from API
 * Fetches all leagues from /api/leagues and populates the leagues Map
 */
export async function loadLeaguesData(appData: AppDataInitializationOpsContext): Promise<void> {
  appData.leagues = await loadLeagues();
}

// ============================================================================
// TEAM LOADING
// ============================================================================

/**
 * Load team data from API and add to store
 * Fetches team data and league matches (cached), uses league name from already-loaded leagues Map
 */
export async function loadTeam(
  appData: AppDataInitializationOpsContext,
  teamId: number,
  leagueId: number,
): Promise<void> {
  return TeamOps.loadTeam(appData, teamId, leagueId);
}

/**
 * Refresh team data from API
 * Re-fetches team data and league matches
 * Always bypasses backend cache to get fresh data
 * @param teamId - Team ID to refresh
 * @param leagueId - League ID to refresh
 */
export async function refreshTeam(
  appData: AppDataInitializationOpsContext,
  teamId: number,
  leagueId: number,
): Promise<void> {
  return TeamOps.refreshTeam(appData, teamId, leagueId);
}

/**
 * Refresh all teams (active first, then others in parallel) - excludes global team
 */
export async function refreshAllTeams(appData: AppDataInitializationOpsContext): Promise<void> {
  const teams = appData.getTeams().filter((t) => !t.isGlobal); // Skip global team
  const activeTeamId = appData.state.selectedTeamId;
  const activeTeam = activeTeamId ? teams.find((t) => t.id === activeTeamId) : null;
  const inactiveTeams = activeTeamId ? teams.filter((t) => t.id !== activeTeamId) : teams;

  if (activeTeam) {
    await refreshTeam(appData, activeTeam.teamId, activeTeam.leagueId);
  }
  const refreshPromises = inactiveTeams.map((team) => refreshTeam(appData, team.teamId, team.leagueId));
  await Promise.allSettled(refreshPromises);
}

// ============================================================================
// MATCH LOADING
// ============================================================================

/**
 * Check if a match has meaningful player data (not just empty arrays)
 */
function hasPlayerData(match: Match): boolean {
  return Boolean(match.players && (match.players.radiant.length > 0 || match.players.dire.length > 0));
}

/**
 * Handle match loading success
 */
function handleMatchLoadSuccess(appData: AppDataInitializationOpsContext, match: Match): Match {
  const hydratedMatch: Match = {
    ...match,
    isLoading: false,
  };

  appData.addMatch(hydratedMatch);
  return appData.getMatch(match.id) ?? hydratedMatch;
}

/**
 * Handle match loading failure
 */
function handleMatchLoadFailure(
  appData: AppDataInitializationOpsContext,
  matchId: number,
  hadExistingMatch: boolean,
  error: unknown,
): null {
  if (hadExistingMatch) {
    appData.updateMatch(
      matchId,
      { error: error instanceof Error ? error.message : 'Failed to load match data' },
      { skipSave: true },
    );
  }
  console.error(`Failed to load match ${matchId}:`, error);
  return null;
}

/**
 * Load full match data from API
 * Fetches and processes match data, then stores it in AppData
 * @param matchId - The match ID to load
 * @returns The loaded match or null on error
 */
export async function loadMatch(appData: AppDataInitializationOpsContext, matchId: number): Promise<Match | null> {
  // Check if already loaded with full data
  const existing = appData._matches.get(matchId);
  if (existing && hasPlayerData(existing)) {
    return existing;
  }

  const hadExistingMatch = Boolean(existing);

  if (hadExistingMatch) {
    appData.updateMatch(matchId, { isLoading: true, error: undefined }, { skipSave: true });
  }

  try {
    const match = await fetchAndProcessMatch(matchId, appData.heroes, appData.items);
    return match
      ? handleMatchLoadSuccess(appData, match)
      : handleMatchLoadFailure(appData, matchId, hadExistingMatch, 'No match data');
  } catch (error) {
    return handleMatchLoadFailure(appData, matchId, hadExistingMatch, error);
  } finally {
    if (hadExistingMatch) {
      appData.updateMatch(matchId, { isLoading: false }, { skipSave: true });
    }
  }
}

/**
 * Update team match metadata while preserving manual side selection
 */
function updateTeamMatchMetadata(
  appData: AppDataInitializationOpsContext,
  teamKey: string,
  team: Team,
  matchId: number,
  refreshedMatch: Match,
): void {
  const existingMatchData = team.matches.get(matchId);
  if (existingMatchData?.isManual) {
    // Update the match data with fresh information while preserving the side
    const updatedMatchData = {
      ...existingMatchData,
      duration: refreshedMatch.duration,
      date: refreshedMatch.date,
      // Keep the existing side - don't overwrite it
      side: existingMatchData.side,
    };
    team.matches.set(matchId, updatedMatchData);
    appData.updateTeam(teamKey, { matches: team.matches });
  }
}

/**
 * Update team participation and load players for teams that have this match
 */
function updateTeamParticipationForMatch(
  appData: AppDataInitializationOpsContext,
  matchId: number,
  refreshedMatch: Match,
): void {
  for (const [teamKey, team] of appData._teams.entries()) {
    const manualMatchIds = Array.from(team.matches.entries())
      .filter(([, matchData]) => matchData.isManual)
      .map(([matchId]) => matchId);
    const allMatchIds = [...manualMatchIds, ...Array.from(team.matches.keys())];

    if (allMatchIds.includes(matchId)) {
      // Preserve the team's manual match metadata (especially the side)
      updateTeamMatchMetadata(appData, teamKey, team, matchId, refreshedMatch);

      appData.updateTeamMatchParticipation(teamKey, allMatchIds);

      // Load players for this team's side of the match
      const matchData = team.matches.get(matchId);
      if (matchData?.side) {
        appData.loadPlayersFromMatchForTeam(refreshedMatch, matchData.side).catch((err) => {
          console.error(`Failed to load players for team ${teamKey} match ${matchId}:`, err);
        });
      }

      // Update team player metadata to reflect any changes from the refreshed match
      appData.updateTeamPlayersMetadata(teamKey);
    }
  }
}

/**
 * Refresh match data from API
 * Re-fetches match data with force=true to bypass cache
 * @param matchId - The match ID to refresh
 * @returns The refreshed match or null on error
 */
export async function refreshMatch(appData: AppDataInitializationOpsContext, matchId: number): Promise<Match | null> {
  // Check if match exists and set loading state
  const existing = appData._matches.get(matchId);
  const hadExistingMatch = Boolean(existing);

  if (hadExistingMatch) {
    appData.updateMatch(matchId, { isLoading: true, error: undefined }, { skipSave: true });
  }

  try {
    // Fetch fresh data from API with force=true to bypass cache
    const match = await fetchAndProcessMatch(matchId, appData.heroes, appData.items, true);

    if (!match) {
      if (hadExistingMatch) {
        appData.updateMatch(matchId, { error: 'Failed to refresh match data' }, { skipSave: true });
      }
      console.error(`Failed to refresh match ${matchId}`);
      return null;
    }

    // Update in place (no remove/re-add to avoid UI flicker)
    const refreshedMatch: Match = {
      ...match,
      isLoading: false,
    };
    appData.addMatch(refreshedMatch);

    // Update team participation and load players for teams that have this match
    updateTeamParticipationForMatch(appData, matchId, refreshedMatch);

    return refreshedMatch;
  } catch (error) {
    if (hadExistingMatch) {
      appData.updateMatch(
        matchId,
        { error: error instanceof Error ? error.message : 'Failed to refresh match data' },
        { skipSave: true },
      );
    }
    console.error(`Failed to refresh match ${matchId}:`, error);
    return null;
  } finally {
    if (hadExistingMatch) {
      appData.updateMatch(matchId, { isLoading: false }, { skipSave: true });
    }
  }
}

/**
 * Load all manual matches
 * Per data-flow-analysis.md: Should be called during app hydration
 */
export async function loadAllManualMatches(appData: AppDataInitializationOpsContext): Promise<void> {
  const matchIds = new Set<number>();

  // Collect all team manual matches (including global team)
  for (const team of appData._teams.values()) {
    for (const [matchId, matchData] of team.matches) {
      if (matchData.isManual) {
        matchIds.add(matchId);
      }
    }
  }

  // Load all matches in parallel
  await Promise.allSettled(Array.from(matchIds).map((id) => loadMatch(appData, id)));
}

// ============================================================================
// PLAYER LOADING
// ============================================================================

/**
 * Load full player data from API
 * Fetches and processes player data, then stores it in AppData
 * @param accountId - The player account ID to load
 * @returns The loaded player or null on error
 */
export async function loadPlayer(appData: AppDataInitializationOpsContext, accountId: number): Promise<Player | null> {
  const existing = appData._players.get(accountId);
  const hadExistingPlayer = Boolean(existing);

  if (hadExistingPlayer) {
    appData.updatePlayer(accountId, { isLoading: true, error: undefined }, { skipSave: true });
  }

  try {
    const player = await fetchAndProcessPlayer(accountId);

    if (!player) {
      if (hadExistingPlayer) {
        appData.updatePlayer(accountId, { error: 'Failed to load player data' }, { skipSave: true });
      }
      return null;
    }

    const hydratedPlayer: Player = {
      ...player,
      isLoading: false,
    };

    appData.addPlayer(hydratedPlayer);
    return appData.getPlayer(accountId) ?? null;
  } catch (error) {
    if (hadExistingPlayer) {
      appData.updatePlayer(
        accountId,
        { error: error instanceof Error ? error.message : 'Failed to load player data' },
        { skipSave: true },
      );
    }
    return null;
  } finally {
    if (hadExistingPlayer) {
      appData.updatePlayer(accountId, { isLoading: false }, { skipSave: true });
    }
  }
}

/**
 * Update team player metadata for all teams that have this player
 */
function updateTeamPlayerMetadataForPlayer(appData: AppDataInitializationOpsContext, accountId: number): void {
  for (const [teamKey, _team] of appData._teams.entries()) {
    const playerIds = appData.getTeamPlayerIds(teamKey);
    if (playerIds.has(accountId)) {
      appData.updateTeamPlayersMetadata(teamKey);
    }
  }
}

/**
 * Refresh player data from API
 * Re-fetches player data to get fresh information
 * @param accountId - The player account ID to refresh
 * @returns The refreshed player or null on error
 */
export async function refreshPlayer(
  appData: AppDataInitializationOpsContext,
  accountId: number,
): Promise<Player | null> {
  const existing = appData._players.get(accountId);
  const hadExistingPlayer = Boolean(existing);

  if (hadExistingPlayer) {
    appData.updatePlayer(accountId, { isLoading: true, error: undefined }, { skipSave: true });
  }

  try {
    const player = await fetchAndProcessPlayer(accountId);

    if (!player) {
      if (hadExistingPlayer) {
        appData.updatePlayer(accountId, { error: 'Failed to refresh player data' }, { skipSave: true });
      }
      return null;
    }

    const refreshedPlayer: Player = {
      ...player,
      isLoading: false,
    };

    appData.addPlayer(refreshedPlayer);

    // Update team player metadata for all teams that have this player
    updateTeamPlayerMetadataForPlayer(appData, accountId);

    return appData.getPlayer(accountId) ?? null;
  } catch (error) {
    if (hadExistingPlayer) {
      appData.updatePlayer(
        accountId,
        { error: error instanceof Error ? error.message : 'Failed to refresh player data' },
        { skipSave: true },
      );
    }
    return null;
  } finally {
    if (hadExistingPlayer) {
      appData.updatePlayer(accountId, { isLoading: false }, { skipSave: true });
    }
  }
}

/**
 * Load all manual players
 * Per data-flow-analysis.md: Should be called during app hydration
 */
export async function loadAllManualPlayers(appData: AppDataInitializationOpsContext): Promise<void> {
  const playerIds = new Set<number>();

  // Collect all team manual players (including global team)
  for (const team of appData._teams.values()) {
    for (const [playerId, playerData] of team.players) {
      if (playerData.isManual) {
        playerIds.add(playerId);
      }
    }
  }

  // Load all players in parallel
  await Promise.allSettled(Array.from(playerIds).map((id) => loadPlayer(appData, id)));

  // Refresh stored player metadata now that player data is available
  appData.getTeams().forEach((team) => {
    appData.updateTeamPlayersMetadata(team.id);
  });
}

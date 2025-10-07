/**
 * AppData - Single source of truth for all application data
 *
 * This class manages all team, match, player, hero, item, and league data
 * in a centralized store. It's wrapped by React Context for component access.
 */

import type React from 'react';


import * as DataOps from './app-data-data-ops';
import * as InitializationOps from './app-data-initialization-ops';
import * as MatchOps from './app-data-match-ops';
import { updateTeamMatchParticipation as updateTeamMatchParticipationOp } from './app-data-match-participation-ops';
import { updateTeamPlayersMetadata as updateTeamPlayersMetadataOp } from './app-data-player-metadata-ops';
import * as PlayerOps from './app-data-player-ops';
import * as StatisticsOps from './app-data-statistics-ops';
import * as StorageOps from './app-data-storage-ops';
import type { LoadedStorageResult } from './app-data-storage-ops';
import {
  GLOBAL_TEAM_KEY,
  type AppDataState,
  type Hero,
  type Item,
  type League,
  type LeagueMatchesCache,
  type Match,
  type Player,
  type Team,
  type TeamDisplayData,
} from './app-data-types';
import * as UIOps from './app-data-ui-ops';
import { getOrFetchLeagueMatches } from './league-matches-loader';
import type { PlayerStats, HeroStats, TeamPlayerStats, DateRangeSelection } from './player-statistics-calculator';
import type { StoredMatchData } from './storage-manager';
import { fetchTeamData } from './team-loader';

function sortMatchesByDateDesc(matches: Match[]): Match[] {
  return matches.slice().sort((a, b) => {
    const aTime = Number.isFinite(Date.parse(a.date)) ? Date.parse(a.date) : 0;
    const bTime = Number.isFinite(Date.parse(b.date)) ? Date.parse(b.date) : 0;
    return bTime - aTime;
  });
}

// ============================================================================
// APP DATA CLASS
// ============================================================================

/**
 * AppData class - Single source of truth for all application data
 *
 * Core Structure:
 * - Core data maps (teams, matches, players, heroes, items, leagues)
 * - Manual data tracking (stored in matches/players Maps with isManual flags)
 * - UI state (selectedTeamId, selectedLeagueId, isLoading, error)
 * - Constructor and initialization
 */
export class AppData {
  // ============================================================================
  // CORE DATA MAPS
  // ============================================================================

  /**
   * Internal teams map
   */
  _teams: Map<string, Team> = new Map();

  /**
   * Internal matches map
   */
  _matches: Map<number, Match> = new Map();

  /**
   * Cached reference to teams Map for reactive updates
   * Updated whenever teams change to trigger React re-renders
   */
  _teamsRef: Map<string, Team> = new Map();

  /**
   * Cached reference to matches Map for reactive updates
   * Updated whenever matches change to trigger React re-renders
   */
  _matchesRef: Map<number, Match> = new Map();

  /**
   * Internal players map
   */
  _players: Map<number, Player> = new Map();

  /**
   * Cached reference to players Map for reactive updates
   * Updated whenever players change to trigger React re-renders
   */
  _playersRef: Map<number, Player> = new Map();

  /**
   * Public getter for teams - returns cached reference that changes on updates
   */
  get teams(): Map<string, Team> {
    return this._teamsRef;
  }

  /**
   * Public getter for matches - returns cached reference that changes on updates
   */
  get matches(): Map<number, Match> {
    return this._matchesRef;
  }

  /**
   * Public getter for players - returns cached reference that changes on updates
   */
  get players(): Map<number, Player> {
    return this._playersRef;
  }

  /**
   * All heroes keyed by hero ID
   */
  heroes: Map<number, Hero> = new Map();

  /**
   * All items keyed by item ID
   */
  items: Map<number, Item> = new Map();

  /**
   * All leagues keyed by league ID
   */
  leagues: Map<number, League> = new Map();

  /**
   * League matches cache
   * Stores processed match IDs by team from /api/leagues/[id] to avoid refetching
   * Keyed by league ID, contains only match IDs grouped by team ID
   */
  leagueMatchesCache: Map<number, LeagueMatchesCache> = new Map();

  // ============================================================================
  // UI STATE
  // ============================================================================

  /**
   * UI state - selection, loading, and error tracking
   * selectedTeamId defaults to GLOBAL_TEAM_KEY
   */
  state: AppDataState = {
    selectedTeamId: GLOBAL_TEAM_KEY,
    selectedTeamIdParsed: { teamId: 0, leagueId: 0 }, // 0-0 represents global team
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  };

  /**
   * React setState functions for triggering re-renders
   * Set by AppDataProvider
   */
  setTeamsState?: React.Dispatch<React.SetStateAction<Map<string, Team>>>;
  setMatchesState?: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  setPlayersState?: React.Dispatch<React.SetStateAction<Map<number, Player>>>;

  /**
   * Register setState for teams (called by AppDataProvider)
   */
  setTeamsStateFn(fn: React.Dispatch<React.SetStateAction<Map<string, Team>>>): void {
    UIOps.setTeamsStateFn(this, fn);
  }

  /**
   * Register setState for matches (called by AppDataProvider)
   */
  setMatchesStateFn(fn: React.Dispatch<React.SetStateAction<Map<number, Match>>>): void {
    UIOps.setMatchesStateFn(this, fn);
  }

  /**
   * Register setState for players (called by AppDataProvider)
   */
  setPlayersStateFn(fn: React.Dispatch<React.SetStateAction<Map<number, Player>>>): void {
    UIOps.setPlayersStateFn(this, fn);
  }

  /**
   * Update the teams reference to trigger React re-renders
   * Creates a new Map reference so React detects the change
   */
  updateTeamsRef(): void {
    UIOps.updateTeamsRef(this);
  }

  /**
   * Update the matches reference to trigger React re-renders
   * Creates a new Map reference so React detects the change
   */
  updateMatchesRef(): void {
    UIOps.updateMatchesRef(this);
  }

  /**
   * Update the players reference to trigger React re-renders
   * Creates a new Map reference so React detects the change
   */
  updatePlayersRef(): void {
    UIOps.updatePlayersRef(this);
  }

  /**
   * Create the special global team for manual matches/players
   * This virtual team holds items not associated with any real team
   */
  createGlobalTeam(): Team {
    return StorageOps.createGlobalTeam();
  }

  /**
   * Initialize the global team if it doesn't exist
   * Called during construction and after loading from storage
   */
  private ensureGlobalTeam(): void {
    StorageOps.ensureGlobalTeam(this);
  }

  /**
   * Update teams map and trigger React re-render
   * Helper to ensure state is always updated when teams change
   */
  updateTeamsMap(teamId: string, team: Team): void {
    this._teams.set(teamId, team);
    this.updateTeamsRef();
  }

  /**
   * Delete from teams map and trigger React re-render
   */
  deleteFromTeamsMap(teamId: string): void {
    this._teams.delete(teamId);
    this.updateTeamsRef();
  }

  // ============================================================================
  // CRUD OPERATIONS - TEAMS
  // ============================================================================

  /**
   * Add a new team
   */
  addTeam(team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>): void {
    DataOps.addTeam(this, team);
  }

  /**
   * Remove a team
   */
  removeTeam(teamId: string): void {
    DataOps.removeTeam(this, teamId);
  }

  /**
   * Update an existing team
   */
  updateTeam(teamId: string, updates: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): void {
    DataOps.updateTeam(this, teamId, updates);
  }

  /**
   * Get a team by ID
   */
  getTeam(teamId: string): Team | undefined {
    return DataOps.getTeam(this, teamId);
  }

  /**
   * Get all teams as an array
   */
  getTeams(): Team[] {
    return DataOps.getTeams(this);
  }

  /**
   * Get team data formatted for UI display
   * Returns a minimal structure - will be extended with computed data in future steps
   */
  getTeamDataForDisplay(teamId: string): TeamDisplayData | undefined {
    return DataOps.getTeamDataForDisplay(this, teamId);
  }

  /**
   * Get all teams formatted for UI display
   */
  getAllTeamsForDisplay(): TeamDisplayData[] {
    return DataOps.getAllTeamsForDisplay(this);
  }

  // ============================================================================
  // CRUD OPERATIONS - MATCHES
  // ============================================================================

  /**
   * Add a new match
   */
  addMatch(match: Match): void {
    DataOps.addMatch(this, match);
  }

  /**
   * Remove a match
   */
  removeMatch(matchId: number): void {
    DataOps.removeMatch(this, matchId);
  }

  /**
   * Get a match by ID
   */
  getMatch(matchId: number): Match | undefined {
    return DataOps.getMatch(this, matchId);
  }

  /**
   * Get all matches as an array
   */
  getMatches(): Match[] {
    return DataOps.getMatches(this);
  }

  // ============================================================================
  // CRUD OPERATIONS - PLAYERS
  // ============================================================================

  /**
   * Add a new player
   */
  addPlayer(player: Player): void {
    DataOps.addPlayer(this, player);
  }

  /**
   * Remove a player
   */
  removePlayer(accountId: number): void {
    DataOps.removePlayer(this, accountId);
  }

  /**
   * Get a player by account ID
   */
  getPlayer(accountId: number): Player | undefined {
    return DataOps.getPlayer(this, accountId);
  }

  /**
   * Get all players as an array
   */
  getPlayers(): Player[] {
    return DataOps.getPlayers(this);
  }

  // ============================================================================
  // HIDDEN MATCH OPERATIONS
  // ============================================================================

  /**
   * Hide a match for a specific team
   */
  hideMatch(teamId: string, matchId: number): void {
    DataOps.hideMatch(this, teamId, matchId);
  }

  /**
   * Unhide a match for a specific team
   */
  unhideMatch(teamId: string, matchId: number): void {
    DataOps.unhideMatch(this, teamId, matchId);
  }

  /**
   * Get hidden matches for a specific team
   */
  getHiddenMatches(teamId: string): Match[] {
    return DataOps.getHiddenMatches(this, teamId);
  }

  // ============================================================================
  // DATA LOADING OPERATIONS - PLAYERS
  // ============================================================================

  /**
   * Load full player data from API
   *
   * @param accountId - The player account ID to load
   * @returns The loaded player or null on error
   */
  async loadPlayer(accountId: number): Promise<Player | null> {
    return InitializationOps.loadPlayer(this, accountId);
  }

  /**
   * Refresh player data (force reload from API)
   *
   * @param accountId - The player account ID to refresh
   * @returns The refreshed player or null on error
   */
  async refreshPlayer(accountId: number): Promise<Player | null> {
    return InitializationOps.refreshPlayer(this, accountId);
  }

  /**
   * Load players from a specific team's side of a match
   * Only loads players from the specified team (not the opponent)
   * Per data-flow-analysis.md: "call /api/players/[id] for team's players"
   *
   * @param match - The match to extract players from
   * @param side - Which side the team played on ('radiant' or 'dire')
   */
  async loadPlayersFromMatchForTeam(match: Match, side: 'radiant' | 'dire'): Promise<void> {
    const playerIds = new Set<number>();

    // Extract player IDs from the team's side only
    const teamPlayers = match.players[side];
    teamPlayers.forEach((player) => {
      if (player.accountId) {
        playerIds.add(player.accountId);
      }
    });

    // Load all players in parallel
    await Promise.allSettled(Array.from(playerIds).map((accountId) => this.loadPlayer(accountId)));
  }

  /**
   * Load players for all of a team's matches
   * Iterates through matches and loads players for the team's side only
   * Per data-flow-analysis.md: "call /api/players/[id] for team's players"
   *
   * @param teamKey - The team key (teamId-leagueId)
   * @param matchIds - Array of match IDs to load players from
   */
  async loadPlayersForTeamMatches(teamKey: string, matchIds: number[]): Promise<void> {
    const team = this.getTeam(teamKey);
    if (!team) return;

    // Load players for each match in parallel
    const playerLoadPromises = matchIds.map(async (matchId) => {
      const match = this._matches.get(matchId);
      if (!match) return;

      const matchData = team.matches.get(matchId);
      if (!matchData?.side) return;

      await this.loadPlayersFromMatchForTeam(match, matchData.side);
    });

    await Promise.allSettled(playerLoadPromises);
    this.updateTeamMatchParticipation(teamKey, matchIds);
  }

  // ============================================================================
  // SELECTION OPERATIONS
  // ============================================================================

  /**
   * Set the selected team
   * Throws error if team doesn't exist - should never happen as we always have at least global team
   */
  setSelectedTeam(teamId: string): void {
    UIOps.setSelectedTeam(this, teamId);
  }

  /**
   * Set the selected match
   */
  setSelectedMatch(matchId: number | null): void {
    UIOps.setSelectedMatch(this, matchId);
  }

  /**
   * Set the selected player
   */
  setSelectedPlayer(accountId: number | null): void {
    UIOps.setSelectedPlayer(this, accountId);
  }

  // ============================================================================
  // COMPUTED DATA METHODS
  // ============================================================================

  /**
   * Get all matches for a specific team
   * Returns matches where the team participated (from league data or manual matches)
   *
   * @param teamKey - The team key (teamId-leagueId)
   * @returns Array of Match objects for the team
   */
  getTeamMatches(teamKey: string): Match[] {
    const team = this._teams.get(teamKey);
    if (!team) return [];

    // Combine match IDs from cache and stored metadata
    const leagueCache = this.leagueMatchesCache.get(team.leagueId);
    const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
    const storedMatchIds = Array.from(team.matches.keys());
    const allMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

    // Return matches that exist in our matches Map
    return sortMatchesByDateDesc(
      Array.from(allMatchIds)
        .map((matchId) => this._matches.get(matchId))
        .filter((match): match is Match => match !== undefined),
    );
  }

  /**
   * Get matches by IDs
   * Helper to retrieve multiple matches at once
   *
   * @param matchIds - Array of match IDs
   * @returns Array of Match objects (filters out undefined)
   */
  getMatchesByIds(matchIds: number[]): Match[] {
    return sortMatchesByDateDesc(
      matchIds.map((id) => this._matches.get(id)).filter((match): match is Match => match !== undefined),
    );
  }

  /**
   * Get all player IDs for a specific team
   * Returns player IDs from stored players, league matches, and manual matches
   *
   * @param teamKey - The team key (teamId-leagueId)
   * @returns Set of player IDs for the team
   */
  getTeamPlayerIds(teamKey: string): Set<number> {
    const team = this._teams.get(teamKey);
    if (!team) return new Set();

    // Start with ALL stored player IDs (both manual and non-manual)
    const storedPlayerIds = Array.from(team.players.entries())
      .filter(([, playerData]) => playerData.accountId > 0)
      .map(([playerId]) => playerId);
    const playerIds = new Set<number>(storedPlayerIds);

    // Add player IDs from league matches
    const leagueCache = this.leagueMatchesCache.get(team.leagueId);
    const matchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];

    matchIds.forEach((matchId) => {
      const matchInfo = leagueCache?.matches.get(matchId);
      if (!matchInfo) return;

      // Add players based on which side the team played
      if (matchInfo.radiantTeamId === team.teamId) {
        matchInfo.radiantPlayerIds.forEach((id) => playerIds.add(id));
      }
      if (matchInfo.direTeamId === team.teamId) {
        matchInfo.direPlayerIds.forEach((id) => playerIds.add(id));
      }
    });

    // Add players from manual matches
    const manualMatchIds = Array.from(team.matches.entries())
      .filter(([, matchData]) => matchData.isManual)
      .map(([matchId]) => matchId);

    manualMatchIds.forEach((matchId) => {
      const match = this._matches.get(matchId);
      if (!match) return;

      const matchData = team.matches.get(matchId);
      if (!matchData?.side) return;

      // Add players from the team's side
      const teamPlayers = match.players[matchData.side];
      teamPlayers.forEach((player) => {
        if (player.accountId) {
          playerIds.add(player.accountId);
        }
      });
    });

    return playerIds;
  }

  // ============================================================================
  // MATCH OPERATIONS
  // ============================================================================

  /**
   * Load matches for a team
   * Only loads NEW matches (not yet in AppData) or matches with ERRORS
   * Per data-flow-analysis.md: "Search for matches that are not already listed"
   * and "refetch any matches that have errors"
   *
   * @param teamKey - The team key (teamId-leagueId)
   * @param force - If true, refetch all matches (used during initial load)
   */
  async loadTeamMatches(teamKey: string, force = false): Promise<void> {
    const team = this.getTeam(teamKey);
    if (!team) {
      console.error(`Team ${teamKey} not found`);
      return;
    }

    if (team.isGlobal) {
      await this.loadGlobalTeamMatches(teamKey, force);
    } else {
      await this.loadRegularTeamMatches(teamKey, team, force);
    }
  }

  /**
   * Load matches for global team (manual matches only)
   */
  private async loadGlobalTeamMatches(teamKey: string, force: boolean): Promise<void> {
    const team = this.getTeam(teamKey);
    if (!team) return;

    const allMatchIds = Array.from(team.matches.entries())
      .filter(([, matchData]) => matchData.isManual)
      .map(([matchId]) => matchId);
    if (allMatchIds.length === 0) {
      return;
    }

    const matchIdsToLoad = force
      ? allMatchIds
      : allMatchIds.filter((matchId) => {
          const existing = this._matches.get(matchId);
          return !existing || existing.error || !existing.players;
        });

    if (matchIdsToLoad.length === 0) {
      this.updateTeamMatchParticipation(teamKey, allMatchIds);
      await this.maybeLoadPlayersForMatches(teamKey, allMatchIds, force);
      return;
    }

    await Promise.allSettled(matchIdsToLoad.map((matchId) => this.loadMatch(matchId)));
    this.updateTeamMatchParticipation(teamKey, allMatchIds);
    await this.maybeLoadPlayersForMatches(teamKey, force ? allMatchIds : matchIdsToLoad, force);
  }

  /**
   * Load matches for regular team (league + manual matches)
   */
  private async loadRegularTeamMatches(teamKey: string, team: Team, force: boolean): Promise<void> {
    const leagueCache = this.leagueMatchesCache.get(team.leagueId);
    const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
    const manualMatchIds = Array.from(team.matches.entries())
      .filter(([, matchData]) => matchData.isManual)
      .map(([matchId]) => matchId);
    const allMatchIds = [...leagueMatchIds, ...manualMatchIds];

    const matchIdsToLoad = force
      ? allMatchIds
      : allMatchIds.filter((matchId) => {
          const existing = this._matches.get(matchId);
          return !existing || existing.error || !existing.players;
        });

    if (matchIdsToLoad.length === 0) {
      this.updateTeamMatchParticipation(teamKey, allMatchIds);
      await this.maybeLoadPlayersForMatches(teamKey, allMatchIds, force);
      return;
    }

    await Promise.allSettled(matchIdsToLoad.map((matchId) => this.loadMatch(matchId)));
    this.updateTeamMatchParticipation(teamKey, allMatchIds);
    await this.maybeLoadPlayersForMatches(teamKey, force ? allMatchIds : matchIdsToLoad, force);
  }

  private async maybeLoadPlayersForMatches(teamKey: string, matchIds: number[], force: boolean): Promise<void> {
    if (matchIds.length === 0) {
      return;
    }

    try {
      await this.loadPlayersForTeamMatches(teamKey, matchIds);
    } catch (error) {
      console.error(
        `Failed to load players for team ${teamKey} (${force ? 'force' : 'delta'} mode) for matches:`,
        matchIds,
        error,
      );
    }
  }

  /**
   * Update team match participation data for given matches
   * Calculates side, opponent, result, and high performing heroes
   */
  updateTeamPlayersMetadata(teamKey: string, options?: { skipSave?: boolean }): void {
    updateTeamPlayersMetadataOp(this, teamKey, options);
  }

  updateTeamMatchParticipation(teamKey: string, matchIds: number[]): void {
    updateTeamMatchParticipationOp(this, teamKey, matchIds);
  }

  async loadMatch(matchId: number): Promise<Match | null> {
    return InitializationOps.loadMatch(this, matchId);
  }

  /**
   * Refresh match data (force reload from API)
   *
   * @param matchId - The match ID to refresh
   * @returns The refreshed match or null on error
   */
  async refreshMatch(matchId: number): Promise<Match | null> {
    return InitializationOps.refreshMatch(this, matchId);
  }

  /**
   * Add a manual match to a team
   * Delegates to app-data-match-ops.ts
   * @param matchId - The match ID to add
   * @param teamKey - The team key (teamId-leagueId)
   * @param userSelectedSide - User-selected side (required - user must choose which side in the form)
   */
  async addManualMatchToTeam(
    matchId: number,
    teamKey: string,
    userSelectedSide: 'radiant' | 'dire',
  ): Promise<Match | null> {
    return MatchOps.addManualMatchToTeam(this, matchId, teamKey, userSelectedSide);
  }

  /**
   * Remove a manual match from a team
   * Delegates to app-data-match-ops.ts
   */
  removeManualMatchFromTeam(matchId: number, teamKey: string): void {
    MatchOps.removeManualMatchFromTeam(this, matchId, teamKey);
  }

  /**
   * Edit a manual match by replacing it with a new match (atomic operation to prevent flickering)
   * Delegates to app-data-match-ops.ts
   * @param oldMatchId - The match ID to replace
   * @param newMatchId - The new match ID
   * @param teamKey - The team key (teamId-leagueId)
   * @param userSelectedSide - User-selected side (required - user must choose which side in the form)
   */
  async editManualMatchToTeam(
    oldMatchId: number,
    newMatchId: number,
    teamKey: string,
    userSelectedSide: 'radiant' | 'dire',
  ): Promise<Match | null> {
    return MatchOps.editManualMatchToTeam(this, oldMatchId, newMatchId, teamKey, userSelectedSide);
  }

  /**
   * Check if a match exists for a team
   * Checks both league matches and manual matches
   *
   * @param matchId - The match ID to check
   * @param teamKey - The team key (teamId-leagueId)
   * @returns True if the match is associated with the team
   */
  teamHasMatch(matchId: number, teamKey: string): boolean {
    const team = this._teams.get(teamKey);
    if (!team) return false;

    // Check manual matches first
    const matchData = team.matches.get(matchId);
    if (matchData?.isManual) return true;

    // Check league matches cache
    const leagueCache = this.leagueMatchesCache.get(team.leagueId);
    const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
    return leagueMatchIds.includes(matchId);
  }

  /**
   * Get team match metadata for all matches of a team
   * Returns the team's stored participation map
   *
   * @param teamKey - The team key (teamId-leagueId)
   * @returns Map of match ID to metadata
   */
  getTeamMatchesMetadata(teamKey: string): Map<number, StoredMatchData> {
    const team = this._teams.get(teamKey);
    return team?.matches || new Map();
  }

  // ============================================================================
  // PLAYER OPERATIONS
  // ============================================================================

  /**
   * Add a manual player to a team
   * Delegates to app-data-player-ops.ts
   */
  async addManualPlayerToTeam(playerId: number, teamKey: string): Promise<Player | null> {
    return PlayerOps.addManualPlayerToTeam(this, playerId, teamKey);
  }

  /**
   * Remove a manual player from a team
   * Delegates to app-data-player-ops.ts
   */
  removeManualPlayerFromTeam(playerId: number, teamKey: string): void {
    PlayerOps.removeManualPlayerFromTeam(this, playerId, teamKey);
  }

  /**
   * Edit a manual player (replace old with new) - atomic operation to prevent flickering
   * Delegates to app-data-player-ops.ts
   */
  async editManualPlayerToTeam(oldPlayerId: number, newPlayerId: number, teamKey: string): Promise<Player | null> {
    return PlayerOps.editManualPlayerToTeam(this, oldPlayerId, newPlayerId, teamKey);
  }

  /**
   * Check if a player exists for a team
   * Checks both league players and manual players
   *
   * @param playerId - The player ID to check
   * @param teamKey - The team key (teamId-leagueId)
   * @returns True if the player is associated with the team
   */
  teamHasPlayer(playerId: number, teamKey: string): boolean {
    const playerIds = this.getTeamPlayerIds(teamKey);
    return playerIds.has(playerId);
  }

  // ============================================================================
  // GLOBAL MANUAL OPERATIONS
  // ============================================================================

  /**
   * Load all manual players (team manual + global team manual)
   * Per data-flow-analysis.md: Should be called during app hydration
   */
  async loadAllManualPlayers(): Promise<void> {
    const playerIds = new Set<number>();

    // Collect all team manual players (including global team)
    for (const team of this._teams.values()) {
      for (const [playerId, playerData] of team.players) {
        if (playerData.isManual) {
          playerIds.add(playerId);
        }
      }
    }

    // Load all players in parallel
    await Promise.allSettled(Array.from(playerIds).map((id) => this.loadPlayer(id)));
  }

  /**
   * Load all manual matches (team manual + global team manual)
   * Per data-flow-analysis.md: Should be called during app hydration
   */
  async loadAllManualMatches(): Promise<void> {
    const matchIds = new Set<number>();

    // Collect all team manual matches (including global team)
    for (const team of this._teams.values()) {
      for (const [matchId, matchData] of team.matches) {
        if (matchData.isManual) {
          matchIds.add(matchId);
        }
      }
    }

    // Load all matches in parallel
    await Promise.allSettled(Array.from(matchIds).map((id) => this.loadMatch(id)));

    for (const team of this._teams.values()) {
      const manualMatchIds = Array.from(team.matches.entries())
        .filter(([, matchData]) => matchData.isManual)
        .map(([matchId]) => matchId);

      if (manualMatchIds.length > 0) {
        this.updateTeamMatchParticipation(team.id, manualMatchIds);
      }
    }
  }

  // ============================================================================
  // DATA LOADING OPERATIONS
  // ============================================================================

  /**
   * Load heroes data from API
   * Fetches all heroes from /api/heroes and populates the heroes Map
   */
  async loadHeroesData(): Promise<void> {
    return InitializationOps.loadHeroesData(this);
  }

  /**
   * Load items data from API
   * Fetches all items from /api/items and populates the items Map
   */
  async loadItemsData(): Promise<void> {
    return InitializationOps.loadItemsData(this);
  }

  /**
   * Load leagues data from API
   * Fetches all leagues from /api/leagues and populates the leagues Map
   */
  async loadLeaguesData(): Promise<void> {
    return InitializationOps.loadLeaguesData(this);
  }

  /**
   * Load team data from API and add to store
   * Fetches team data and league matches (cached), uses league name from already-loaded leagues Map
   */
  async loadTeam(teamId: number, leagueId: number): Promise<void> {
    return InitializationOps.loadTeam(this, teamId, leagueId);
  }

  /**
   * Refresh team data from API
   * Re-fetches team data and league matches
   * Always bypasses backend cache to get fresh data
   * @param teamId - Team ID to refresh
   * @param leagueId - League ID to refresh
   */
  async refreshTeam(teamId: number, leagueId: number): Promise<void> {
    return InitializationOps.refreshTeam(this, teamId, leagueId);
  }

  /**
   * Fetch team data and league matches (with caching)
   * @param teamId - Team ID to fetch
   * @param leagueId - League ID to fetch matches for
   * @param fetchTeam - If true, fetches team data; if false, skips team fetch
   * @param forceLeague - If true, bypasses cache for league matches
   * @returns Team data and separate error messages for team and league fetches
   */
  async fetchTeamAndLeagueData(
    teamId: number,
    leagueId: number,
    fetchTeam = false,
    forceLeague = false,
  ): Promise<{ teamData: { name?: string }; teamError?: string; leagueError?: string }> {
    const promises: Promise<unknown>[] = [getOrFetchLeagueMatches(leagueId, this.leagueMatchesCache, forceLeague)];
    if (fetchTeam) promises.push(fetchTeamData(teamId));

    const results = await Promise.allSettled(promises);

    // Handle league matches fetch result
    let leagueError: string | undefined;
    const leagueResult = results[0];
    if (leagueResult.status === 'rejected') {
      leagueError =
        leagueResult.reason instanceof Error ? leagueResult.reason.message : 'Failed to fetch league matches';
      console.error(`Failed to fetch league matches for league ${leagueId}:`, leagueResult.reason);
    }

    // Handle team fetch result (at index 1 if fetched)
    let teamData: { name?: string } = {};
    let teamError: string | undefined;
    if (fetchTeam) {
      const teamResult = results[1];
      if (teamResult.status === 'fulfilled') {
        teamData = teamResult.value as { name?: string };
      } else {
        teamError = teamResult.reason instanceof Error ? teamResult.reason.message : 'Failed to fetch team data';
        console.error(`Failed to fetch team ${teamId}:`, teamResult.reason);
      }
    }

    return { teamData, teamError, leagueError };
  }

  /** Save teams data to localStorage (includes global team) */
  saveToStorage(): void {
    StorageOps.saveToStorage(this);
  }

  /** Load teams data and migrate old global manual items */
  async loadFromStorage(): Promise<LoadedStorageResult> {
    return StorageOps.loadFromStorage(this);
  }

  /** Refresh all teams (active first, then others in parallel) - excludes global team */
  async refreshAllTeams(): Promise<void> {
    return InitializationOps.refreshAllTeams(this);
  }

  // ============================================================================
  // PLAYER STATISTICS CALCULATIONS
  // ============================================================================

  /**
   * Get player statistics (cached)
   * Calculates comprehensive player stats from all matches
   */
  getPlayerStats(playerId: number): PlayerStats {
    return StatisticsOps.getPlayerStats(this, playerId);
  }

  /**
   * Get hero statistics for a player (cached)
   * Calculates hero-specific stats for a player
   */
  getPlayerHeroStats(playerId: number): Map<number, HeroStats> {
    return StatisticsOps.getPlayerHeroStats(this, playerId);
  }

  /**
   * Get team-specific player statistics (cached)
   * Calculates player stats within a specific team context
   */
  getTeamPlayerStats(playerId: number, teamKey: string): TeamPlayerStats {
    return StatisticsOps.getTeamPlayerStats(this, playerId, teamKey);
  }

  /**
   * Get player participated matches for a team
   * Returns matches where the player participated within a team context
   */
  getPlayerParticipatedMatches(playerId: number, teamKey: string): Match[] {
    return StatisticsOps.getPlayerParticipatedMatches(this, playerId, teamKey);
  }

  /**
   * Filter player matches by date range
   * Returns matches filtered by the specified date range
   */
  filterPlayerMatchesByDateRange(playerId: number, dateRange: DateRangeSelection): Match[] {
    return StatisticsOps.filterPlayerMatchesByDateRange(this, playerId, dateRange);
  }
}

/**
 * Storage Operations for AppData
 *
 * Handles persistence operations (save/load) and data migration.
 * Extracted to reduce app-data.ts file size.
 */

import { createPlaceholderTeam } from './app-data-data-ops';
import { createPlaceholderMatch } from './app-data-match-placeholder';
import type { Team, Player, AppDataState, Match, Hero } from './app-data-types';
import { GLOBAL_TEAM_KEY } from './app-data-types';
import {
  loadTeamsFromStorage,
  saveTeamsToStorage,
  type PlaceholderTeamData,
  type StoredPlayerData,
} from './storage-manager';

/**
 * Interface for AppData instance methods needed by storage operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataStorageOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  _players: Map<number, Player>;
  heroes: Map<number, Hero>;
  state: AppDataState;
  setSelectedTeam(teamId: string): void;
  updateTeamsRef(): void;
  updateMatchesRef(): void;
  updatePlayersRef(): void;
  addTeam(team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>): void;
  createGlobalTeam(): Team;
  refreshTeam(teamId: number, leagueId: number): Promise<void>;
}

/**
 * Create the special global team for manual matches/players
 * This virtual team holds items not associated with any real team
 */
export function createGlobalTeam(): Team {
  return {
    id: GLOBAL_TEAM_KEY,
    teamId: 0,
    leagueId: 0,
    name: 'Default',
    leagueName: '',
    timeAdded: 0, // Set to 0 so it's always first when sorted by timeAdded
    matches: new Map(),
    players: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLoading: false,
    highPerformingHeroes: new Set(),
    isGlobal: true,
  };
}

/**
 * Initialize the global team if it doesn't exist
 * Called during construction and after loading from storage
 */
export function ensureGlobalTeam(appData: AppDataStorageOpsContext): void {
  if (!appData._teams.has(GLOBAL_TEAM_KEY)) {
    appData._teams.set(GLOBAL_TEAM_KEY, appData.createGlobalTeam());
    appData.updateTeamsRef();
  }
}

/**
 * Save teams data to localStorage (includes global team)
 */
export function saveToStorage(appData: AppDataStorageOpsContext): void {
  // According to architecture.md, only minimal data is persisted
  // Full match and player data are fetched on demand for performance
  // Pass players Map to get basic player info for display
  saveTeamsToStorage(appData._teams, appData.state.selectedTeamId);
}

/**
 * Load teams data from localStorage
 */
export interface LoadedStorageResult {
  activeTeam: { teamKey: string; teamId: number; leagueId: number } | null;
  otherTeams: Array<{ teamKey: string; teamId: number; leagueId: number }>;
}

export async function loadFromStorage(appData: AppDataStorageOpsContext): Promise<LoadedStorageResult> {
  // Clear existing teams before hydrating from storage
  appData._teams.clear();

  // Always ensure we have the global team available
  ensureGlobalTeam(appData);

  const { teams, placeholders, activeTeamKey } = loadTeamsFromStorage();

  // Insert fully hydrated teams from storage
  teams.forEach((storedTeam) => {
    if (!isValidTeamStructure(storedTeam)) {
      return;
    }

    const hydratedTeam: Team = {
      ...storedTeam,
      matches: new Map(storedTeam.matches),
      players: new Map(storedTeam.players),
      highPerformingHeroes: new Set(storedTeam.highPerformingHeroes),
      isLoading: false,
    };

    appData._teams.set(hydratedTeam.id, hydratedTeam);
  });

  // Insert placeholders for invalid or incomplete stored data
  placeholders.forEach((placeholder) => {
    const team = createTeamFromPlaceholder(placeholder);
    appData._teams.set(team.id, team);
  });

  // Ensure we still have the global team even if storage was empty
  ensureGlobalTeam(appData);

  // Update React state with the new teams Map
  appData.updateTeamsRef();
  ensurePlaceholderMatches(appData);
  ensurePlaceholderPlayers(appData);

  // Determine which team should be selected
  const resolvedActiveTeamKey = activeTeamKey && appData._teams.has(activeTeamKey) ? activeTeamKey : GLOBAL_TEAM_KEY;

  try {
    appData.setSelectedTeam(resolvedActiveTeamKey);
  } catch (error) {
    console.warn(`Failed to set selected team ${resolvedActiveTeamKey}, defaulting to global team`, error);
    appData.setSelectedTeam(GLOBAL_TEAM_KEY);
  }

  const refreshableTeams = Array.from(appData._teams.values()).filter(
    (team) => !team.isGlobal && team.teamId && team.leagueId,
  );

  const activeTeam = refreshableTeams.find((team) => team.id === appData.state.selectedTeamId) ?? null;

  const otherTeams = refreshableTeams
    .filter((team) => !activeTeam || team.id !== activeTeam.id)
    .map((team) => ({
      teamKey: team.id,
      teamId: team.teamId,
      leagueId: team.leagueId,
    }));

  return {
    activeTeam: activeTeam
      ? { teamKey: activeTeam.id, teamId: activeTeam.teamId, leagueId: activeTeam.leagueId }
      : null,
    otherTeams,
  };
}

function ensurePlaceholderMatches(appData: AppDataStorageOpsContext): void {
  let hasNewPlaceholders = false;

  appData._teams.forEach((team) => {
    removeInvalidStoredPlayers(team);
    team.matches.forEach((metadata, matchId) => {
      if (!appData._matches.has(matchId)) {
        const placeholder = createPlaceholderMatch(team, matchId, metadata, appData.heroes);
        appData._matches.set(matchId, placeholder);
        hasNewPlaceholders = true;
      }
    });
  });

  if (hasNewPlaceholders) {
    appData.updateMatchesRef();
  }
}

function ensurePlaceholderPlayers(appData: AppDataStorageOpsContext): void {
  let hasNewPlayers = false;

  appData._teams.forEach((team) => {
    team.players.forEach((storedPlayer, playerId) => {
      if (playerId <= 0 || storedPlayer.accountId <= 0) {
        return;
      }

      if (!appData._players.has(playerId)) {
        const placeholder = createPlaceholderPlayer(storedPlayer);
        appData._players.set(playerId, placeholder);
        hasNewPlayers = true;
      }
    });
  });

  if (hasNewPlayers) {
    appData.updatePlayersRef();
  }
}

function removeInvalidStoredPlayers(team: Team): void {
  const deletedIds: number[] = [];
  team.players.forEach((_, playerId) => {
    if (playerId <= 0) {
      deletedIds.push(playerId);
    }
  });

  deletedIds.forEach((id) => {
    team.players.delete(id);
  });
}

function createPlaceholderPlayer(stored: StoredPlayerData): Player {
  const now = Date.now();
  const wins = Math.round((stored.winRate / 100) * stored.games);
  const losses = stored.games - wins;

  return {
    accountId: stored.accountId,
    profile: {
      name: stored.name,
      personaname: stored.name,
      avatar: stored.avatar,
      avatarfull: stored.avatar,
      rank_tier: stored.rank_tier,
      leaderboard_rank: stored.leaderboard_rank,
    },
    heroStats: stored.topHeroes.map((hero) => ({
      heroId: hero.id,
      games: 0,
      wins: 0,
      lastPlayed: now,
    })),
    overallStats: {
      wins,
      losses,
      totalGames: stored.games,
      winRate: stored.winRate,
    },
    recentMatchIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate that a team has the expected structure
 */
function isValidTeamStructure(team: Team): boolean {
  if (!team || typeof team !== 'object') return false;

  // Check all required properties exist and are correct types
  if (!hasRequiredTeamProperties(team)) return false;

  // Check Map/Set properties
  return hasValidTeamMapsAndSets(team);
}

/**
 * Check if team has all required properties with correct types
 */
function hasRequiredTeamProperties(team: Team): boolean {
  return (
    typeof team.id === 'string' &&
    typeof team.teamId === 'number' &&
    typeof team.leagueId === 'number' &&
    typeof team.name === 'string' &&
    typeof team.leagueName === 'string' &&
    typeof team.timeAdded === 'number' &&
    typeof team.createdAt === 'number' &&
    typeof team.updatedAt === 'number' &&
    typeof team.isLoading === 'boolean'
  );
}

/**
 * Check if team has valid Map and Set properties
 */
function hasValidTeamMapsAndSets(team: Team): boolean {
  return team.matches instanceof Map && team.players instanceof Map && team.highPerformingHeroes instanceof Set;
}

function createTeamFromPlaceholder(placeholder: PlaceholderTeamData): Team {
  const now = Date.now();
  const base = createPlaceholderTeam(placeholder.teamId, placeholder.leagueId, placeholder.timeAdded);
  const isGlobalTeam = placeholder.teamId === 0 && placeholder.leagueId === 0;

  return {
    ...base,
    createdAt: now,
    updatedAt: now,
    matches: new Map(),
    players: new Map(),
    highPerformingHeroes: new Set(),
    isLoading: !isGlobalTeam,
    isGlobal: isGlobalTeam,
  };
}

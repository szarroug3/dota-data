/**
 * Storage Manager
 * Handles localStorage persistence for teams data.
 */

import type { Team } from '@/frontend/lib/app-data/app-data-types';
import {
  parseRankFromString,
  sanitizeAvatar,
  sanitizeBoolean,
  sanitizeDateValue,
  sanitizeDuration,
  sanitizeGames,
  sanitizeMatchResult,
  sanitizeMatchSide,
  sanitizePickOrder,
  sanitizeStoredHeroes,
  sanitizeText,
  sanitizeWinRate,
  type StoredHero,
} from '@/frontend/lib/storage/storage-manager-helpers';
import { cleanupOldTeams, optimizeStorageData } from '@/frontend/lib/storage/storage-manager-optimization';

const STORAGE_KEY = 'dota-scout-assistant-teams';
const ACTIVE_TEAM_STORAGE_KEY = 'dota-scout-assistant-active-team';
export type { StoredHero } from '@/frontend/lib/storage/storage-manager-helpers';

export interface StoredMatchData {
  matchId: number;
  result: 'won' | 'lost';
  opponentName: string;
  side: 'radiant' | 'dire';
  duration: number;
  date: string;
  pickOrder: string;
  heroes: StoredHero[];
  isManual: boolean;
  isHidden: boolean;
}

export interface StoredPlayerData {
  accountId: number;
  name: string;
  rank: string;
  rank_tier: number;
  leaderboard_rank?: number;
  games: number;
  winRate: number;
  topHeroes: StoredHero[];
  avatar: string;
  isManual: boolean;
  isHidden: boolean;
}

export interface StoredTeamData {
  team: { id: number; name: string };
  league: { id: number; name: string };
  timeAdded: string;
  matches: Record<string, StoredMatchData>;
  players: Record<string, StoredPlayerData>;
}

export interface PlaceholderTeamData {
  teamId: number;
  leagueId: number;
  timeAdded?: number;
}

interface LoadedTeamsResult {
  teams: Team[];
  placeholders: PlaceholderTeamData[];
  activeTeamKey: string | null;
}

export interface LoadedTeamsFromDataResult {
  teams: Team[];
  placeholders: PlaceholderTeamData[];
}

export function loadTeamsFromStorage(): LoadedTeamsResult {
  try {
    if (typeof window === 'undefined') {
      return { teams: [], placeholders: [], activeTeamKey: null };
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { teams: [], placeholders: [], activeTeamKey: null };
    }
    const storageData = JSON.parse(stored) as Record<string, unknown>;
    const { teams, placeholders } = loadTeamsFromStoredData(storageData);

    // Load active team
    let activeTeamKey: string | null = null;
    const activeTeamStored = window.localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
    if (activeTeamStored) {
      try {
        const activeTeamData = JSON.parse(activeTeamStored) as { teamId: number; leagueId: number };
        activeTeamKey = `${activeTeamData.teamId}-${activeTeamData.leagueId}`;
      } catch (error) {
        console.warn('Failed to parse active team data:', error);
      }
    }

    return { teams, placeholders, activeTeamKey };
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return { teams: [], placeholders: [], activeTeamKey: null };
  }
}

export function loadTeamsFromStoredData(storageData: Record<string, unknown>): LoadedTeamsFromDataResult {
  const teams: Team[] = [];
  const placeholders: PlaceholderTeamData[] = [];
  Object.entries(storageData).forEach(([teamKey, data]) => {
    processTeamData(teamKey, data, teams, placeholders);
  });
  return { teams, placeholders };
}

function processTeamData(teamKey: string, data: unknown, teams: Team[], placeholders: PlaceholderTeamData[]): void {
  try {
    if (isValidStoredTeamData(data)) {
      const team = convertStorageDataToTeam(teamKey, data);
      teams.push(team);
    } else {
      const placeholder = handleInvalidTeamData(teamKey, data);
      if (placeholder) {
        placeholders.push(placeholder);
      }
    }
  } catch (error) {
    console.warn(`Failed to convert team data for ${teamKey}:`, error);
    const placeholder = handleInvalidTeamData(teamKey, data);
    if (placeholder) {
      placeholders.push(placeholder);
    }
  }
}

function handleInvalidTeamData(teamKey: string, data: unknown): PlaceholderTeamData | null {
  console.warn(`Invalid stored team data for ${teamKey}, will try to load from API:`, data);
  const fromKey = parseTeamKey(teamKey);
  const teamId = extractTeamIdFromData(data) ?? fromKey?.teamId ?? null;
  const leagueId = extractLeagueIdFromData(data) ?? fromKey?.leagueId ?? null;

  if (!teamId || !leagueId) {
    return null;
  }

  const timeAdded = extractTimeAdded(data);
  return { teamId, leagueId, timeAdded: timeAdded ?? undefined };
}

/**
 * Extract teamId from potentially invalid stored data
 */
function extractTeamIdFromData(data: unknown): number | null {
  try {
    const obj = data as Record<string, unknown>;
    const team = (obj?.team as Record<string, unknown>) || {};
    const teamId = (team.id as number) || 0;
    return teamId > 0 ? teamId : null;
  } catch {
    return null;
  }
}

/**
 * Extract leagueId from potentially invalid stored data
 */
function extractLeagueIdFromData(data: unknown): number | null {
  try {
    const obj = data as Record<string, unknown>;
    const league = (obj?.league as Record<string, unknown>) || {};
    const leagueId = (league.id as number) || 0;
    return leagueId > 0 ? leagueId : null;
  } catch {
    return null;
  }
}

function extractTimeAdded(data: unknown): number | null {
  try {
    const obj = data as Record<string, unknown>;
    const timeValue = obj?.timeAdded;
    if (typeof timeValue === 'string') {
      const parsed = Date.parse(timeValue);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function parseTeamKey(teamKey: string): { teamId: number; leagueId: number } | null {
  const [teamIdStr, leagueIdStr] = teamKey.split('-');
  if (!teamIdStr || !leagueIdStr) return null;
  const teamId = Number.parseInt(teamIdStr, 10);
  const leagueId = Number.parseInt(leagueIdStr, 10);
  if (Number.isNaN(teamId) || Number.isNaN(leagueId)) return null;
  return { teamId, leagueId };
}

/**
 * Validate that stored team data has the expected structure
 */
function isValidStoredTeamData(data: unknown): data is StoredTeamData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // Check required top-level properties exist and are correct types
  if (!hasRequiredTopLevelProps(obj)) return false;

  // Check team and league have required properties
  return hasValidTeamAndLeagueProps(obj);
}

/**
 * Check if object has required top-level properties
 */
function hasRequiredTopLevelProps(obj: Record<string, unknown>): boolean {
  return Boolean(
    obj.team &&
    typeof obj.team === 'object' &&
    obj.league &&
    typeof obj.league === 'object' &&
    typeof obj.timeAdded === 'string' &&
    obj.matches &&
    typeof obj.matches === 'object' &&
    obj.players &&
    typeof obj.players === 'object',
  );
}

/**
 * Check if team and league have valid properties
 */
function hasValidTeamAndLeagueProps(obj: Record<string, unknown>): boolean {
  const team = obj.team as Record<string, unknown>;
  const league = obj.league as Record<string, unknown>;

  return (
    typeof team.id === 'number' &&
    typeof team.name === 'string' &&
    typeof league.id === 'number' &&
    typeof league.name === 'string'
  );
}

/**
 * Get consolidated match information for storage (includes all matches with isManual/isHidden flags)
 */
function getTeamMatchesConsolidatedInfo(team: Team): Record<string, StoredMatchData> {
  const allMatches: Record<string, StoredMatchData> = {};

  team.matches.forEach((matchData, matchId) => {
    allMatches[matchId.toString()] = normalizeMatchData(matchId, matchData);
  });

  return allMatches;
}

/**
 * Get consolidated player information for storage (includes all players with isManual/isHidden flags)
 */
function getTeamPlayersConsolidatedInfo(team: Team): Record<string, StoredPlayerData> {
  const allPlayers: Record<string, StoredPlayerData> = {};

  team.players.forEach((playerData, playerId) => {
    if (typeof playerId !== 'number' || playerId <= 0) {
      return;
    }

    allPlayers[playerId.toString()] = normalizePlayerData(playerId, playerData);
  });

  return allPlayers;
}

/**
 * Convert storage data to Team object
 */
function convertStorageDataToTeam(teamKey: string, data: StoredTeamData): Team {
  const now = Date.now();
  const isGlobalTeam = data.team.id === 0 && data.league.id === 0;

  // Reconstruct matches and players Maps from stored data
  const matches = new Map<number, StoredMatchData>();
  const players = new Map<number, StoredPlayerData>();

  if (data.matches) {
    Object.entries(data.matches).forEach(([matchIdStr, matchData]) => {
      const matchId = parseInt(matchIdStr);
      if (!isNaN(matchId)) {
        matches.set(matchId, normalizeMatchData(matchId, matchData));
      }
    });
  }

  if (data.players) {
    Object.entries(data.players).forEach(([playerIdStr, playerData]) => {
      const playerId = parseInt(playerIdStr);
      if (!isNaN(playerId) && playerId > 0) {
        players.set(playerId, normalizePlayerData(playerId, playerData));
      }
    });
  }

  return {
    id: teamKey,
    teamId: data.team.id,
    leagueId: data.league.id,
    name: data.team.name,
    leagueName: data.league.name,
    timeAdded: safeTimeValue(data.timeAdded),
    matches,
    players,
    isLoading: false,
    isGlobal: isGlobalTeam,
    createdAt: now,
    updatedAt: now,
    highPerformingHeroes: new Set(),
  };
}

function safeTimeValue(time: string): number {
  const parsed = Date.parse(time);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeMatchData(matchId: number, data: unknown): StoredMatchData {
  const value = (data ?? {}) as Partial<StoredMatchData> & Record<string, unknown>;

  const opponentName = sanitizeText(value.opponentName, 'Unknown');
  const result = sanitizeMatchResult(value.result);
  const side = sanitizeMatchSide(value.side);
  const duration = sanitizeDuration(value.duration);
  const date = sanitizeDateValue(value.date);
  const pickOrder = sanitizePickOrder(value.pickOrder);
  const heroes = sanitizeStoredHeroes(value.heroes);
  const isManual = sanitizeBoolean(value.isManual);
  const isHidden = sanitizeBoolean(value.isHidden);

  return {
    matchId,
    opponentName,
    result,
    side,
    duration,
    date,
    pickOrder,
    heroes,
    isManual,
    isHidden,
  };
}

function normalizePlayerData(playerId: number, data: unknown): StoredPlayerData {
  const value = (data ?? {}) as Partial<StoredPlayerData> & Record<string, unknown>;

  const name = sanitizeText(value.name, 'Unknown Player');
  const rank = sanitizeText(value.rank, 'Unknown');
  const games = sanitizeGames(value.games);
  const winRate = sanitizeWinRate(value.winRate);
  const topHeroes = sanitizeStoredHeroes(value.topHeroes);
  const avatar = sanitizeAvatar(value.avatar);
  const isManual = sanitizeBoolean(value.isManual);
  const isHidden = sanitizeBoolean(value.isHidden);

  // Parse rank information if not already present
  let rankTier = value.rank_tier;
  let leaderboardRank = value.leaderboard_rank;

  if (rankTier === undefined) {
    const parsed = parseRankFromString(rank);
    rankTier = parsed.rankTier;
    leaderboardRank = parsed.leaderboardRank;
  }

  return {
    accountId: playerId,
    name,
    rank,
    rank_tier: rankTier,
    leaderboard_rank: leaderboardRank,
    games,
    winRate,
    topHeroes,
    avatar,
    isManual,
    isHidden,
  };
}

function buildStorageData(teams: Map<string, Team>): Record<string, StoredTeamData> {
  const storageData: Record<string, StoredTeamData> = {};

  teams.forEach((team) => {
    if (typeof team.teamId !== 'number' || typeof team.leagueId !== 'number') {
      return;
    }

    storageData[team.id] = {
      team: {
        id: team.teamId,
        name: team.name,
      },
      league: {
        id: team.leagueId,
        name: team.leagueName,
      },
      timeAdded: new Date(team.timeAdded).toISOString(),
      matches: getTeamMatchesConsolidatedInfo(team),
      players: getTeamPlayersConsolidatedInfo(team),
    };
  });

  return storageData;
}

export function buildStoredTeamsPayload(teams: Map<string, Team>): Record<string, StoredTeamData> {
  return buildStorageData(teams);
}

function isStorageQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.code === 22 || error.code === 1014 || error.name === 'QuotaExceededError')
  );
}

function persistActiveTeam(teams: Map<string, Team>, selectedTeamId: string): void {
  if (!selectedTeamId) {
    window.localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
    return;
  }

  const activeTeam = teams.get(selectedTeamId);
  if (!activeTeam) {
    return;
  }

  window.localStorage.setItem(
    ACTIVE_TEAM_STORAGE_KEY,
    JSON.stringify({
      teamId: activeTeam.teamId,
      leagueId: activeTeam.leagueId,
    }),
  );
}

function saveWithQuotaFallbacks(
  storageData: Record<string, StoredTeamData>,
  teams: Map<string, Team>,
  selectedTeamId: string,
): void {
  let dataToSave = storageData;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      persistActiveTeam(teams, selectedTeamId);
      return;
    } catch (error) {
      if (!isStorageQuotaError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      if (attempt === 0) {
        console.warn('Storage quota warning: Optimizing data by limiting matches/players per team');
        dataToSave = optimizeStorageData(dataToSave, 100, 50);
        continue;
      }

      console.warn('Storage quota warning: Cleaning up old teams and further reducing data');
      dataToSave = optimizeStorageData(cleanupOldTeams(dataToSave), 50, 30);
    }
  }
}

export function saveTeamsToStorage(teams: Map<string, Team>, selectedTeamId: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const storageData = buildStorageData(teams);
    saveWithQuotaFallbacks(storageData, teams, selectedTeamId);
  } catch (error) {
    console.error('Failed to save teams to storage after all optimization attempts:', error);
    if (isStorageQuotaError(error)) {
      console.error('localStorage quota exceeded. Consider clearing old data or reducing the number of teams.');
    }
  }
}

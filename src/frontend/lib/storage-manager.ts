/**
 * Storage Manager
 * Handles localStorage persistence for teams data.
 */

import type { Team } from './app-data-types';

const STORAGE_KEY = 'dota-scout-assistant-teams';
const ACTIVE_TEAM_STORAGE_KEY = 'dota-scout-assistant-active-team';
const DEFAULT_DATE = new Date(0).toISOString();

/**
 * Basic match information stored in localStorage
 */
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

/**
 * Stored hero summary for match metadata
 */
export interface StoredHero {
  id: number;
  name: string;
  localizedName: string;
  imageUrl: string;
}

/**
 * Basic player information stored in localStorage
 */
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

/**
 * Parse rank string to extract rank_tier and leaderboard_rank
 * Handles formats like "Legend 5", "Immortal #1493", "Ancient 3", etc.
 * Returns { rankTier: number, leaderboardRank?: number }
 */
function parseRankFromString(rank: string): { rankTier: number; leaderboardRank?: number } {
  const normalized = rank.toLowerCase().trim();

  // Base tier mapping
  const tiers: Record<string, number> = {
    herald: 10,
    guardian: 20,
    crusader: 30,
    archon: 40,
    legend: 50,
    ancient: 60,
    divine: 70,
    immortal: 80,
  };

  // Find the base tier
  const tier = Object.keys(tiers).find((key) => normalized.includes(key));
  if (!tier) {
    return { rankTier: 0 };
  }

  const baseTier = tiers[tier];

  // Handle immortal rank (e.g., "Immortal #1493" -> rank_tier: 80, leaderboard_rank: 1493)
  if (tier === 'immortal') {
    const rankMatch = normalized.match(/#(\d+)/);
    if (rankMatch) {
      const immortalRank = parseInt(rankMatch[1], 10);
      return { rankTier: 80, leaderboardRank: immortalRank };
    }
    return { rankTier: 80 };
  }

  // Handle other ranks with star count (e.g., "Legend 5" -> rank_tier: 54)
  const starMatch = normalized.match(/\b(\d+)\b/);
  if (starMatch) {
    const stars = parseInt(starMatch[1], 10);
    if (stars >= 1 && stars <= 5) {
      return { rankTier: baseTier + stars };
    }
  }

  return { rankTier: baseTier };
}

/**
 * Storage format for a single team (matches old system format)
 */
interface StoredTeamData {
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

/**
 * Load teams data from localStorage and convert to Team objects.
 */
export function loadTeamsFromStorage(): LoadedTeamsResult {
  try {
    if (typeof window === 'undefined') {
      return { teams: [], placeholders: [], activeTeamKey: null };
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { teams: [], placeholders: [], activeTeamKey: null };
    }

    const storageData = JSON.parse(stored) as Record<string, StoredTeamData>;

    const teams: Team[] = [];
    const placeholders: PlaceholderTeamData[] = [];

    Object.entries(storageData).forEach(([teamKey, data]) => {
      processTeamData(teamKey, data, teams, placeholders);
    });

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

/**
 * Process a single team's data from storage
 */
function processTeamData(
  teamKey: string,
  data: unknown,
  teams: Team[],
  placeholders: PlaceholderTeamData[],
): void {
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

/**
 * Handle invalid team data by extracting minimal placeholder information
 */
function handleInvalidTeamData(
  teamKey: string,
  data: unknown,
): PlaceholderTeamData | null {
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

  // Process matches
  if (data.matches) {
    Object.entries(data.matches).forEach(([matchIdStr, matchData]) => {
      const matchId = parseInt(matchIdStr);
      if (!isNaN(matchId)) {
        matches.set(matchId, normalizeMatchData(matchId, matchData));
      }
    });
  }

  // Process players
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

function sanitizeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function sanitizeMatchResult(value: unknown): 'won' | 'lost' {
  return value === 'won' ? 'won' : 'lost';
}

function sanitizeMatchSide(value: unknown): 'radiant' | 'dire' {
  return value === 'dire' ? 'dire' : 'radiant';
}

function sanitizeDuration(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function sanitizeDateValue(value: unknown): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return DEFAULT_DATE;
}

function sanitizePickOrder(value: unknown): string {
  return sanitizeText(value, 'unknown');
}

function sanitizeBoolean(value: unknown): boolean {
  return Boolean(value);
}

function sanitizeGames(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function sanitizeWinRate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function sanitizeAvatar(value: unknown): string {
  return typeof value === 'string' ? value : '';
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

function sanitizeStoredHeroes(value: unknown): StoredHero[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const heroes: StoredHero[] = [];
  value.forEach((entry) => {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      heroes.push(createFallbackHeroSummary(entry));
      return;
    }

    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const id = typeof obj.id === 'number' && Number.isFinite(obj.id) ? Math.trunc(obj.id) : null;
      if (id === null) return;

      heroes.push({
        id,
        name: sanitizeText(obj.name, `npc_dota_hero_${id}`),
        localizedName: sanitizeText(obj.localizedName, `Hero ${id}`),
        imageUrl: sanitizeText(obj.imageUrl, ''),
      });
    }
  });

  const unique = new Map<number, StoredHero>();
  heroes.forEach((hero) => unique.set(hero.id, hero));
  return Array.from(unique.values());
}

function createFallbackHeroSummary(id: number): StoredHero {
  return {
    id,
    name: `npc_dota_hero_${id}`,
    localizedName: `Hero ${id}`,
    imageUrl: '',
  };
}

/**
 * Save matches and players data to teams storage
 * Updates the existing teams storage with full match data and player IDs
 */
export function saveTeamsToStorage(teams: Map<string, Team>, selectedTeamId: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const storageData: Record<string, StoredTeamData> = {};

    // Convert teams Map to storage format (minimal data only per architecture)
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
        matches: getTeamMatchesConsolidatedInfo(team), // Consolidated match info for display
        players: getTeamPlayersConsolidatedInfo(team), // Consolidated player info for display
      };
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    // Save active team separately
    if (selectedTeamId) {
      const activeTeam = teams.get(selectedTeamId);
      if (activeTeam) {
        window.localStorage.setItem(
          ACTIVE_TEAM_STORAGE_KEY,
          JSON.stringify({
            teamId: activeTeam.teamId,
            leagueId: activeTeam.leagueId,
          }),
        );
      }
    } else {
      window.localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save teams to storage:', error);
  }
}

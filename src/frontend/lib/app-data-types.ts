/**
 * Type definitions for AppData
 */

import type { StoredMatchData, StoredPlayerData } from './storage-manager';

// ============================================================================
// PLAYER ROLES
// ============================================================================

/**
 * Player role types for Dota 2
 */
export type PlayerRole = 'Carry' | 'Mid' | 'Offlane' | 'Soft Support' | 'Hard Support';

// ============================================================================
// MATCH DATA
// ============================================================================

/**
 * Match structure - used throughout the application
 * Contains full match data including draft, players, and statistics
 */
export interface Match {
  // Basic match information
  id: number;
  date: string;
  duration: number;

  // Team information
  radiant: {
    id?: number;
    name?: string;
  };
  dire: {
    id?: number;
    name?: string;
  };

  // Draft information
  draft: {
    radiantPicks: HeroPick[];
    direPicks: HeroPick[];
    radiantBans: Hero[];
    direBans: Hero[];
  };

  // Player information
  players: {
    radiant: PlayerMatchData[];
    dire: PlayerMatchData[];
  };

  // Match statistics
  statistics: {
    radiantScore: number;
    direScore: number;
    goldAdvantage: {
      times: number[];
      radiantGold: number[];
      direGold: number[];
    };
    experienceAdvantage: {
      times: number[];
      radiantExperience: number[];
      direExperience: number[];
    };
  };

  // Match events
  events: MatchEvent[];

  // Match result
  result: 'radiant' | 'dire';

  // Pick order information
  pickOrder?: {
    radiant: 'first' | 'second' | null;
    dire: 'first' | 'second' | null;
  };

  processedDraft?: DraftPhase[];
  processedEvents?: GameEvent[];
  teamFightStats?: unknown;

  // State
  error?: string;
  isLoading?: boolean;
}

export interface HeroPick {
  hero: Hero; // Full Hero object for UI display
  order: number;
  accountId?: number;
  role?: { role: string; lane: number };
}

export interface PlayerMatchData {
  accountId: number;
  playerName: string;
  hero: Hero; // Full Hero object for UI display
  role?: { role: string; lane: number };

  // Performance stats
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    lastHits: number;
    denies: number;
    gpm: number;
    xpm: number;
    netWorth: number;
    level: number;
  };

  // Items
  items: Item[]; // Full Item objects for UI display

  // Hero-specific stats
  heroStats: {
    damageDealt: number;
    healingDone: number;
    towerDamage: number;
  };
}

export interface MatchEvent {
  timestamp: number;
  type: EventType;
  side: 'radiant' | 'dire';
  details: EventDetails;
}

export type EventType =
  | 'CHAT_MESSAGE_FIRSTBLOOD'
  | 'CHAT_MESSAGE_ROSHAN_KILL'
  | 'CHAT_MESSAGE_AEGIS'
  | 'building_kill'
  | 'CHAT_MESSAGE_COURIER_LOST'
  | 'team_fight'
  | 'hero_kill'
  | 'bounty_rune'
  | 'power_rune'
  | 'ward_placed'
  | 'ward_killed'
  | 'smoke_used'
  | 'gem_dropped'
  | 'gem_picked_up';

export interface EventDetails {
  // For hero kills
  killer?: string; // Player ID
  victim?: string; // Player ID
  assists?: string[]; // Player IDs

  // Hero information for tooltips
  killerHero?: Hero;
  victimHero?: Hero;
  aegisHolderHero?: Hero;

  // For tower/barracks kills
  buildingType?: 'tower' | 'barracks';
  buildingTier?: number;
  buildingLane?: 'top' | 'mid' | 'bottom';

  // For team fights
  participants?: string[]; // Player IDs
  duration?: number;
  casualties?: number;
  playerDetails?: Array<{
    playerIndex: number;
    deaths: number;
    buybacks: number;
    goldDelta: number;
    xpDelta: number;
    damage: number;
    healing: number;
  }>;

  // For roshan
  roshanKiller?: 'radiant' | 'dire'; // Team that killed roshan
  aegisHolder?: string; // Player ID

  // For runes
  runeType?: string;
  runeLocation?: string;

  // For wards
  wardType?: 'observer' | 'sentry';
  wardLocation?: string;
}

export interface GameEvent {
  type: EventType;
  time: number;
  description: string;
  team: 'radiant' | 'dire';
  details?: EventDetails;
}

export interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: Hero;
  time: number;
}

// ============================================================================
// TEAM DATA
// ============================================================================

/**
 * Team data structure for UI display
 * Minimal structure for now - will be extended with computed data in future steps
 */
export interface TeamDisplayData {
  team: { id: number; name: string };
  league: { id: number; name: string };
  timeAdded: string;
  matches: Record<number, unknown>;
  manualMatches: Record<number, { side: 'radiant' | 'dire' }>;
  manualPlayers: number[];
  players: unknown[];
  performance: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;
    erroredMatches: number;
  };
  isLoading: boolean;
  error?: string;
  isGlobal?: boolean;
}

/**
 * Special team key for global/unassociated manual items
 * This virtual team holds matches and players not associated with any real team
 */
export const GLOBAL_TEAM_KEY = '0-0';

/**
 * Team structure for AppData
 * Minimal metadata - will be extended with computed data later
 */
export interface Team {
  id: string; // Format: `${teamId}-${leagueId}` or GLOBAL_TEAM_KEY for global team
  teamId: number; // 0 for global team
  leagueId: number; // 0 for global team
  name: string;
  leagueName: string;
  timeAdded: number;
  matches: Map<number, StoredMatchData>; // All matches with full cached data
  players: Map<number, StoredPlayerData>; // All players with full cached data
  createdAt: number;
  updatedAt: number;
  isLoading: boolean;
  teamError?: string;
  leagueError?: string;
  highPerformingHeroes: Set<string>;
  isGlobal?: boolean; // True if this is the special global team
}

/**
 * Player structure for AppData
 * Stores comprehensive player data from OpenDota
 */
export interface Player {
  accountId: number;

  // Profile data
  profile: {
    name: string;
    personaname: string;
    avatar?: string;
    avatarfull?: string;
    profileurl?: string;
    rank_tier: number;
    leaderboard_rank?: number;
  };

  // Hero statistics (per-hero performance from OpenDota)
  // Note: Detailed stats (kills, deaths, GPM, etc.) are computed from match data, not stored here
  heroStats: Array<{
    heroId: number;
    games: number;
    wins: number;
    lastPlayed: number; // Unix timestamp
  }>;

  // Overall statistics
  overallStats: {
    wins: number;
    losses: number;
    totalGames: number;
    winRate: number;
  };

  // Recent matches (just IDs, full data in matches Map)
  recentMatchIds: number[];

  // State
  error?: string;
  isLoading?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Hero structure for AppData
 * Minimal data - will be extended with computed data later
 */
export interface Hero {
  id: number;
  name: string;
  localizedName: string;
  imageUrl: string;
  primaryAttribute?: 'strength' | 'agility' | 'intelligence';
  attackType?: 'melee' | 'ranged';
  roles?: string[];
  error?: string;
}

/**
 * Item structure for AppData
 * Minimal data - will be extended with computed data later
 */
export interface Item {
  id: number;
  name: string;
  imageUrl: string;
  cost?: number;
  error?: string;
}

/**
 * League structure for AppData
 * Minimal data - will be extended with computed data later
 */
export interface League {
  id: number;
  name: string;
  error?: string;
}

/**
 * League match info
 * Minimal data extracted from Steam API for a single match
 */
export interface LeagueMatchInfo {
  matchId: number;
  radiantTeamId?: number;
  direTeamId?: number;
  radiantPlayerIds: number[];
  direPlayerIds: number[];
}

/**
 * Processed league matches cache entry
 * Stores match info with team and player data
 */
export interface LeagueMatchesCache {
  matches: Map<number, LeagueMatchInfo>;
  matchIdsByTeam: Map<number, number[]>;
  fetchedAt: number; // Timestamp when data was fetched
}

export interface TeamMatchMetadata {
  side: 'radiant' | 'dire';
  result: 'won' | 'lost';
  opponentName: string;
  isManual: boolean;
  isHidden: boolean;
}

export interface TeamPlayerMetadata {
  isManual: boolean;
  isHidden: boolean;
}

export type TeamMatchParticipation = TeamMatchMetadata;

/**
 * UI state interface
 * Note: selectedTeamId is NEVER null - defaults to GLOBAL_TEAM_KEY
 */
export interface AppDataState {
  selectedTeamId: string; // Team key: "teamId-leagueId" or GLOBAL_TEAM_KEY
  selectedTeamIdParsed: { teamId: number; leagueId: number }; // Parsed IDs (0-0 for global team)
  selectedMatchId: number | null;
  selectedPlayerId: number | null;
  isLoading: boolean;
  error: string | null;
}

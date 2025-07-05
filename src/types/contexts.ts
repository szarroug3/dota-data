/**
 * Context-related type definitions
 * 
 * Contains interfaces for all React contexts used throughout the application.
 * These types are shared between contexts and API routes.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Team, Player, Match } from './team';
import type { PlayerStats } from '../lib/types/data-service';

// ============================================================================
// DATA FETCHING CONTEXT TYPES
// ============================================================================

export interface FetchingState {
  [key: string]: {
    isLoading: boolean;
    startTime: number;
    error?: string;
  };
}

export interface DataFetchingContextType {
  // Track fetching states
  fetchingStates: FetchingState;
  
  // Start a fetch operation
  startFetch: (key: string) => void;
  
  // Complete a fetch operation
  completeFetch: (key: string, error?: string) => void;
  
  // Check if something is currently fetching
  isFetching: (key: string) => boolean;
  
  // Get all currently fetching keys
  getFetchingKeys: () => string[];
  
  // Clear a specific fetch state
  clearFetch: (key: string) => void;
  
  // Clear all fetch states
  clearAllFetches: () => void;
}

export interface FetchTrackerReturn {
  isLoading: boolean;
  trackFetch: <T>(fetchPromise: Promise<T>) => Promise<T>;
}

// ============================================================================
// MATCH DATA CONTEXT TYPES
// ============================================================================

// Define MatchData interface here to avoid circular dependency
export interface MatchData {
  id: string;
  date: string;
  opponent: string;
  result: string;
  score: string;
  duration: string;
  league: string;
  map: string;
  picks: string[];
  bans: string[];
  opponentPicks: string[];
  opponentBans: string[];
  draftOrder: string[];
  highlights: string[];
  playerStats: {
    kills: number;
    deaths: number;
    assists: number;
    gpm?: number;
    xpm?: number;
    hero: string;
    heroDamage?: number;
    towerDamage?: number;
    lastHits?: number;
    denies?: number;
  };
  games: Array<{
    picks: string[];
    bans: string[];
    opponentPicks: string[];
    opponentBans: string[];
    draftOrder: string[];
    highlights: string[];
    playerStats: {
      kills: number;
      deaths: number;
      assists: number;
      gpm?: number;
      xpm?: number;
    };
    duration: string;
    score: string;
  }>;
}

export interface MatchDataContextType {
  // Cached match data by team ID
  matchDataByTeam: Record<string, MatchData[]>;
  // Loading states by team ID
  loadingByTeam: Record<string, boolean>;
  // Error states by team ID
  errorByTeam: Record<string, string | null>;
  // Trigger fetching for a specific team
  fetchTeamMatches: (teamId: string, matchIds: string[]) => Promise<void>;
  // Get matches for a team (from cache or trigger fetch)
  getTeamMatches: (teamId: string, matchIds: string[]) => MatchData[];
  // Check if team data is loading
  isTeamLoading: (teamId: string) => boolean;
  // Get error for a team
  getTeamError: (teamId: string) => string | null;
}

export interface NetworkError extends Error {
  name: 'NetworkError';
}

export interface TimeoutError extends Error {
  name: 'AbortError';
}

// ============================================================================
// PLAYER DATA CONTEXT TYPES
// ============================================================================

export interface PlayerDataContextType {
  // Cached player data by player ID
  playerDataByPlayer: Record<string, PlayerStats>;
  // Loading states by player ID
  loadingByPlayer: Record<string, boolean>;
  // Error states by player ID
  errorByPlayer: Record<string, string | null>;
  // Trigger fetching for a specific player
  fetchPlayerData: (playerId: string, playerName: string, role: string) => Promise<void>;
  // Get player data for a player (from cache or trigger fetch)
  getPlayerData: (playerId: string) => PlayerStats | null;
  // Check if player data is loading
  isPlayerLoading: (playerId: string) => boolean;
  // Get error for a player
  getPlayerError: (playerId: string) => string | null;
  // Update player data in cache
  updatePlayerData: (playerId: string, playerData: PlayerStats) => void;
  // Remove player data from cache
  removePlayerData: (playerId: string) => void;
}

// ============================================================================
// TEAM DATA CONTEXT TYPES
// ============================================================================

export interface TeamDataContextType {
  // Cached team data by team ID
  teamDataByTeam: Record<string, Team>;
  // Loading states by team ID
  loadingByTeam: Record<string, boolean>;
  // Error states by team ID
  errorByTeam: Record<string, string | null>;
  // Trigger fetching for a specific team
  fetchTeamData: (teamId: string) => Promise<void>;
  // Get team data for a team (from cache or trigger fetch)
  getTeamData: (teamId: string) => Team | null;
  // Check if team data is loading
  isTeamLoading: (teamId: string) => boolean;
  // Get error for a team
  getTeamError: (teamId: string) => string | null;
  // Update team data in cache
  updateTeamData: (teamId: string, teamData: Team) => void;
  // Remove team data from cache
  removeTeamData: (teamId: string) => void;
}

// ============================================================================
// SIDEBAR CONTEXT TYPES
// ============================================================================

export type PreferredSite = "dotabuff" | "opendota";

export interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  preferredSite: PreferredSite;
  setPreferredSite: (site: PreferredSite) => void;
}

// ============================================================================
// TEAM CONTEXT TYPES
// ============================================================================

export interface TeamContextType {
  // Teams management
  teams: Team[];
  activeTeam: Team | null;
  isLoaded: boolean;
  
  // Team operations
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string) => void;
  setActiveTeam: (teamId: string | null) => void;
  
  // Team data operations
  updateTeamName: (teamId: string, teamName: string) => void;
  updateMatchIds: (teamId: string, matchIds: string[]) => void;
  
  // Player operations
  addManualPlayer: (teamId: string, player: Omit<Player, "addedDate">) => void;
  removeManualPlayer: (teamId: string, playerId: string) => void;
  hidePlayer: (teamId: string, playerId: string) => void;
  unhidePlayer: (teamId: string, playerId: string) => void;
  
  // Match operations
  addManualMatch: (teamId: string, match: Omit<Match, "id">) => void;
  removeManualMatch: (teamId: string, matchId: string) => void;
  hideMatch: (teamId: string, matchId: string) => void;
  unhideMatch: (teamId: string, matchId: string) => void;
  
  // Utility functions
  getTeamById: (teamId: string) => Team | null;
  getVisibleMatches: (teamId: string) => Match[];
  getVisiblePlayers: (teamId: string) => Player[];
  
  // Legacy compatibility properties
  currentTeam: Team | null; // Alias for activeTeam
  matches: Match[]; // Current team's visible matches
  addMatch: (match: Omit<Match, "id">) => Promise<void>; // Add match to current team
  removeMatch: (matchId: string) => void; // Remove match from current team
  hiddenMatchIds: string[]; // Current team's hidden match IDs
  setCurrentTeam: (team: Team | string | null) => Promise<void>; // Legacy setCurrentTeam
  addStandinPlayer: (player: Omit<Player, "isStandin" | "addedDate">, standinForId?: string) => void;
  removeStandinPlayer: (playerId: string) => void;
  getExternalLinks: () => Array<{ href: string; label: string; icon: string }>;
}

 
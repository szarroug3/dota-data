/**
 * API-related type definitions
 * 
 * Contains interfaces for API requests, responses, and shared types
 * used by both frontend contexts and backend API routes.
 */

// ============================================================================
// TEAM API TYPES
// ============================================================================

export interface TeamMatchesRequest {
  leagueId: string;
  force?: boolean;
}

export interface TeamMatchesResponse {
  teamName: string;
  matchIdsByLeague: Record<string, string[]>;
}

export interface TeamApiResponse {
  teamName?: string;
  matchIds?: string[];
}

// ============================================================================
// MATCH API TYPES
// ============================================================================

export interface MatchRequest {
  force?: boolean;
}

export interface MatchResponse {
  id: string;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  duration: string;
  league: string;
  map: string;
  picks: string[];
  bans: string[];
  opponentPicks: string[];
  opponentBans: string[];
  draftOrder: unknown[];
  highlights: string[];
  playerStats: Record<string, unknown>;
  games: Array<{
    picks: string[];
    bans: string[];
    opponentPicks: string[];
    opponentBans: string[];
    draftOrder: unknown[];
    highlights: string[];
    playerStats: Record<string, unknown>;
    duration: string;
    score: string;
  }>;
  openDota?: {
    isRadiant: boolean;
    radiantWin: boolean;
    startTime: number;
    matchId: number;
  };
}

// ============================================================================
// PLAYER API TYPES
// ============================================================================

export interface PlayerStatsRequest {
  force?: boolean;
}

export interface PlayerStatsResponse {
  name: string;
  role: string;
  overallStats: {
    matches: number;
    winRate: number;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
    avgGameLength: string;
  };
  recentPerformance: Array<{
    date: string;
    hero: string;
    result: string;
    KDA: string;
    GPM: number;
  }>;
  topHeroes: Array<{
    hero: string;
    games: number;
    winRate: number;
    avgKDA: number;
    avgGPM: number;
  }>;
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
  rank: string;
  stars?: number;
  immortalRank?: number;
  rankImage: string;
  recentlyPlayed: Array<{
    hero: string;
    heroImage: string;
    games: number;
    winRate: number;
  }>;
}

// ============================================================================
// LEAGUE API TYPES
// ============================================================================

export interface LeagueResponse {
  leagueName: string;
}

// ============================================================================
// HERO API TYPES
// ============================================================================

export interface HeroResponse {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  img: string;
  icon: string;
  base_health: number;
  base_mana: number;
  base_armor: number;
  base_attack_min: number;
  base_attack_max: number;
  move_speed: number;
  base_attack_time: number;
  attack_point: number;
  attack_range: number;
  projectile_speed: number;
  turn_rate: number;
  cm_enabled: boolean;
  legs: number;
  day_vision: number;
  night_vision: number;
  hero_id: number;
  turbo_picks: number;
  turbo_wins: number;
  pro_ban: number;
  pro_win: number;
  pro_pick: number;
  "1_pick": number;
  "1_win": number;
  "2_pick": number;
  "2_win": number;
  "3_pick": number;
  "3_win": number;
  "4_pick": number;
  "4_win": number;
  "5_pick": number;
  "5_win": number;
  "6_pick": number;
  "6_win": number;
  "7_pick": number;
  "7_win": number;
  "8_pick": number;
  "8_win": number;
  null_pick: number;
  null_win: number;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  status?: number;
}

export interface ApiStatusResponse {
  status: string;
  signature: string;
}

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export type ApiResponse<T> = T | ApiErrorResponse | ApiStatusResponse;

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export types that were previously in contexts.ts
export type { PlayerStats } from '../lib/types/data-service'; 
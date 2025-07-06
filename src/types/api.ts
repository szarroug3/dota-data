/**
 * API-related type definitions
 * 
 * Contains interfaces for API requests, responses, and shared types
 * used by both frontend contexts and backend API routes.
 */

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export interface ApiRequest {
  force?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  status?: number;
}

export interface ApiStatusResponse {
  status: string;
  signature: string;
}

export type ApiResponse<T> = T | ApiErrorResponse | ApiStatusResponse;

// ============================================================================
// PLAYER API TYPES
// ============================================================================

export interface PlayerRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerResponse {
  profile: {
    account_id: number;
    personaname: string;
    name: string | null;
    plus: boolean;
    cheese: number;
    steamid: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    profileurl: string;
    last_login: string;
    loccountrycode: string;
    status: string | null;
    fh_unavailable: boolean;
    is_contributor: boolean;
    is_subscriber: boolean;
  };
  rank_tier: number;
  leaderboard_rank: number;
}

export interface PlayerMatchesRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerMatchesResponse {
  // Array of match objects
  [key: number]: {
    match_id: number;
    start_time: number;
    duration: number;
    radiant_win: boolean;
    players: PlayerMatchPlayer[];
    radiant_name?: string;
    dire_name?: string;
    radiant_team_id?: number;
    dire_team_id?: number;
    radiant_score?: number;
    dire_score?: number;
    leagueid?: number;
    picks_bans?: Array<{ is_pick: boolean; hero_id: number; team: number; order: number }>;
  };
}

export interface PlayerMatchPlayer {
  account_id: number;
  player_slot: number;
  hero_id: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0: number;
  backpack_1: number;
  backpack_2: number;
  item_neutral: number;
  kills: number;
  deaths: number;
  assists: number;
  leaver_status: number;
  last_hits: number;
  denies: number;
  gold_per_min: number;
  xp_per_min: number;
  level: number;
  gold: number;
  gold_spent: number;
  hero_damage: number;
  scaled_hero_damage: number;
  tower_damage: number;
  scaled_tower_damage: number;
  hero_healing: number;
  scaled_hero_healing: number;
  isRadiant: boolean;
  win: number;
  lose: number;
  total_gold: number;
  total_xp: number;
  kills_per_min: number;
  kda: number;
  abandons: number;
  neutral_kills: number;
  tower_kills: number;
  courier_kills: number;
  lane_kills: number;
  hero_kills: number;
  observer_kills: number;
  sentry_kills: number;
  roshan_kills: number;
  necronomicon_kills: number;
  ancient_kills: number;
  buyback_count: number;
  observer_uses: number;
  sentry_uses: number;
  lane_efficiency_pct: number;
  lane: number;
  lane_role: number;
  is_roaming: boolean;
  purchase_time: Record<string, number>;
  first_purchase_time: Record<string, number>;
  item_win: Record<string, number>;
  item_usage: Record<string, number>;
  purchase_tpscroll: number;
  actions_per_min: number;
  life_state_dead: number;
  rank_tier: number;
  cosmetics: number[];
  benchmarks: Record<string, number>;
}

export interface PlayerRecentMatchesRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerRecentMatchesResponse {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  hero_id: number;
  start_time: number;
  duration: number;
  game_mode: number;
  lobby_type: number;
  version: number | null;
  kills: number;
  deaths: number;
  assists: number;
  average_rank: number;
  xp_per_min: number;
  gold_per_min: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  last_hits: number;
  lane: number | null;
  lane_role: number | null;
  is_roaming: boolean | null;
  cluster: number;
  leaver_status: number;
  party_size: number | null;
  hero_variant: number;
}

export interface PlayerRankingsRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerRankingsResponse {
  hero_id: number;
  score: number;
  percent_rank: number;
  card: number;
}

export interface PlayerRatingsRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerRatingsResponse {
  account_id: number;
  match_id: number;
  solo_competitive_rank: number;
  competitive_rank: number | null;
  time: string;
}

export interface PlayerWLRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerWLResponse {
  win: number;
  lose: number;
}

export interface PlayerTotalsRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerTotalsResponse {
  field: string;
  n: number;
  sum: number;
}

export interface PlayerCountsRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerCountsResponse {
  leaver_status: { [key: string]: { games: number; win: number } };
  game_mode: { [key: string]: { games: number; win: number } };
  lobby_type: { [key: string]: { games: number; win: number } };
  lane_role: { [key: string]: { games: number; win: number } };
  region: { [key: string]: { games: number; win: number } };
  patch: { [key: string]: { games: number; win: number } };
  is_radiant: { [key: string]: { games: number; win: number } };
}

export interface PlayerHeroesRequest extends ApiRequest {
  // Extends base request
}

export interface PlayerHeroesResponse {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

// ============================================================================
// MATCH API TYPES
// ============================================================================

export interface MatchRequest extends ApiRequest {
  // Extends base request
}

export interface MatchResponse {
  match_id: number;
  start_time: number;
  duration: number;
  radiant_win: boolean;
  players: PlayerMatchPlayer[];
  radiant_name?: string;
  dire_name?: string;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_score?: number;
  dire_score?: number;
  leagueid?: number;
  picks_bans?: Array<{ is_pick: boolean; hero_id: number; team: number; order: number }>;
}

// ============================================================================
// HEROES API TYPES
// ============================================================================

export interface HeroesRequest extends ApiRequest {
  // Extends base request
}

export interface HeroesResponse {
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
// TEAM API TYPES
// ============================================================================

export interface TeamRequest extends ApiRequest {
  // Extends base request
}

export interface TeamResponse {
  team_id: number;
  rating: number;
  wins: number;
  losses: number;
  last_match_time: number;
  name: string;
  tag: string;
  logo_url: string;
  sponsor: string;
  country_code: string;
  url: string;
  players: Array<{
    account_id: number;
    name: string;
    games_played: number;
    wins: number;
  }>;
  matches?: MatchResponse[]; // Include matches if merged
}

// ============================================================================
// LEAGUE API TYPES
// ============================================================================

export interface LeagueRequest extends ApiRequest {
  // Extends base request
}

export interface LeagueResponse {
  league_id: number;
  name: string;
  description?: string;
  tournament_url?: string;
  item_def?: number;
  is_cup: boolean;
  is_qualifier: boolean;
  is_playoff: boolean;
  matches?: MatchResponse[]; // Include matches if available
}

// ============================================================================
// LEGACY TYPES FOR BACKWARD COMPATIBILITY
// ============================================================================

export interface PlayerStatsRequest extends ApiRequest {
  // Legacy type for backward compatibility
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

export interface TeamMatchesRequest extends ApiRequest {
  leagueId?: string;
}

export interface TeamMatchesResponse {
  teamName: string;
  matches: {
    [leagueId: string]: {
      match_id: number;
      start_time: number;
      duration: number;
      radiant_name: string;
      dire_name: string;
      radiant_win: boolean;
      radiant_score: number;
      dire_score: number;
      leagueid: number;
    };
  };
}

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export types that were previously in contexts.ts
export type { PlayerStats } from '../lib/types/data-service';

// ============================================================================
// DOTABUFF API TYPES
// ============================================================================

export interface DotabuffMatchSummary {
  match_id: number;
  start_time: number;
  duration: number;
  radiant_name: string;
  dire_name: string;
  radiant_win: boolean;
  radiant_score: number;
  dire_score: number;
  leagueid: number;
}

export interface DotabuffTeam {
  teamName: string;
  matches: {
    [leagueId: string]: DotabuffMatchSummary;
  };
}

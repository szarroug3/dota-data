/**
 * External API type definitions
 *
 * Contains interfaces and types for OpenDota, Dotabuff, and Dota2ProTracker API responses.
 */

// ============================================================================
// OPENDOTA API TYPES
// ============================================================================

/**
 * OpenDota API base configuration
 */
export interface OpenDotaConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  rateLimit: {
    window: number;
    max: number;
  };
}

/**
 * OpenDota Hero response
 */
export interface OpenDotaHero {
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

/**
 * OpenDota Player response
 */
export interface OpenDotaPlayer {
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

/**
 * OpenDota Player Match response
 */
export interface OpenDotaPlayerMatch {
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

/**
 * OpenDota Player Hero response
 */
export interface OpenDotaPlayerHero {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

/**
 * OpenDota Player Counts response
 */
export interface OpenDotaPlayerCounts {
  leaver_status: number;
  game_mode: number;
  lobby_type: number;
  lane_role: number;
  region: number;
  patch: number;
}

/**
 * OpenDota Player Totals response
 */
export interface OpenDotaPlayerTotals {
  np: number;
  fantasy: number;
  cosmetic: number;
  all_time: number;
  ranked: number;
  turbo: number;
  matched: number;
}

/**
 * OpenDota Player Win/Loss response
 */
export interface OpenDotaPlayerWL {
  win: number;
  lose: number;
}

/**
 * OpenDota Player Recent Matches response
 */
export interface OpenDotaPlayerRecentMatches {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  version: number | null;
  kills: number;
  deaths: number;
  assists: number;
  skill: number | null;
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
}

/**
 * OpenDota Match Player response
 */
export interface OpenDotaMatchPlayer {
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

/**
 * OpenDota Match response
 */
export interface OpenDotaMatch {
  match_id: number;
  start_time: number;
  duration: number;
  radiant_win: boolean;
  players: OpenDotaMatchPlayer[];
  radiant_name?: string;
  dire_name?: string;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_score?: number;
  dire_score?: number;
  leagueid?: number;
  picks_bans?: Array<{
    is_pick: boolean;
    hero_id: number;
    team: number;
    order: number;
  }>;
}

/**
 * OpenDota Team response
 */
export interface OpenDotaTeam {
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
}

/**
 * OpenDota League response
 */
export interface OpenDotaLeague {
  league_id: number;
  name: string;
  description?: string;
  tournament_url?: string;
  item_def?: number;
  is_cup: boolean;
  is_qualifier: boolean;
  is_playoff: boolean;
}

// ============================================================================
// DOTABUFF API TYPES
// ============================================================================

/**
 * Dotabuff API base configuration
 */
export interface DotabuffConfig {
  baseUrl: string;
  requestDelay: number;
  rateLimit: {
    window: number;
    max: number;
  };
}

/**
 * Dotabuff Team response
 */
export interface DotabuffTeam {
  teamName: string;
  matches: {
    [leagueId: string]: DotabuffMatchSummary;
  };
}

/**
 * Dotabuff Match Summary
 */
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

/**
 * Dotabuff League response
 */
export interface DotabuffLeague {
  league_id: number;
  name: string;
  description?: string;
  tournament_url?: string;
  matches?: DotabuffMatchSummary[];
}

/**
 * Dotabuff Hero Meta response
 */
export interface DotabuffHeroMeta {
  hero_id: number;
  name: string;
  pick_rate: number;
  win_rate: number;
  ban_rate: number;
  position: string;
  tier: string;
}

// ============================================================================
// DOTA2PROTRACKER API TYPES
// ============================================================================

/**
 * Dota2ProTracker API base configuration
 */
export interface D2PTConfig {
  baseUrl: string;
  requestDelay: number;
  rateLimit: {
    window: number;
    max: number;
  };
}

/**
 * D2PT Hero Meta response
 */
export interface D2PTHeroMeta {
  hero_id: number;
  name: string;
  pick_rate: number;
  win_rate: number;
  ban_rate: number;
  position: string;
  tier: string;
  meta_score: number;
}

/**
 * D2PT Player response
 */
export interface D2PTPlayer {
  account_id: number;
  name: string;
  rank: string;
  mmr: number;
  recent_matches: D2PTPlayerMatch[];
}

/**
 * D2PT Player Match
 */
export interface D2PTPlayerMatch {
  match_id: number;
  hero_id: number;
  result: 'win' | 'loss';
  duration: number;
  start_time: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
}

// ============================================================================
// STRATZ API TYPES
// ============================================================================

/**
 * Stratz API base configuration
 */
export interface StratzConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  rateLimit: {
    window: number;
    max: number;
  };
}

/**
 * Stratz Hero response
 */
export interface StratzHero {
  id: number;
  name: string;
  localizedName: string;
  primaryAttr: string;
  attackType: string;
  roles: string[];
  img: string;
  icon: string;
  baseHealth: number;
  baseMana: number;
  baseArmor: number;
  baseAttackMin: number;
  baseAttackMax: number;
  moveSpeed: number;
  baseAttackTime: number;
  attackPoint: number;
  attackRange: number;
  projectileSpeed: number;
  turnRate: number;
  cmEnabled: boolean;
  legs: number;
  dayVision: number;
  nightVision: number;
}

// ============================================================================
// EXTERNAL API ERROR TYPES
// ============================================================================

/**
 * External API error types
 */
export type ExternalApiErrorType = 
  | 'rate_limited'
  | 'not_found'
  | 'timeout'
  | 'connection_failed'
  | 'invalid_response'
  | 'service_unavailable'
  | 'network_error';

/**
 * External API error interface
 */
export interface ExternalApiError extends Error {
  type: ExternalApiErrorType;
  service: 'opendota' | 'dotabuff' | 'd2pt' | 'stratz';
  statusCode?: number;
  retryAfter?: number;
  retryable: boolean;
}

// ============================================================================
// EXTERNAL API UTILITY TYPES
// ============================================================================

/**
 * External API service enumeration
 */
export type ExternalApiService = 'opendota' | 'dotabuff' | 'd2pt' | 'stratz';

/**
 * External API configuration union
 */
export type ExternalApiConfigUnion = 
  | OpenDotaConfig
  | DotabuffConfig
  | D2PTConfig
  | StratzConfig;

/**
 * External API response union
 */
export type ExternalApiResponseUnion = 
  | OpenDotaHero
  | OpenDotaPlayer
  | OpenDotaPlayerMatch
  | OpenDotaPlayerHero
  | OpenDotaPlayerCounts
  | OpenDotaPlayerTotals
  | OpenDotaPlayerWL
  | OpenDotaPlayerRecentMatches
  | OpenDotaMatch
  | OpenDotaTeam
  | OpenDotaLeague
  | DotabuffTeam
  | DotabuffLeague
  | DotabuffHeroMeta
  | D2PTHeroMeta
  | D2PTPlayer
  | StratzHero;

/**
 * External API request options
 */
export interface ExternalApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  force?: boolean;
}

/**
 * External API response wrapper
 */
export interface ExternalApiResponseWrapper<T> {
  data: T;
  service: ExternalApiService;
  cached: boolean;
  timestamp: string;
  responseTime: number;
} 
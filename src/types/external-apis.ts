/**
 * External API type definitions
 *
 * Contains interfaces and types for OpenDota, Dotabuff, and Dota2ProTracker API responses.
 */

// ============================================================================
// OPENDOTA API TYPES
// ============================================================================

/**
 * OpenDota Hero response (matches real-data/heroes/heroes.json)
 */
export interface OpenDotaHero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  legs: number;
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
  leaver_status: Record<string, { games: number; win: number }>;
  game_mode: Record<string, { games: number; win: number }>;
  lobby_type: Record<string, { games: number; win: number }>;
  lane_role: Record<string, { games: number; win: number }>;
  region: Record<string, { games: number; win: number }>;
  patch: Record<string, { games: number; win: number }>;
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
 * OpenDota Player Rankings response
 */
export interface OpenDotaPlayerRanking {
  hero_id: number;
  score: number;
  percent_rank: number;
  card: number;
}

/**
 * OpenDota Player Ratings response
 */
export interface OpenDotaPlayerRating {
  account_id: number;
  match_id: number;
  solo_competitive_rank: number | null;
  competitive_rank: number | null;
  time: string;
}

/**
 * OpenDota Player Ward Map response
 */
export interface OpenDotaPlayerWardMap {
  obs: Record<string, Record<string, number>>;
  sen: Record<string, Record<string, number>>;
}

/**
 * Comprehensive OpenDota Player data containing all player information
 */
export interface OpenDotaPlayerComprehensive {
  profile: OpenDotaPlayer;
  counts: OpenDotaPlayerCounts;
  heroes: OpenDotaPlayerHero[];
  rankings: OpenDotaPlayerRanking[];
  ratings: OpenDotaPlayerRating[];
  recentMatches: OpenDotaPlayerRecentMatches[];
  totals: OpenDotaPlayerTotals;
  wl: OpenDotaPlayerWL;
  wardMap: OpenDotaPlayerWardMap;
}

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
  tower_damage: number;
  hero_healing: number;
  isRadiant: boolean;
  win: number;
  lose: number;
  total_gold: number;
  total_xp: number;
  kills_per_min: number;
  kda: number;
  abandons: number;
  // Optional fields
  party_id?: number;
  permanent_buffs?: Array<{
    permanent_buff: number;
    stack_count: number;
    grant_time: number;
  }>;
  party_size?: number;
  team_number?: number;
  team_slot?: number;
  hero_variant?: number;
  net_worth?: number;
  aghanims_scepter?: number;
  aghanims_shard?: number;
  moonshard?: number;
  ability_upgrades_arr?: number[];
  personaname?: string;
  name?: string | null;
  last_login?: string;
  rank_tier?: number;
  is_subscriber?: boolean;
  radiant_win?: boolean;
  start_time?: number;
  duration?: number;
  cluster?: number;
  lobby_type?: number;
  game_mode?: number;
  is_contributor?: boolean;
  patch?: number;
  region?: number;
  neutral_kills?: number;
  tower_kills?: number;
  courier_kills?: number;
  lane_kills?: number;
  hero_kills?: number;
  observer_kills?: number;
  sentry_kills?: number;
  roshan_kills?: number;
  necronomicon_kills?: number;
  ancient_kills?: number;
  buyback_count?: number;
  observer_uses?: number;
  sentry_uses?: number;
  lane_efficiency_pct?: number;
  lane?: number;
  lane_role?: number;
  is_roaming?: boolean;
  purchase_time?: Record<string, number>;
  first_purchase_time?: Record<string, number>;
  item_win?: Record<string, number>;
  item_usage?: Record<string, number>;
  purchase_tpscroll?: number;
  actions_per_min?: number;
  life_state_dead?: number;
  scaled_hero_damage?: number;
  scaled_tower_damage?: number;
  scaled_hero_healing?: number;
  cosmetics?: number[];
  benchmarks?: Record<string, {
    raw: number;
    pct: number;
  }>;
}

export interface OpenDotaMatch {
  match_id: number;
  start_time: number;
  duration: number;
  radiant_win: boolean;
  players: OpenDotaMatchPlayer[];
  // Optional fields
  version?: number;
  radiant_name?: string;
  dire_name?: string;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_score?: number;
  dire_score?: number;
  leagueid?: number;
  lobby_type?: number;
  game_mode?: number;
  cluster?: number;
  patch?: number;
  region?: number;
  picks_bans?: Array<{
    is_pick: boolean;
    hero_id: number;
    team: number;
    order: number;
  }>;
  draft_timings?: Array<{
    order: number;
    pick: boolean;
    active_team: number;
    hero_id: number;
    player_slot: number | null;
    extra_time: number;
    total_time_taken: number;
  }>;
  teamfights?: Array<{
    start: number;
    end: number;
    last_death: number;
    deaths: number;
    players: Array<{
      deaths_pos: Record<string, Record<string, number>>;
      ability_uses: Record<string, number>;
      ability_targets: Record<string, Record<string, number>>;
      item_uses: Record<string, number>;
      killed: Record<string, number>;
      deaths: number;
      buybacks: number;
      damage: number;
      healing: number;
      gold_delta: number;
      xp_delta: number;
      xp_start: number;
      xp_end: number;
    }>;
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
 * Dotabuff Team response
 */
export interface DotabuffTeam {
  name: string;
  id: string;
  matches: DotabuffMatchSummary[];
}

/**
 * Dotabuff Match Summary
 */
export interface DotabuffMatchSummary {
  matchId: string;
  result: 'won' | 'lost';
  duration: number;
  opponentName: string;
  leagueId: string;
  startTime: number;
}

/**
 * Dotabuff League response
 */
export interface DotabuffLeague {
  id: string;
  name: string;
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
  service: 'opendota' | 'dotabuff';
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
export type ExternalApiService = 'opendota' | 'dotabuff';

/**
 * External API configuration union
 */


/**
 * External API response union
 */


 
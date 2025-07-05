// OpenDota API types shared across the codebase

export interface OpenDotaPlayer {
  account_id: number;
  personaname: string;
  name: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  last_login: string;
  loccountrycode: string;
  is_contributor: boolean;
  is_subscriber: boolean;
  rank_tier: number;
  leaderboard_rank: number;
  solo_competitive_rank: number;
  competitive_rank: number;
  mmr_estimate: {
    estimate: number;
    stdDev: number;
    n: number;
  };
  // Additional properties used in services
  total_matches?: number;
  win?: number;
  kda?: number;
  gpm?: number;
  xpm?: number;
  avg_seconds_per_match?: number;
}

export interface OpenDotaMatch {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  version: number;
  kills: number;
  deaths: number;
  assists: number;
  skill: number;
  leaver_status: number;
  party_size: number;
  cluster: number;
  patch: number;
  region: number;
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
  lane_efficiency: number;
  lane_efficiency_pct: number;
  lane: number;
  lane_role: number;
  is_roaming: boolean;
  purchase_time: { [key: string]: number };
  first_purchase_time: { [key: string]: number };
  item_win: { [key: string]: number };
  item_usage: { [key: string]: number };
  purchase_tpscroll: { [key: string]: number };
  actions_per_min: number;
  life_state_dead: number;
  rank_tier: number;
  cosmetics: number[];
  benchmarks: { [key: string]: number };
  // Additional properties used in services
  hero_name?: string;
}

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

export interface OpenDotaPlayerHeroes {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

export interface OpenDotaPlayerWL {
  win: number;
  lose: number;
}

export interface OpenDotaPlayerTotals {
  field: string;
  n: number;
  sum: number;
}

export interface OpenDotaPlayerCounts {
  field: string;
  n: number;
  count: number;
}

export interface OpenDotaPlayerRecentMatches {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  version: number;
  kills: number;
  deaths: number;
  assists: number;
  skill: number;
  leaver_status: number;
  party_size: number;
  cluster: number;
  patch: number;
  region: number;
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
  lane_efficiency: number;
  lane_efficiency_pct: number;
  lane: number;
  lane_role: number;
  is_roaming: boolean;
  purchase_time: { [key: string]: number };
  first_purchase_time: { [key: string]: number };
  item_win: { [key: string]: number };
  item_usage: { [key: string]: number };
  purchase_tpscroll: { [key: string]: number };
  actions_per_min: number;
  life_state_dead: number;
  rank_tier: number;
  cosmetics: number[];
  benchmarks: { [key: string]: number };
}

// A full OpenDota match response, as returned by /matches/{match_id}
export interface OpenDotaFullMatch extends OpenDotaMatch {
  radiant_name?: string;
  dire_name?: string;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_score?: number;
  dire_score?: number;
  leagueid?: number;
  players: Array<OpenDotaPlayer & { player_slot: number; isRadiant?: boolean; [key: string]: unknown }>;
  picks_bans?: Array<{ is_pick: boolean; hero_id: number; team: number; order: number }>;
  [key: string]: unknown;
} 
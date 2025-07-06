// OpenDota API types shared across the codebase

export interface OpenDotaPlayerProfile {
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
}

export interface OpenDotaPlayer {
  profile: OpenDotaPlayerProfile;
  rank_tier: number;
  leaderboard_rank: number;
  // Additional properties used in services
  total_matches?: number;
  win?: number;
  kda?: number;
  gpm?: number;
  xpm?: number;
  avg_seconds_per_match?: number;
}

export interface OpenDotaMatchPlayer {
  account_id: number;
  player_slot: number;
  party_id: number;
  permanent_buffs: Array<{
    permanent_buff: number;
    stack_count: number;
    grant_time: number;
  }>;
  party_size: number;
  team_number: number;
  team_slot: number;
  hero_id: number;
  hero_variant: number;
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
  net_worth: number;
  aghanims_scepter: number;
  aghanims_shard: number;
  moonshard: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  gold: number;
  gold_spent: number;
  ability_upgrades_arr: number[];
  personaname: string;
  name: string;
  last_login: string;
  rank_tier: number;
  is_subscriber: boolean;
  radiant_win: boolean;
  start_time: number;
  duration: number;
  cluster: number;
  lobby_type: number;
  game_mode: number;
  is_contributor: boolean;
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
  benchmarks: {
    [key: string]: {
      raw: number;
      pct: number;
    };
  };
}

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
  picks_bans?: Array<{ is_pick: boolean; hero_id: number; team: number; order: number }>;
}

// Alias for backward compatibility
export type OpenDotaFullMatch = OpenDotaMatch;

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

export interface OpenDotaItem {
  id: number;
  name: string;
  dname: string;
  qual: string;
  cost: number;
  notes: string;
  attrib: Array<{
    key: string;
    value: string | number;
    display?: string;
  }>;
  mc: boolean | number;
  cd: boolean | number;
  lore: string;
  components: string[] | null;
  created: boolean;
  charges: boolean | number;
  img?: string;
  behavior?: string | string[];
  target_team?: string;
  target_type?: string | string[];
  dispellable?: string;
  abilities?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  hint?: string[];
}

export interface OpenDotaItems {
  [itemName: string]: OpenDotaItem;
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
  leaver_status: { [key: string]: { games: number; win: number } };
  game_mode: { [key: string]: { games: number; win: number } };
  lobby_type: { [key: string]: { games: number; win: number } };
  lane_role: { [key: string]: { games: number; win: number } };
  region: { [key: string]: { games: number; win: number } };
  patch: { [key: string]: { games: number; win: number } };
  is_radiant: { [key: string]: { games: number; win: number } };
}

export interface OpenDotaPlayerRankings {
  hero_id: number;
  score: number;
  percent_rank: number;
  card: number;
}

export interface OpenDotaPlayerRatings {
  account_id: number;
  match_id: number;
  solo_competitive_rank: number;
  competitive_rank: number | null;
  time: string;
}

export interface OpenDotaPlayerRecentMatch {
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
  // Add any other summary fields you scrape
}

export interface DotabuffTeam {
  teamName: string;
  matches: {
    [leagueId: string]: DotabuffMatchSummary;
  };
} 
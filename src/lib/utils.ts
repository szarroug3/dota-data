import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OpenDotaFullMatch } from '../types/opendota';
import type { Team } from '../types/team';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fallback hero map for when API is not available
export const heroMap: { [key: number]: string } = {
  1: "Anti-Mage",
  2: "Axe",
  3: "Bane",
  4: "Bloodseeker",
  5: "Crystal Maiden",
  6: "Drow Ranger",
  7: "Earthshaker",
  8: "Juggernaut",
  9: "Mirana",
  10: "Morphling",
  11: "Shadow Fiend",
  12: "Phantom Lancer",
  13: "Puck",
  14: "Pudge",
  15: "Razor",
  16: "Sand King",
  17: "Storm Spirit",
  18: "Sven",
  19: "Tiny",
  20: "Vengeful Spirit",
  21: "Windranger",
  22: "Zeus",
  23: "Kunkka",
  25: "Lina",
  26: "Lion",
  27: "Shadow Shaman",
  28: "Slardar",
  29: "Tidehunter",
  30: "Witch Doctor",
  31: "Lich",
  32: "Riki",
  33: "Enigma",
  34: "Tinker",
  35: "Sniper",
  36: "Necrophos",
  37: "Warlock",
  38: "Beastmaster",
  39: "Queen of Pain",
  40: "Venomancer",
  41: "Faceless Void",
  42: "Wraith King",
  43: "Death Prophet",
  44: "Phantom Assassin",
  45: "Pugna",
  46: "Templar Assassin",
  47: "Viper",
  48: "Luna",
  49: "Dragon Knight",
  50: "Dazzle",
  51: "Clockwerk",
  52: "Leshrac",
  53: "Nature's Prophet",
  54: "Lifestealer",
  55: "Dark Seer",
  56: "Clinkz",
  57: "Omniknight",
  58: "Enchantress",
  59: "Huskar",
  60: "Night Stalker",
  61: "Broodmother",
  62: "Bounty Hunter",
  63: "Weaver",
  64: "Jakiro",
  65: "Batrider",
  66: "Chen",
  67: "Spectre",
  68: "Ancient Apparition",
  69: "Doom",
  70: "Ursa",
  71: "Spirit Breaker",
  72: "Gyrocopter",
  73: "Alchemist",
  74: "Invoker",
  75: "Silencer",
  76: "Outworld Destroyer",
  77: "Lycan",
  78: "Brewmaster",
  79: "Shadow Demon",
  80: "Lone Druid",
  81: "Chaos Knight",
  82: "Meepo",
  83: "Treant Protector",
  84: "Ogre Magi",
  85: "Undying",
  86: "Rubick",
  87: "Disruptor",
  88: "Nyx Assassin",
  89: "Naga Siren",
  90: "Keeper of the Light",
  91: "Io",
  92: "Visage",
  93: "Slark",
  94: "Medusa",
  95: "Troll Warlord",
  96: "Centaur Warrunner",
  97: "Magnus",
  98: "Timbersaw",
  99: "Bristleback",
  100: "Tusk",
  101: "Skywrath Mage",
  102: "Abaddon",
  103: "Elder Titan",
  104: "Legion Commander",
  105: "Techies",
  106: "Ember Spirit",
  107: "Earth Spirit",
  108: "Underlord",
  109: "Terrorblade",
  110: "Phoenix",
  111: "Oracle",
  112: "Winter Wyvern",
  113: "Arc Warden",
  114: "Monkey King",
  119: "Dark Willow",
  120: "Pangolier",
  121: "Grimstroke",
  123: "Hoodwink",
  126: "Void Spirit",
  128: "Snapfire",
  129: "Mars",
  135: "Dawnbreaker",
  136: "Marci",
  137: "Primal Beast",
  138: "Muerta",
  139: "Muerta",
  140: "Muerta",
  141: "Muerta",
  142: "Muerta",
};

// Cache for hero data from API
let heroDataCache: {
  byId: Record<number, string>;
  byName: Record<string, string>;
} | null = null;
let heroDataCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getHeroName(heroId: number): Promise<string> {
  try {
    if (heroDataCache && Date.now() - heroDataCacheTime < CACHE_DURATION) {
      return heroDataCache.byId[heroId] || `Hero ${heroId}`;
    }
    const response = await fetch("/api/heroes", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (response.ok) {
      const data = await response.json();
      heroDataCache = { byId: data.byId, byName: data.byName };
      heroDataCacheTime = Date.now();
      return heroDataCache.byId[heroId] || `Hero ${heroId}`;
    }
  } catch {
    // fallback to hardcoded map
  }
  return heroMap[heroId] || `Hero ${heroId}`;
}

export function getHeroNameSync(heroId: number): string {
  if (heroDataCache) {
    return heroDataCache.byId[heroId] || `Hero ${heroId}`;
  }
  // Try to load from the new heroes.json data
  try {
    // Use dynamic import to avoid forbidden require
    // Note: This will only work in environments that support dynamic import
    // and may need to be async in some cases
    // For now, fallback to hardcoded map
    return heroMap[heroId] || `Hero ${heroId}`;
  } catch {
    return heroMap[heroId] || `Hero ${heroId}`;
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Hero internal name mapping for images
export const heroInternalNameMap: Record<string, string> = {
  Invoker: "invoker",
  "Crystal Maiden": "crystal_maiden",
  Juggernaut: "juggernaut",
  "Phantom Assassin": "phantom_assassin",
  Tidehunter: "tidehunter",
  "Wraith King": "skeleton_king",
  "Nature's Prophet": "furion",
  Doom: "doom_bringer",
  Clockwerk: "rattletrap",
  Lifestealer: "life_stealer",
  Io: "wisp",
  Magnus: "magnataur",
  "Naga Siren": "naga_siren",
  Timbersaw: "shredder",
  "Centaur Warrunner": "centaur",
  "Treant Protector": "treant",
  "Vengeful Spirit": "vengefulspirit",
  Windranger: "windrunner",
  Zeus: "zuus",
  "Anti-Mage": "antimage",
  Axe: "axe",
  Bane: "bane",
  Bloodseeker: "bloodseeker",
  "Drow Ranger": "drow_ranger",
  Earthshaker: "earthshaker",
  Mirana: "mirana",
  Morphling: "morphling",
  "Shadow Fiend": "nevermore",
  "Phantom Lancer": "phantom_lancer",
  Puck: "puck",
  Pudge: "pudge",
  Razor: "razor",
  "Sand King": "sand_king",
  "Storm Spirit": "storm_spirit",
  Sven: "sven",
  Tiny: "tiny",
  Lina: "lina",
  Lion: "lion",
  "Shadow Shaman": "shadow_shaman",
  Slardar: "slardar",
  "Witch Doctor": "witch_doctor",
  Lich: "lich",
  Riki: "riki",
  Enigma: "enigma",
  Tinker: "tinker",
  Sniper: "sniper",
  Necrophos: "necrolyte",
  Warlock: "warlock",
  Beastmaster: "beastmaster",
  "Queen of Pain": "queenofpain",
  Venomancer: "venomancer",
  "Faceless Void": "faceless_void",
  "Death Prophet": "death_prophet",
  Pugna: "pugna",
  "Templar Assassin": "templar_assassin",
  Viper: "viper",
  Luna: "luna",
  "Dragon Knight": "dragon_knight",
  Dazzle: "dazzle",
  Leshrac: "leshrac",
  "Dark Seer": "dark_seer",
  Clinkz: "clinkz",
  Omniknight: "omniknight",
  Enchantress: "enchantress",
  Huskar: "huskar",
  "Night Stalker": "night_stalker",
  Broodmother: "broodmother",
  "Bounty Hunter": "bounty_hunter",
  Weaver: "weaver",
  Jakiro: "jakiro",
  Batrider: "batrider",
  Chen: "chen",
  Spectre: "spectre",
  "Ancient Apparition": "ancient_apparition",
  Ursa: "ursa",
  "Spirit Breaker": "spirit_breaker",
  Gyrocopter: "gyrocopter",
  Alchemist: "alchemist",
  Silencer: "silencer",
  "Outworld Destroyer": "obsidian_destroyer",
  Lycan: "lycan",
  Brewmaster: "brewmaster",
  "Shadow Demon": "shadow_demon",
  "Lone Druid": "lone_druid",
  "Chaos Knight": "chaos_knight",
  Meepo: "meepo",
  "Ogre Magi": "ogre_magi",
  Undying: "undying",
  Rubick: "rubick",
  Disruptor: "disruptor",
  "Keeper of the Light": "keeper_of_the_light",
  Visage: "visage",
  Slark: "slark",
  Medusa: "medusa",
  "Troll Warlord": "troll_warlord",
  Tusk: "tusk",
  "Skywrath Mage": "skywrath_mage",
  Abaddon: "abaddon",
  "Elder Titan": "elder_titan",
  "Legion Commander": "legion_commander",
  Techies: "techies",
  "Ember Spirit": "ember_spirit",
  "Earth Spirit": "earth_spirit",
  Underlord: "abyssal_underlord",
  Terrorblade: "terrorblade",
  Phoenix: "phoenix",
  Oracle: "oracle",
  "Winter Wyvern": "winter_wyvern",
  "Arc Warden": "arc_warden",
  "Monkey King": "monkey_king",
  "Dark Willow": "dark_willow",
  Pangolier: "pangolier",
  Grimstroke: "grimstroke",
  Hoodwink: "hoodwink",
  "Void Spirit": "void_spirit",
  Snapfire: "snapfire",
  Mars: "mars",
  Dawnbreaker: "dawnbreaker",
  Marci: "marci",
  "Primal Beast": "primal_beast",
  Muerta: "muerta",
};

export function getHeroImageUrl(heroName: string): string {
  // Convert hero name to Dotabuff format: lowercase, hyphens, remove apostrophes and special chars
  const heroSlug = heroName
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return `https://www.dotabuff.com/assets/heroes/${heroSlug}.jpg`;
}

// Types for OpenDota player and match
interface OpenDotaPlayerLite {
  name?: string;
  isRadiant?: boolean;
  player_slot?: number;
}
interface MatchWithOpenDota {
  openDota?: OpenDotaFullMatch;
  opponent?: string;
  result?: string;
  score?: string;
}

function getTeamPlayersLower(team: Team): string[] {
  return (team.players || []).map((p) => p.name?.toLowerCase() || "").filter(Boolean);
}
function getMatchPlayersLower(players: OpenDotaPlayerLite[], isRadiant: boolean): string[] {
  return players.filter((p) => (isRadiant ? p.isRadiant : !p.isRadiant)).map((p) => p.name?.toLowerCase() || "").filter(Boolean);
}

function isTeamNameMatch(openDota: OpenDotaFullMatch, team: Team): "Radiant" | "Dire" | undefined {
  const radiantName = openDota.radiant_name?.toLowerCase() || "";
  const direName = openDota.dire_name?.toLowerCase() || "";
  const teamName = getTeamNameForMatch(team);
  if (isRadiantTeam(radiantName, teamName)) return "Radiant";
  if (isDireTeam(direName, teamName)) return "Dire";
  return undefined;
}
function getTeamNameForMatch(team: Team): string {
  return team?.teamName?.toLowerCase() || team?.id?.toLowerCase() || "";
}
function isRadiantTeam(radiantName: string, teamName: string): boolean {
  return !!radiantName && teamName === radiantName;
}
function isDireTeam(direName: string, teamName: string): boolean {
  return !!direName && teamName === direName;
}
function getPlayerOverlapSide(openDota: OpenDotaFullMatch, team: Team): "Radiant" | "Dire" | undefined {
  if (!Array.isArray(openDota.players) || !Array.isArray(team?.players)) return undefined;
  const teamPlayers = getTeamPlayersLower(team);
  const radiantPlayers = getMatchPlayersLower(openDota.players, true);
  const direPlayers = getMatchPlayersLower(openDota.players, false);
  const radiantOverlap = radiantPlayers.filter((n) => teamPlayers.includes(n)).length;
  const direOverlap = direPlayers.filter((n) => teamPlayers.includes(n)).length;
  if (radiantOverlap > direOverlap) return "Radiant";
  if (direOverlap > radiantOverlap) return "Dire";
  return undefined;
}
export function getTeamSide(match: MatchWithOpenDota, currentTeam: Team): "Radiant" | "Dire" | "Unknown" {
  const openDota = match.openDota;
  if (!openDota) return "Unknown";
  return (
    isTeamNameMatch(openDota, currentTeam) ||
    getPlayerOverlapSide(openDota, currentTeam) ||
    "Unknown"
  );
}
function getOpponentNameBySide(openDota: OpenDotaFullMatch, team: Team): string | undefined {
  const side = isTeamNameMatch(openDota, team) || getPlayerOverlapSide(openDota, team);
  if (side === "Radiant") return openDota.dire_name || "Unknown Opponent";
  if (side === "Dire") return openDota.radiant_name || "Unknown Opponent";
  return undefined;
}
export function getOpponentName(match: MatchWithOpenDota, currentTeam: Team): string {
  const invalidOpponents = [
    "bo3", "bo5", "bo7", "bo1", "bo2", "bo4", "bo6", "bo8", "bo9",
  ];
  const existingOpponent = match.opponent?.toLowerCase();
  const isValidOpponent =
    existingOpponent &&
    !invalidOpponents.includes(existingOpponent) &&
    existingOpponent !== "unknown opponent";
  if (isValidOpponent) return match.opponent!;
  const openDota = match.openDota;
  if (openDota) {
    const bySide = getOpponentNameBySide(openDota, currentTeam);
    if (bySide) return bySide;
  }
  return "Unknown Opponent";
}

// Helper to format date
export function formatDate(dateString: string) {
  if (!dateString) return "Unknown Date";

  try {
    // Handle ISO date strings
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }

    // Handle Unix timestamp
    if (/^\d{10,13}$/.test(dateString)) {
      const timestamp = parseInt(dateString);
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString();
    }

    // Handle other date formats
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
}

// Utility function to extract league name from Dotabuff league URL
export function getLeagueNameFromUrl(url: string): string {
  if (!url) return "";
  const match = url.match(/leagues\/\d+-([a-z0-9-]+)/i);
  if (match && match[1]) {
    return match[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return url;
}

// Helper to get rank information
export function getRankInfo(rank: number) {
  const rankTiers = [
    "Herald",
    "Guardian",
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];
  const tier = Math.floor((rank - 1) / 5);
  const stars = rank % 5 || 5;
  const color =
    tier >= 6
      ? "text-yellow-500"
      : tier >= 4
        ? "text-purple-500"
        : "text-blue-500";
  return { rank: rankTiers[tier], stars, color };
}

// Helper to get rank tier info
export function getRankTierInfo(rankTier: number) {
  const rankTiers = [
    "Herald",
    "Guardian", 
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];
  const tier = Math.floor((rankTier - 1) / 5);
  const stars = rankTier % 5 || 5;
  const rank = rankTiers[tier] || "Unknown";
  
  return { rank, stars };
}

// Use only a frontend-safe logger:
export function logWithTimestamp(level: 'log' | 'warn' | 'error', ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  if (level === 'log') {
    console.log(`[${timestamp}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${timestamp}]`, ...args);
  } else if (level === 'error') {
    console.error(`[${timestamp}]`, ...args);
  }
}

export function getMatchResult(match: OpenDotaFullMatch & { result?: string; openDota?: OpenDotaFullMatch; score?: string }, currentTeam?: Team): string {
  if (match.result === 'W') return 'Win';
  if (match.result === 'L') return 'Loss';
  if (match.openDota && currentTeam) {
    const teamSide = getTeamSide(match, currentTeam);
    if (teamSide === 'Radiant') {
      return match.openDota.radiant_win ? 'Win' : 'Loss';
    } else if (teamSide === 'Dire') {
      return !match.openDota.radiant_win ? 'Win' : 'Loss';
    }
  }
  return '';
}

export function getScoreWithResult(match: OpenDotaFullMatch & { result?: string; openDota?: OpenDotaFullMatch; score?: string }, currentTeam?: Team): string {
  if (!match.score) return getMatchResult(match, currentTeam);
  return `${match.score} (${getMatchResult(match, currentTeam)})`;
}

// Dashboard-specific utility functions that work with Match from match-utils.ts
import type { Match as DashboardMatch } from '@/app/dashboard/match-history/match-utils';

export function getDashboardMatchResult(match: DashboardMatch, currentTeam?: Team): string {
  if (match.result === 'W') return 'W';
  if (match.result === 'L') return 'L';
  if (match.openDota && currentTeam) {
    const teamSide = getTeamSide(match, currentTeam);
    if (teamSide === 'Radiant') {
      return match.openDota.radiant_win ? 'W' : 'L';
    } else if (teamSide === 'Dire') {
      return !match.openDota.radiant_win ? 'W' : 'L';
    }
  }
  return '';
}

export function getDashboardScoreWithResult(match: DashboardMatch, currentTeam?: Team): string {
  const result = getDashboardMatchResult(match, currentTeam);
  if (match.openDota?.radiant_score !== undefined && match.openDota?.dire_score !== undefined) {
    return `${match.openDota.radiant_score}-${match.openDota.dire_score} (${result})`;
  }
  return result;
}

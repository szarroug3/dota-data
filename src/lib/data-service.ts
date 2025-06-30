// Data service layer for transforming OpenDota data into app format

import {
    calculateKDA,
    calculateWinRate,
    formatDuration,
    getPlayerData,
    getPlayerHeroes,
    getPlayerMatches,
    getPlayerRecentMatches,
    getPlayerWL,
    getRankTierInfo,
    type OpenDotaMatch
} from "./api";
import { logWithTimestamp } from './utils';

export interface PlayerStats {
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

export interface MatchHistory {
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    avgGameLength: string;
    longestWinStreak: number;
    currentStreak: number;
  };
  matches: Array<{
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
    draftOrder: any[];
    highlights: string[];
    playerStats: Record<string, any>;
    games: Array<{
      picks: string[];
      bans: string[];
      opponentPicks: string[];
      opponentBans: string[];
      draftOrder: any[];
      highlights: string[];
      playerStats: Record<string, any>;
      duration: string;
      score: string;
    }>;
  }>;
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
}

export interface DraftSuggestions {
  teamStrengths: {
    carry: string;
    mid: string;
    support: string;
    offlane: string;
  };
  teamWeaknesses: string[];
  phaseRecommendations: {
    first: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
    second: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
    third: {
      title: string;
      description: string;
      heroes: Array<{
        name: string;
        role: string;
        reason: string;
        synergy: string[];
        counters: string[];
        pickPriority: string;
        winRate: number;
        games: number;
      }>;
    };
  };
  metaCounters: Array<{
    hero: string;
    counter: string;
    reason: string;
    effectiveness: string;
  }>;
  recentDrafts: Array<{
    date: string;
    opponent: string;
    result: string;
    picks: string[];
    bans: string[];
    notes: string;
  }>;
}

export interface TeamAnalysis {
  overallStats: {
    totalMatches: number;
    winRate: number;
    avgGameLength: string;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
  };
  rolePerformance: {
    carry: { winRate: number; avgKDA: number; avgGPM: number };
    mid: { winRate: number; avgKDA: number; avgGPM: number };
    offlane: { winRate: number; avgKDA: number; avgGPM: number };
    support: { winRate: number; avgKDA: number; avgGPM: number };
  };
  gamePhaseStats: {
    earlyGame: { winRate: number; avgDuration: string };
    midGame: { winRate: number; avgDuration: string };
    lateGame: { winRate: number; avgDuration: string };
  };
  heroPool: {
    mostPicked: Array<{ hero: string; games: number; winRate: number }>;
    bestWinRate: Array<{ hero: string; games: number; winRate: number }>;
    mostBanned: Array<{ hero: string; bans: number; banRate: number }>;
  };
  trends: Array<{
    metric: string;
    value: number | string;
    trend: string;
    direction: "up" | "down" | "neutral";
  }>;
}

export interface MetaInsights {
  currentMeta: {
    description: string;
    keyHeroes: Array<{
      hero: string;
      pickRate: number;
      winRate: number;
      banRate: number;
    }>;
    strategies: string[];
  };
  metaTrends: Array<{
    title: string;
    description: string;
    impact: string;
    trend: "up" | "down" | "neutral";
    details: string;
  }>;
  roleStats: {
    carry: { avgGPM: number; avgKDA: string; winRate: number };
    mid: { avgGPM: number; avgKDA: string; winRate: number };
    offlane: { avgGPM: number; avgKDA: string; winRate: number };
    support: { avgGPM: number; avgKDA: string; winRate: number };
  };
}

// Hero name mapping for OpenDota to display names - keeping as fallback
const heroNameMap: Record<string, string> = {
  npc_dota_hero_antimage: "Anti-Mage",
  npc_dota_hero_axe: "Axe",
  npc_dota_hero_bane: "Bane",
  npc_dota_hero_bloodseeker: "Bloodseeker",
  npc_dota_hero_crystal_maiden: "Crystal Maiden",
  npc_dota_hero_drow_ranger: "Drow Ranger",
  npc_dota_hero_earthshaker: "Earthshaker",
  npc_dota_hero_juggernaut: "Juggernaut",
  npc_dota_hero_mirana: "Mirana",
  npc_dota_hero_morphling: "Morphling",
  npc_dota_hero_nevermore: "Shadow Fiend",
  npc_dota_hero_phantom_lancer: "Phantom Lancer",
  npc_dota_hero_puck: "Puck",
  npc_dota_hero_pudge: "Pudge",
  npc_dota_hero_razor: "Razor",
  npc_dota_hero_sand_king: "Sand King",
  npc_dota_hero_storm_spirit: "Storm Spirit",
  npc_dota_hero_sven: "Sven",
  npc_dota_hero_tiny: "Tiny",
  npc_dota_hero_vengefulspirit: "Vengeful Spirit",
  npc_dota_hero_windrunner: "Windranger",
  npc_dota_hero_zuus: "Zeus",
  npc_dota_hero_kunkka: "Kunkka",
  npc_dota_hero_lina: "Lina",
  npc_dota_hero_lion: "Lion",
  npc_dota_hero_shadow_shaman: "Shadow Shaman",
  npc_dota_hero_slardar: "Slardar",
  npc_dota_hero_tidehunter: "Tidehunter",
  npc_dota_hero_witch_doctor: "Witch Doctor",
  npc_dota_hero_lich: "Lich",
  npc_dota_hero_riki: "Riki",
  npc_dota_hero_enigma: "Enigma",
  npc_dota_hero_tinker: "Tinker",
  npc_dota_hero_sniper: "Sniper",
  npc_dota_hero_necrolyte: "Necrophos",
  npc_dota_hero_warlock: "Warlock",
  npc_dota_hero_beastmaster: "Beastmaster",
  npc_dota_hero_queenofpain: "Queen of Pain",
  npc_dota_hero_venomancer: "Venomancer",
  npc_dota_hero_faceless_void: "Faceless Void",
  npc_dota_hero_skeleton_king: "Wraith King",
  npc_dota_hero_death_prophet: "Death Prophet",
  npc_dota_hero_phantom_assassin: "Phantom Assassin",
  npc_dota_hero_pugna: "Pugna",
  npc_dota_hero_templar_assassin: "Templar Assassin",
  npc_dota_hero_viper: "Viper",
  npc_dota_hero_luna: "Luna",
  npc_dota_hero_dragon_knight: "Dragon Knight",
  npc_dota_hero_dazzle: "Dazzle",
  npc_dota_hero_rattletrap: "Clockwerk",
  npc_dota_hero_leshrac: "Leshrac",
  npc_dota_hero_furion: "Nature's Prophet",
  npc_dota_hero_life_stealer: "Lifestealer",
  npc_dota_hero_dark_seer: "Dark Seer",
  npc_dota_hero_clinkz: "Clinkz",
  npc_dota_hero_omniknight: "Omniknight",
  npc_dota_hero_enchantress: "Enchantress",
  npc_dota_hero_huskar: "Huskar",
  npc_dota_hero_night_stalker: "Night Stalker",
  npc_dota_hero_broodmother: "Broodmother",
  npc_dota_hero_bounty_hunter: "Bounty Hunter",
  npc_dota_hero_weaver: "Weaver",
  npc_dota_hero_jakiro: "Jakiro",
  npc_dota_hero_batrider: "Batrider",
  npc_dota_hero_chen: "Chen",
  npc_dota_hero_spectre: "Spectre",
  npc_dota_hero_ancient_apparition: "Ancient Apparition",
  npc_dota_hero_doom: "Doom",
  npc_dota_hero_ursa: "Ursa",
  npc_dota_hero_spirit_breaker: "Spirit Breaker",
  npc_dota_hero_gyrocopter: "Gyrocopter",
  npc_dota_hero_alchemist: "Alchemist",
  npc_dota_hero_invoker: "Invoker",
  npc_dota_hero_silencer: "Silencer",
  npc_dota_hero_obsidian_destroyer: "Outworld Destroyer",
  npc_dota_hero_lycan: "Lycan",
  npc_dota_hero_brewmaster: "Brewmaster",
  npc_dota_hero_shadow_demon: "Shadow Demon",
  npc_dota_hero_lone_druid: "Lone Druid",
  npc_dota_hero_chaos_knight: "Chaos Knight",
  npc_dota_hero_meepo: "Meepo",
  npc_dota_hero_treant: "Treant Protector",
  npc_dota_hero_ogre_magi: "Ogre Magi",
  npc_dota_hero_undying: "Undying",
  npc_dota_hero_rubick: "Rubick",
  npc_dota_hero_disruptor: "Disruptor",
  npc_dota_hero_nyx_assassin: "Nyx Assassin",
  npc_dota_hero_naga_siren: "Naga Siren",
  npc_dota_hero_keeper_of_the_light: "Keeper of the Light",
  npc_dota_hero_wisp: "Io",
  npc_dota_hero_visage: "Visage",
  npc_dota_hero_slark: "Slark",
  npc_dota_hero_medusa: "Medusa",
  npc_dota_hero_troll_warlord: "Troll Warlord",
  npc_dota_hero_centaur: "Centaur Warrunner",
  npc_dota_hero_magnataur: "Magnus",
  npc_dota_hero_shredder: "Timbersaw",
  npc_dota_hero_bristleback: "Bristleback",
  npc_dota_hero_tusk: "Tusk",
  npc_dota_hero_skywrath_mage: "Skywrath Mage",
  npc_dota_hero_abaddon: "Abaddon",
  npc_dota_hero_elder_titan: "Elder Titan",
  npc_dota_hero_legion_commander: "Legion Commander",
  npc_dota_hero_techies: "Techies",
  npc_dota_hero_ember_spirit: "Ember Spirit",
  npc_dota_hero_earth_spirit: "Earth Spirit",
  npc_dota_hero_abyssal_underlord: "Underlord",
  npc_dota_hero_terrorblade: "Terrorblade",
  npc_dota_hero_phoenix: "Phoenix",
  npc_dota_hero_oracle: "Oracle",
  npc_dota_hero_winter_wyvern: "Winter Wyvern",
  npc_dota_hero_arc_warden: "Arc Warden",
  npc_dota_hero_monkey_king: "Monkey King",
  npc_dota_hero_dark_willow: "Dark Willow",
  npc_dota_hero_pangolier: "Pangolier",
  npc_dota_hero_grimstroke: "Grimstroke",
  npc_dota_hero_hoodwink: "Hoodwink",
  npc_dota_hero_void_spirit: "Void Spirit",
  npc_dota_hero_snapfire: "Snapfire",
  npc_dota_hero_mars: "Mars",
  npc_dota_hero_dawnbreaker: "Dawnbreaker",
  npc_dota_hero_marci: "Marci",
  npc_dota_hero_primal_beast: "Primal Beast",
  npc_dota_hero_muerta: "Muerta",
};

export function getHeroDisplayName(heroName: string): string {
  return (
    heroNameMap[heroName] ||
    heroName.replace("npc_dota_hero_", "").replace(/_/g, " ")
  );
}

// New function that uses the API-based hero name resolution
export async function getHeroDisplayNameFromId(
  heroId: number,
): Promise<string> {
  const { getHeroName } = await import("./utils");
  return await getHeroName(heroId);
}

export function getHeroImage(heroName: string): string {
  const displayName = getHeroDisplayName(heroName);
  // Use Dotabuff CDN instead of local path
  const heroSlug = displayName
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return `https://www.dotabuff.com/assets/heroes/${heroSlug}.jpg`;
}

// Player data service
export async function getPlayerStats(
  accountId: number,
  playerName: string,
  role: string,
): Promise<PlayerStats> {
  try {
    const [playerData, wlData, heroesData, recentMatches] = await Promise.all([
      getPlayerData(accountId),
      getPlayerWL(accountId),
      getPlayerHeroes(accountId),
      getPlayerRecentMatches(accountId, 10),
    ]);

    const rankInfo = getRankTierInfo(playerData.rank_tier || 0);

    // Calculate overall stats
    const totalMatches = wlData.win + wlData.lose;
    const winRate = calculateWinRate(wlData.win, totalMatches);

    // Calculate average KDA from recent matches
    const avgKDA =
      recentMatches.length > 0
        ? recentMatches.reduce(
            (sum, match) =>
              sum + calculateKDA(match.kills, match.deaths, match.assists),
            0,
          ) / recentMatches.length
        : 0;

    // Calculate average GPM from recent matches
    const avgGPM =
      recentMatches.length > 0
        ? recentMatches.reduce(
            (sum, match) => sum + match.total_gold / (match.duration / 60),
            0,
          ) / recentMatches.length
        : 0;

    // Calculate average XPM from recent matches
    const avgXPM =
      recentMatches.length > 0
        ? recentMatches.reduce(
            (sum, match) => sum + match.total_xp / (match.duration / 60),
            0,
          ) / recentMatches.length
        : 0;

    // Calculate average game length
    const avgGameLength =
      recentMatches.length > 0
        ? formatDuration(
            recentMatches.reduce((sum, match) => sum + match.duration, 0) /
              recentMatches.length,
          )
        : "0:00";

    // Transform recent performance
    const recentPerformance = recentMatches.slice(0, 4).map((match) => ({
      date: new Date(match.start_time * 1000).toISOString().split("T")[0],
      hero: getHeroDisplayName(`npc_dota_hero_${match.hero_id}`),
      result: match.win ? "W" : "L",
      KDA: `${match.kills}/${match.deaths}/${match.assists}`,
      GPM: Math.round(match.total_gold / (match.duration / 60)),
    }));

    // Transform top heroes
    const topHeroes = (Array.isArray(heroesData) ? heroesData : [])
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((hero) => ({
        hero: getHeroDisplayName(`npc_dota_hero_${hero.hero_id}`),
        games: hero.games,
        winRate: calculateWinRate(hero.win, hero.games),
        avgKDA: 0, // Would need match data to calculate
        avgGPM: 0, // Would need match data to calculate
      }));

    // Calculate trends (simplified)
    const trends = [
      {
        metric: "Win Rate",
        value: winRate,
        trend: "+2%",
        direction: "up" as const,
      },
      {
        metric: "Avg KDA",
        value: avgKDA,
        trend: "+0.1",
        direction: "up" as const,
      },
      {
        metric: "Avg GPM",
        value: avgGPM,
        trend: "+5",
        direction: "up" as const,
      },
      {
        metric: "Game Impact",
        value: "Medium",
        trend: "Improving",
        direction: "up" as const,
      },
    ];

    // Transform recently played heroes
    const recentlyPlayed = (Array.isArray(heroesData) ? heroesData : [])
      .sort((a, b) => b.last_played - a.last_played)
      .slice(0, 4)
      .map((hero) => ({
        hero: getHeroDisplayName(`npc_dota_hero_${hero.hero_id}`),
        heroImage: getHeroImage(`npc_dota_hero_${hero.hero_id}`),
        games: hero.games,
        winRate: calculateWinRate(hero.win, hero.games),
      }));

    return {
      name: playerName,
      role,
      overallStats: {
        matches: totalMatches,
        winRate,
        avgKDA,
        avgGPM,
        avgXPM,
        avgGameLength,
      },
      recentPerformance,
      topHeroes,
      trends,
      rank: rankInfo.rank,
      stars: rankInfo.stars,
      immortalRank: playerData.leaderboard_rank || undefined,
      rankImage: rankInfo.image,
      recentlyPlayed,
    };
  } catch (error) {
    logWithTimestamp('error', "Error fetching player stats:", error);
    throw error;
  }
}

// Match history service
export async function getMatchHistory(
  accountIds: number[],
): Promise<MatchHistory> {
  try {
    // Fetch matches for all players
    const allMatches = await Promise.all(
      accountIds.map((id) => getPlayerMatches(id, 50)),
    );

    // Combine and deduplicate matches
    const matchMap = new Map<number, OpenDotaMatch>();
    allMatches.flat().forEach((match) => {
      if (!matchMap.has(match.match_id)) {
        matchMap.set(match.match_id, match);
      }
    });

    const matches = Array.from(matchMap.values())
      .sort((a, b) => b.start_time - a.start_time)
      .slice(0, 20);

    // Calculate summary stats
    const wins = matches.filter((m) => m.win).length;
    const totalMatches = matches.length;
    const winRate = calculateWinRate(wins, totalMatches);

    // Calculate streaks
    let currentStreak = 0;
    let longestWinStreak = 0;
    let tempStreak = 0;

    for (const match of matches) {
      if (match.win) {
        tempStreak++;
        if (currentStreak === 0) currentStreak = tempStreak;
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
      } else {
        tempStreak = 0;
        if (currentStreak > 0) currentStreak = 0;
      }
    }

    // Calculate average game length
    const avgGameLength =
      matches.length > 0
        ? formatDuration(
            matches.reduce((sum, match) => sum + match.duration, 0) /
              matches.length,
          )
        : "0:00";

    // Transform matches to app format
    const transformedMatches = matches.map((match, index) => ({
      id: match.match_id.toString(),
      date: new Date(match.start_time * 1000).toISOString().split("T")[0],
      opponent: `Team ${index + 1}`, // Would need actual opponent data
      result: match.win ? "W" : "L",
      score: match.win ? "1-0" : "0-1", // Simplified
      duration: formatDuration(match.duration),
      league: "RD2L Season 33", // Would need actual league data
      map: "de_dust2", // Placeholder
      picks: [], // Would need draft data
      bans: [],
      opponentPicks: [],
      opponentBans: [],
      draftOrder: [],
      highlights: [],
      playerStats: {},
      games: [
        {
          picks: [],
          bans: [],
          opponentPicks: [],
          opponentBans: [],
          draftOrder: [],
          highlights: [],
          playerStats: {},
          duration: formatDuration(match.duration),
          score: match.win ? "1-0" : "0-1",
        },
      ],
    }));

    // Calculate trends
    const trends = [
      {
        metric: "Win Rate",
        value: winRate,
        trend: "+5.2%",
        direction: "up" as const,
      },
      {
        metric: "Avg Game Length",
        value: avgGameLength,
        trend: "-2.1 min",
        direction: "down" as const,
      },
      {
        metric: "Avg KDA",
        value: 4.2,
        trend: "+0.3",
        direction: "up" as const,
      },
      { metric: "Avg GPM", value: 680, trend: "+25", direction: "up" as const },
    ];

    return {
      summary: {
        totalMatches,
        wins,
        losses: totalMatches - wins,
        winRate,
        avgGameLength,
        longestWinStreak,
        currentStreak,
      },
      matches: transformedMatches,
      trends,
    };
  } catch (error) {
    logWithTimestamp('error', "Error fetching match history:", error);
    throw error;
  }
}

// Draft suggestions service (simplified - would need more complex logic)
export async function getDraftSuggestions(
  accountIds: number[],
): Promise<DraftSuggestions> {
  try {
    // Fetch hero data for all players
    const playerHeroes = await Promise.all(
      accountIds.map((id) => getPlayerHeroes(id)),
    );

    // Analyze team strengths and weaknesses
    const allHeroes = playerHeroes.flat();
    const heroStats = new Map<
      number,
      { games: number; wins: number; winRate: number }
    >();

    allHeroes.forEach((hero) => {
      const existing = heroStats.get(hero.hero_id) || {
        games: 0,
        wins: 0,
        winRate: 0,
      };
      existing.games += hero.games;
      existing.wins += hero.win;
      existing.winRate = calculateWinRate(existing.wins, existing.games);
      heroStats.set(hero.hero_id, existing);
    });

    // Get top performing heroes
    const topHeroes = Array.from(heroStats.entries())
      .sort((a, b) => b[1].winRate - a[1].winRate)
      .slice(0, 15)
      .map(([heroId, stats]) => ({
        heroId,
        name: getHeroDisplayName(`npc_dota_hero_${heroId}`),
        ...stats,
      }));

    // Generate draft suggestions (simplified)
    const teamStrengths = {
      carry: "Strong late game scaling with high GPM heroes",
      mid: "Excellent tempo control and teamfight presence",
      support: "Solid teamfight presence and utility",
      offlane: "Good initiation and utility heroes",
    };

    const teamWeaknesses = [
      "Limited early game pressure",
      "Vulnerable to aggressive trilanes",
      "Relies heavily on mid game timing windows",
    ];

    // Generate phase recommendations
    const phaseRecommendations = {
      first: {
        title: "First Phase Picks",
        description: "Secure your team's core identity and comfort heroes",
        heroes: topHeroes.slice(0, 3).map((hero) => ({
          name: hero.name,
          role: "Flex", // Would need role detection
          reason: `${hero.name} has ${hero.winRate.toFixed(1)}% win rate`,
          synergy: [],
          counters: [],
          pickPriority: "High",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
      second: {
        title: "Second Phase Picks",
        description: "Adapt to opponent's picks and fill remaining roles",
        heroes: topHeroes.slice(3, 6).map((hero) => ({
          name: hero.name,
          role: "Flex",
          reason: `${hero.name} has ${hero.winRate.toFixed(1)}% win rate`,
          synergy: [],
          counters: [],
          pickPriority: "Medium",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
      third: {
        title: "Third Phase Picks",
        description: "Final adjustments based on opponent's full draft",
        heroes: topHeroes.slice(6, 9).map((hero) => ({
          name: hero.name,
          role: "Flex",
          reason: `${hero.name} has ${hero.winRate.toFixed(1)}% win rate`,
          synergy: [],
          counters: [],
          pickPriority: "Medium",
          winRate: hero.winRate,
          games: hero.games,
        })),
      },
    };

    const metaCounters = [
      {
        hero: "Phantom Assassin",
        counter: "Anti-Mage",
        reason: "Mana break and blink counter PA's mobility",
        effectiveness: "High",
      },
      {
        hero: "Invoker",
        counter: "Storm Spirit",
        reason: "Storm's mobility can dodge Invoker's spells",
        effectiveness: "Medium",
      },
    ];

    const recentDrafts = [
      {
        date: "2024-11-26",
        opponent: "Too Much Milk",
        result: "W",
        picks: topHeroes.slice(0, 5).map((h) => h.name),
        bans: [],
        notes: "Strong teamfight composition with excellent synergy",
      },
    ];

    return {
      teamStrengths,
      teamWeaknesses,
      phaseRecommendations,
      metaCounters,
      recentDrafts,
    };
  } catch (error) {
    logWithTimestamp('error', "Error generating draft suggestions:", error);
    throw error;
  }
}

// Team analysis service
export async function getTeamAnalysis(
  accountIds: number[],
): Promise<TeamAnalysis> {
  try {
    // Fetch data for all players
    const playerStats = await Promise.all(
      accountIds.map((id) => getPlayerMatches(id, 50)),
    );

    const allMatches = playerStats.flat();
    const wins = allMatches.filter((m) => m.win).length;
    const totalMatches = allMatches.length;
    const winRate = calculateWinRate(wins, totalMatches);

    // Calculate average stats
    const avgKDA =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum, match) =>
              sum + calculateKDA(match.kills, match.deaths, match.assists),
            0,
          ) / allMatches.length
        : 0;

    const avgGPM =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum, match) => sum + match.total_gold / (match.duration / 60),
            0,
          ) / allMatches.length
        : 0;

    const avgXPM =
      allMatches.length > 0
        ? allMatches.reduce(
            (sum, match) => sum + match.total_xp / (match.duration / 60),
            0,
          ) / allMatches.length
        : 0;

    const avgGameLength =
      allMatches.length > 0
        ? formatDuration(
            allMatches.reduce((sum, match) => sum + match.duration, 0) /
              allMatches.length,
          )
        : "0:00";

    return {
      overallStats: {
        totalMatches,
        winRate,
        avgGameLength,
        avgKDA,
        avgGPM,
        avgXPM,
      },
      rolePerformance: {
        carry: { winRate: 70, avgKDA: 4.5, avgGPM: 750 },
        mid: { winRate: 75, avgKDA: 5.1, avgGPM: 680 },
        offlane: { winRate: 65, avgKDA: 3.8, avgGPM: 420 },
        support: { winRate: 68, avgKDA: 2.9, avgGPM: 280 },
      },
      gamePhaseStats: {
        earlyGame: { winRate: 65, avgDuration: "8:00" },
        midGame: { winRate: 72, avgDuration: "25:00" },
        lateGame: { winRate: 68, avgDuration: "45:00" },
      },
      heroPool: {
        mostPicked: [
          { hero: "Lion", games: 7, winRate: 100 },
          { hero: "Dragon Knight", games: 7, winRate: 85.71 },
          { hero: "Luna", games: 6, winRate: 100 },
        ],
        bestWinRate: [
          { hero: "Lion", games: 7, winRate: 100 },
          { hero: "Luna", games: 6, winRate: 100 },
          { hero: "Primal Beast", games: 6, winRate: 100 },
        ],
        mostBanned: [
          { hero: "Phantom Assassin", bans: 15, banRate: 75 },
          { hero: "Storm Spirit", bans: 12, banRate: 60 },
          { hero: "Tidehunter", bans: 10, banRate: 50 },
        ],
      },
      trends: [
        {
          metric: "Early Game Win Rate",
          value: 65,
          trend: "+5%",
          direction: "up" as const,
        },
        {
          metric: "Mid Game Win Rate",
          value: 72,
          trend: "+3%",
          direction: "up" as const,
        },
        {
          metric: "Late Game Win Rate",
          value: 68,
          trend: "-1%",
          direction: "down" as const,
        },
        {
          metric: "Average Game Length",
          value: avgGameLength,
          trend: "-2 min",
          direction: "down" as const,
        },
      ],
    };
  } catch (error) {
    logWithTimestamp('error', "Error generating team analysis:", error);
    throw error;
  }
}

// Meta insights service
export async function getMetaInsights(
  timeRange: "week" | "month" | "patch" = "week",
): Promise<MetaInsights> {
  try {
    // Return different mock data based on time range
    const timeRangeData = {
      week: {
        description:
          "Recent week shows fast-paced meta with emphasis on early game control",
        keyHeroes: [
          {
            hero: "Phantom Assassin",
            pickRate: 0.18,
            winRate: 54.2,
            banRate: 0.28,
          },
          { hero: "Invoker", pickRate: 0.15, winRate: 49.1, banRate: 0.22 },
          {
            hero: "Crystal Maiden",
            pickRate: 0.13,
            winRate: 52.8,
            banRate: 0.1,
          },
          { hero: "Juggernaut", pickRate: 0.12, winRate: 55.3, banRate: 0.15 },
          { hero: "Tidehunter", pickRate: 0.11, winRate: 51.2, banRate: 0.18 },
        ],
        strategies: [
          "Aggressive early game with strong laning heroes",
          "Quick teamfight coordination in mid game",
          "Efficient late game scaling",
        ],
        trends: [
          {
            title: "Fast Paced Meta",
            description:
              "Average game length decreased by 4.1 minutes this week",
            impact: "High",
            trend: "up" as const,
            details:
              "Teams prioritizing early game heroes and aggressive strategies",
          },
          {
            title: "Support Impact Rising",
            description: "Support heroes seeing 15% increase in pick rates",
            impact: "Medium",
            trend: "up" as const,
            details:
              "Meta shift towards utility supports with strong teamfight presence",
          },
        ],
        roleStats: {
          carry: { avgGPM: 680, avgKDA: "6.8/4.3/4.1", winRate: 52.8 },
          mid: { avgGPM: 610, avgKDA: "8.2/4.1/5.6", winRate: 50.2 },
          offlane: { avgGPM: 450, avgKDA: "4.5/6.1/9.2", winRate: 49.5 },
          support: { avgGPM: 310, avgKDA: "2.4/6.5/13.1", winRate: 51.3 },
        },
      },
      month: {
        description: "Monthly trends show balanced meta with diverse hero pool",
        keyHeroes: [
          {
            hero: "Phantom Assassin",
            pickRate: 0.15,
            winRate: 52.3,
            banRate: 0.25,
          },
          { hero: "Invoker", pickRate: 0.12, winRate: 48.7, banRate: 0.18 },
          {
            hero: "Crystal Maiden",
            pickRate: 0.11,
            winRate: 51.2,
            banRate: 0.08,
          },
          { hero: "Juggernaut", pickRate: 0.1, winRate: 53.1, banRate: 0.12 },
          { hero: "Tidehunter", pickRate: 0.09, winRate: 49.8, banRate: 0.15 },
        ],
        strategies: [
          "Balanced approach with flexible hero picks",
          "Mid game teamfight coordination",
          "Late game scaling with carry heroes",
        ],
        trends: [
          {
            title: "Balanced Meta",
            description: "Average game length stable with 2.1 minute variation",
            impact: "Medium",
            trend: "neutral" as const,
            details: "Meta is well-balanced with no dominant strategies",
          },
          {
            title: "Hero Diversity",
            description: "Over 80 heroes picked in professional matches",
            impact: "Medium",
            trend: "up" as const,
            details: "Healthy meta with many viable hero options",
          },
        ],
        roleStats: {
          carry: { avgGPM: 650, avgKDA: "6.2/4.1/3.8", winRate: 51.2 },
          mid: { avgGPM: 580, avgKDA: "7.8/3.9/5.2", winRate: 49.8 },
          offlane: { avgGPM: 420, avgKDA: "4.1/5.8/8.9", winRate: 48.9 },
          support: { avgGPM: 280, avgKDA: "2.1/6.2/12.4", winRate: 50.1 },
        },
      },
      patch: {
        description:
          "Current patch meta emphasizes late game scaling and team coordination",
        keyHeroes: [
          { hero: "Wraith King", pickRate: 0.2, winRate: 56.7, banRate: 0.32 },
          {
            hero: "Nature's Prophet",
            pickRate: 0.16,
            winRate: 52.4,
            banRate: 0.24,
          },
          { hero: "Doom", pickRate: 0.14, winRate: 54.1, banRate: 0.28 },
          { hero: "Clockwerk", pickRate: 0.12, winRate: 50.8, banRate: 0.16 },
          { hero: "Lifestealer", pickRate: 0.1, winRate: 53.2, banRate: 0.18 },
        ],
        strategies: [
          "Late game scaling with carry heroes",
          "Strong teamfight coordination",
          "Strategic map control and objectives",
        ],
        trends: [
          {
            title: "Late Game Meta",
            description:
              "Average game length increased by 5.3 minutes this patch",
            impact: "High",
            trend: "down" as const,
            details:
              "Meta shift towards late game heroes and scaling strategies",
          },
          {
            title: "Carry Dominance",
            description: "Carry heroes seeing 25% increase in win rates",
            impact: "High",
            trend: "up" as const,
            details:
              "Patch changes favoring carry heroes and late game scaling",
          },
        ],
        roleStats: {
          carry: { avgGPM: 720, avgKDA: "7.5/4.8/4.3", winRate: 54.8 },
          mid: { avgGPM: 640, avgKDA: "8.5/4.3/5.8", winRate: 51.2 },
          offlane: { avgGPM: 480, avgKDA: "4.8/6.2/9.8", winRate: 49.8 },
          support: { avgGPM: 320, avgKDA: "2.6/6.8/13.5", winRate: 50.5 },
        },
      },
    };

    const data = timeRangeData[timeRange];

    return {
      currentMeta: {
        description: data.description,
        keyHeroes: data.keyHeroes,
        strategies: data.strategies,
      },
      metaTrends: data.trends,
      roleStats: data.roleStats,
    };
  } catch (error) {
    logWithTimestamp('error', "Error fetching meta insights:", error);
    throw error;
  }
}

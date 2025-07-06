import { writeMockData } from '@/lib/mock-data-writer';
import type {
  OpenDotaMatch,
  OpenDotaPlayer,
  OpenDotaPlayerCounts,
  OpenDotaPlayerHeroes,
  OpenDotaPlayerRatings,
  OpenDotaPlayerRecentMatch,
  OpenDotaPlayerTotals,
  OpenDotaPlayerWL
} from '@/types/opendota';
import {
  randomChoice,
  randomFloat,
  randomInt
} from './utils/fake-data-helpers';

// Player names for deterministic generation
const PLAYER_NAMES = [
  'Arteezy', 'SumaiL', 'Miracle-', 'Ana', 'Topson', 'N0tail', 'Ceb', 'JerAx', 'KuroKy', 'Puppey',
  'Dendi', 'Fear', 'Universe', 'Bulba', 'S4', 'Loda', 'Akke', 'AdmiralBulldog', 'EGM', 'H4nn1',
  'Fly', 'Cr1t-', 'Zai', 'Resolut1on', 'Mind_Control', 'GH', 'MC', 'KuroKy', 'Miracle-', 'Matumbaman',
  'Boxi', 'iNSaNiA', 'qojqva', 'Taiga', 'mss', 'Fata', '33', 'KheZu', 'PieLieDie', 'SingSing',
  'EternalEnvy', 'Aui_2000', 'Pieliedie', 'Fogged', '1437', 'Merlini', 'Lacoste', 'MSS', 'FLUFFNSTUFF', 'MoonMeander',
  'Zai', 'Cr1t-', 'Bulba', 'Fear', 'Universe', 'SumaiL', 'Arteezy', 'PPD', 'Aui_2000', 'EGM'
];

// Hero names for player stats
const HERO_NAMES = [
  'Anti-Mage', 'Axe', 'Bane', 'Bloodseeker', 'Crystal Maiden', 'Drow Ranger', 'Earthshaker',
  'Juggernaut', 'Mirana', 'Morphling', 'Shadow Fiend', 'Phantom Lancer', 'Puck', 'Pudge',
  'Razor', 'Sand King', 'Storm Spirit', 'Sven', 'Tiny', 'Vengeful Spirit', 'Windranger',
  'Zeus', 'Kunkka', 'Lina', 'Lion', 'Shadow Shaman', 'Slardar', 'Tidehunter', 'Witch Doctor',
  'Lich', 'Riki', 'Enigma', 'Tinker', 'Sniper', 'Necrophos', 'Warlock', 'Beastmaster',
  'Queen of Pain', 'Venomancer', 'Faceless Void', 'Wraith King', 'Death Prophet', 'Phantom Assassin',
  'Pugna', 'Templar Assassin', 'Viper', 'Luna', 'Dragon Knight', 'Dazzle', 'Clockwerk',
  'Leshrac', 'Nature\'s Prophet', 'Lifestealer', 'Dark Seer', 'Clinkz', 'Omniknight',
  'Enchantress', 'Huskar', 'Night Stalker', 'Broodmother', 'Bounty Hunter', 'Weaver',
  'Jakiro', 'Batrider', 'Chen', 'Spectre', 'Ancient Apparition', 'Doom', 'Ursa',
  'Spirit Breaker', 'Gyrocopter', 'Alchemist', 'Invoker', 'Silencer', 'Outworld Destroyer',
  'Lycan', 'Brewmaster', 'Shadow Demon', 'Lone Druid', 'Chaos Knight', 'Meepo', 'Treant Protector',
  'Ogre Magi', 'Undying', 'Rubick', 'Disruptor', 'Nyx Assassin', 'Naga Siren', 'Keeper of the Light',
  'Io', 'Visage', 'Slark', 'Medusa', 'Troll Warlord', 'Centaur Warrunner', 'Magnus',
  'Timbersaw', 'Bristleback', 'Tusk', 'Skywrath Mage', 'Abaddon', 'Elder Titan', 'Legion Commander',
  'Techies', 'Ember Spirit', 'Earth Spirit', 'Underlord', 'Terrorblade', 'Phoenix', 'Oracle',
  'Winter Wyvern', 'Arc Warden', 'Monkey King', 'Dark Willow', 'Pangolier', 'Grimstroke',
  'Hoodwink', 'Void Spirit', 'Snapfire', 'Mars', 'Dawnbreaker', 'Marci', 'Primal Beast',
  'Muerta', 'Dawnbreaker'
];

function getPlayerNameFromId(accountId: number): string {
  return PLAYER_NAMES[Math.abs(accountId) % PLAYER_NAMES.length];
}

export function generateFakePlayer(accountId: number, filename: string): OpenDotaPlayer {
  const name = getPlayerNameFromId(accountId);
  const data = {
    profile: {
      account_id: accountId,
      personaname: name,
      name: name,
      plus: randomChoice([true, false]),
      cheese: randomInt(0, 1000),
      steamid: `76561198${randomInt(100000000, 999999999)}`,
      avatar: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${randomInt(1, 100)}/${randomInt(1, 100)}.jpg`,
      avatarmedium: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${randomInt(1, 100)}/${randomInt(1, 100)}_medium.jpg`,
      avatarfull: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${randomInt(1, 100)}/${randomInt(1, 100)}_full.jpg`,
      profileurl: `https://steamcommunity.com/profiles/${accountId}`,
      last_login: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
      loccountrycode: randomChoice(['US', 'EU', 'CN', 'SEA', 'CIS']),
      status: randomChoice(['online', 'offline', 'away']),
      fh_unavailable: false,
      is_contributor: false,
      is_subscriber: randomChoice([true, false])
    },
    rank_tier: randomInt(70, 80),
    leaderboard_rank: randomInt(1, 1000),
    total_matches: randomInt(1000, 5000),
    win: randomInt(500, 2500),
    kda: parseFloat((randomFloat(2, 8)).toFixed(2)),
    gpm: randomInt(350, 800),
    xpm: randomInt(400, 900),
    avg_seconds_per_match: randomInt(1800, 3600)
  };
  
  writeMockData(filename, data, `/players/${accountId}`);
  return data;
}

export function generateFakePlayerWL(accountId: number, filename: string): OpenDotaPlayerWL {
  const data = {
    win: 5029,
    lose: 4662
  };
  writeMockData(filename, data, `/players/${accountId}/wl`);
  return data;
}

export function generateFakePlayerTotals(accountId: number, filename: string): OpenDotaPlayerTotals[] {
  const fields = [
    'kills', 'deaths', 'assists', 'kda', 'gold_per_min', 'xp_per_min', 'last_hits', 'denies',
    'lane_efficiency_pct', 'duration', 'level', 'hero_damage', 'tower_damage', 'hero_healing',
    'stuns', 'tower_kills', 'neutral_kills', 'courier_kills', 'purchase_tpscroll',
    'purchase_ward_observer', 'purchase_ward_sentry', 'purchase_gem', 'purchase_rapier',
    'pings', 'throw', 'comeback', 'stomp', 'loss', 'actions_per_min'
  ];
  
  const data = fields.map(field => ({
    field: field,
    n: randomInt(50, 200),
    sum: randomInt(1000, 10000)
  }));
  
  writeMockData(filename, data, `/players/${accountId}/totals`);
  return data;
}

export function generateFakePlayerCounts(accountId: number, filename: string): OpenDotaPlayerCounts {
  const data = {
    leaver_status: {
      "0": { games: randomInt(8000, 10000), win: randomInt(4000, 5000) },
      "1": { games: randomInt(100, 200), win: randomInt(10, 20) },
      "2": { games: randomInt(5, 10), win: randomInt(2, 5) },
      "3": { games: randomInt(1, 5), win: randomInt(0, 2) }
    },
    game_mode: {
      "1": { games: randomInt(300, 400), win: randomInt(150, 200) },
      "2": { games: randomInt(400, 500), win: randomInt(200, 250) },
      "3": { games: randomInt(500, 600), win: randomInt(250, 300) },
      "4": { games: randomInt(80, 100), win: randomInt(40, 60) },
      "22": { games: randomInt(7000, 9000), win: randomInt(3500, 4500) }
    },
    lobby_type: {
      "0": { games: randomInt(1500, 2000), win: randomInt(800, 1200) },
      "1": { games: randomInt(300, 500), win: randomInt(150, 250) },
      "7": { games: randomInt(6000, 8000), win: randomInt(3000, 4000) },
      "9": { games: randomInt(20, 30), win: randomInt(5, 15) }
    },
    lane_role: {
      "0": { games: randomInt(2000, 3000), win: randomInt(1000, 1500) },
      "1": { games: randomInt(2000, 3000), win: randomInt(1000, 1500) },
      "2": { games: randomInt(1000, 1500), win: randomInt(500, 800) },
      "3": { games: randomInt(2000, 3000), win: randomInt(1000, 1500) },
      "4": { games: randomInt(100, 200), win: randomInt(50, 100) }
    },
    region: {
      "1": { games: randomInt(500, 800), win: randomInt(250, 400) },
      "2": { games: randomInt(8000, 10000), win: randomInt(4000, 5000) },
      "3": { games: randomInt(10, 20), win: randomInt(5, 15) }
    },
    patch: {
      "55": { games: randomInt(100, 200), win: randomInt(50, 100) },
      "56": { games: randomInt(100, 200), win: randomInt(50, 100) }
    },
    is_radiant: {
      "0": { games: randomInt(4000, 5000), win: randomInt(2000, 2500) },
      "1": { games: randomInt(4000, 5000), win: randomInt(2000, 2500) }
    }
  };
  
  writeMockData(filename, data, `/players/${accountId}/counts`);
  return data;
}

export function generateFakePlayerHeroes(accountId: number, filename: string): OpenDotaPlayerHeroes[] {
  const heroCount = 50;
  const data = Array.from({ length: heroCount }, (_, i) => {
    const heroId = i + 1;
    const games = randomInt(1, 500);
    const win = randomInt(0, games);
    const withGames = randomInt(0, 1000);
    const withWin = randomInt(0, withGames);
    const againstGames = randomInt(0, 1000);
    const againstWin = randomInt(0, againstGames);
    
    return {
      hero_id: heroId,
      last_played: Math.floor(Date.now() / 1000) - randomInt(0, 365 * 24 * 60 * 60),
      games: games,
      win: win,
      with_games: withGames,
      with_win: withWin,
      against_games: againstGames,
      against_win: againstWin
    };
  });
  
  writeMockData(filename, data, `/players/${accountId}/heroes`);
  return data;
}

export function generateFakePlayerRecentMatches(accountId: number, filename: string): OpenDotaPlayerRecentMatch[] {
  const data = Array.from({ length: 20 }, (_, i) => {
    const matchId = 2000000000 + i * 10000;
    const isRadiant = Math.random() < 0.5;
    const radiantWin = Math.random() < 0.5;
    const heroId = randomInt(1, 124);
    const duration = randomInt(1200, 3600);
    const startTime = Math.floor(Date.now() / 1000) - randomInt(0, 30 * 24 * 60 * 60);
    
    return {
      match_id: matchId,
      player_slot: isRadiant ? randomInt(0, 4) : randomInt(128, 132),
      radiant_win: radiantWin,
      hero_id: heroId,
      start_time: startTime,
      duration: duration,
      game_mode: 22,
      lobby_type: 7,
      version: null,
      kills: randomInt(0, 25),
      deaths: randomInt(0, 15),
      assists: randomInt(0, 30),
      average_rank: randomInt(70, 80),
      xp_per_min: randomInt(300, 1200),
      gold_per_min: randomInt(250, 900),
      hero_damage: randomInt(5000, 30000),
      tower_damage: randomInt(0, 15000),
      hero_healing: randomInt(0, 5000),
      last_hits: randomInt(20, 500),
      lane: randomInt(1, 3),
      lane_role: randomInt(1, 4),
      is_roaming: randomChoice([true, false]),
      cluster: randomInt(100, 130),
      leaver_status: 0,
      party_size: randomInt(1, 5),
      hero_variant: randomInt(1, 5)
    };
  });
  
  writeMockData(filename, data, `/players/${accountId}/recentMatches`);
  return data;
}

export function generateFakePlayerRatings(accountId: number, filename: string): OpenDotaPlayerRatings[] {
  const data = Array.from({ length: 50 }, (_, i) => {
    const baseRank = 4500;
    const rankVariation = randomInt(-200, 200);
    const matchId = 2000000000 + i * 10000;
    const timeOffset = randomInt(0, 365 * 24 * 60 * 60 * 1000);
    
    return {
      account_id: accountId,
      match_id: matchId,
      solo_competitive_rank: baseRank + rankVariation,
      competitive_rank: null,
      time: new Date(Date.now() - timeOffset).toISOString()
    };
  });
  
  writeMockData(filename, data, `/players/${accountId}/ratings`);
  return data;
}

export function generateFakePlayerStats(accountId: number, filename: string) {
  const name = getPlayerNameFromId(accountId);
  const role = randomChoice(["Carry", "Support", "Offlane", "Mid", "Roamer"]);
  const rank = randomChoice(["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"]);
  const stars = randomInt(1, 5);
  const immortalRank = rank === "Immortal" ? randomInt(1, 1000) : undefined;
  const rankImage = `/ranks/${rank.toLowerCase()}.png`;
  const matches = randomInt(50, 500);
  const winRate = parseFloat((randomFloat(40, 70)).toFixed(1));
  const avgKDA = parseFloat((randomFloat(2, 8)).toFixed(2));
  const avgGPM = randomInt(350, 800);
  const avgXPM = randomInt(400, 900);
  const avgGameLength = `${randomInt(25, 50)}:${randomInt(0,59).toString().padStart(2, '0')}`;
  
  const recentPerformance = Array.from({ length: 4 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
    hero: randomChoice(HERO_NAMES),
    result: randomChoice(["W", "L"]),
    KDA: `${randomInt(0,20)}/${randomInt(0,10)}/${randomInt(0,20)}`,
    GPM: randomInt(350, 900)
  }));
  
  const topHeroes = Array.from({ length: 5 }, () => ({
    hero: randomChoice(HERO_NAMES),
    games: randomInt(10, 100),
    winRate: parseFloat((randomFloat(40, 70)).toFixed(1)),
    avgKDA: parseFloat((randomFloat(2, 8)).toFixed(2)),
    avgGPM: randomInt(350, 800)
  }));
  
  const trends = [
    { metric: "Win Rate", value: winRate, trend: "+2%", direction: "up" as const },
    { metric: "Avg KDA", value: avgKDA, trend: "+0.1", direction: "up" as const },
    { metric: "Avg GPM", value: avgGPM, trend: "+5", direction: "up" as const },
    { metric: "Game Impact", value: "Medium", trend: "Improving", direction: "up" as const }
  ];
  
  const recentlyPlayed = Array.from({ length: 4 }, () => {
    const hero = randomChoice(HERO_NAMES);
    return {
      hero,
      heroImage: `/heroes/${hero.toLowerCase().replace(/\s+/g, '_')}.png`,
      games: randomInt(5, 50),
      winRate: parseFloat((randomFloat(40, 70)).toFixed(1))
    };
  });
  
  const data = {
    name,
    role,
    overallStats: {
      matches,
      winRate,
      avgKDA,
      avgGPM,
      avgXPM,
      avgGameLength
    },
    recentPerformance,
    topHeroes,
    trends,
    rank,
    stars,
    immortalRank,
    rankImage,
    recentlyPlayed
  };
  
  writeMockData(filename, data, `/players/${accountId}/stats`);
  return data;
}

function generateFakePlayerData(j: number, radiantWin: boolean, startTime: number, duration: number) {
  return {
    account_id: randomInt(100000000, 999999999),
    player_slot: j < 5 ? j : j + 128,
    party_id: randomInt(0, 5),
    permanent_buffs: [],
    party_size: randomInt(1, 5),
    team_number: j < 5 ? 0 : 1,
    team_slot: j % 5,
    hero_id: randomInt(1, 124),
    hero_variant: 0,
    item_0: randomInt(1, 100),
    item_1: randomInt(1, 100),
    item_2: randomInt(1, 100),
    item_3: randomInt(1, 100),
    item_4: randomInt(1, 100),
    item_5: randomInt(1, 100),
    backpack_0: randomInt(1, 100),
    backpack_1: randomInt(1, 100),
    backpack_2: randomInt(1, 100),
    item_neutral: randomInt(1, 100),
    kills: randomInt(0, 20),
    deaths: randomInt(0, 15),
    assists: randomInt(0, 25),
    leaver_status: 0,
    last_hits: randomInt(0, 300),
    denies: randomInt(0, 50),
    gold_per_min: randomFloat(200, 800),
    xp_per_min: randomFloat(300, 1000),
    level: randomInt(1, 25),
    net_worth: randomInt(1000, 50000),
    aghanims_scepter: randomInt(0, 1),
    aghanims_shard: randomInt(0, 1),
    moonshard: randomInt(0, 1),
    hero_damage: randomInt(0, 50000),
    tower_damage: randomInt(0, 10000),
    hero_healing: randomInt(0, 20000),
    gold: randomInt(0, 10000),
    gold_spent: randomInt(0, 50000),
    ability_upgrades_arr: Array.from({ length: randomInt(0, 25) }, () => randomInt(0, 4)),
    personaname: `Player${randomInt(100000000, 999999999)}`,
    name: `Player${randomInt(100000000, 999999999)}`,
    last_login: new Date().toISOString(),
    rank_tier: randomInt(0, 80),
    is_subscriber: randomChoice([true, false]),
    radiant_win: radiantWin,
    start_time: startTime,
    duration,
    cluster: randomInt(100, 200),
    lobby_type: randomInt(0, 10),
    game_mode: randomInt(0, 23),
    is_contributor: false,
    patch: randomInt(50, 60),
    region: randomInt(0, 10),
    isRadiant: j < 5,
    win: (j < 5) === radiantWin ? 1 : 0,
    lose: (j < 5) === radiantWin ? 0 : 1,
    total_gold: randomInt(10000, 100000),
    total_xp: randomInt(5000, 50000),
    kills_per_min: randomFloat(0, 2),
    kda: randomFloat(0, 10),
    abandons: 0,
    benchmarks: {
      gold_per_min: { raw: randomFloat(200, 800), pct: randomFloat(0, 100) },
      xp_per_min: { raw: randomFloat(300, 1000), pct: randomFloat(0, 100) },
      kills_per_min: { raw: randomFloat(0, 2), pct: randomFloat(0, 100) },
      last_hits_per_min: { raw: randomFloat(0, 10), pct: randomFloat(0, 100) },
      hero_damage_per_min: { raw: randomFloat(0, 1000), pct: randomFloat(0, 100) },
      hero_healing_per_min: { raw: randomFloat(0, 500), pct: randomFloat(0, 100) },
      tower_damage: { raw: randomFloat(0, 2000), pct: randomFloat(0, 100) }
    }
  };
}

export function generateFakePlayerMatches(accountId: number, filename: string): OpenDotaMatch[] {
  const data = Array.from({ length: 20 }, (_, i) => {
    const matchId = 2000000000 + i * 10000;
    const radiantWin = Math.random() < 0.5;
    const duration = randomInt(1200, 3600);
    const startTime = Math.floor(Date.now() / 1000) - randomInt(0, 30 * 24 * 60 * 60);
    
    return {
      match_id: matchId,
      start_time: startTime,
      duration,
      radiant_win: radiantWin,
      players: Array.from({ length: 10 }, (_, j) => generateFakePlayerData(j, radiantWin, startTime, duration)),
      radiant_name: 'Radiant',
      dire_name: 'Dire',
      radiant_team_id: randomInt(1000, 9999),
      dire_team_id: randomInt(1000, 9999),
      radiant_score: radiantWin ? randomInt(20, 50) : randomInt(0, 30),
      dire_score: radiantWin ? randomInt(0, 30) : randomInt(20, 50),
      leagueid: randomInt(1000, 9999),
      picks_bans: Array.from({ length: randomInt(10, 20) }, (_, k) => ({
        is_pick: randomChoice([true, false]),
        hero_id: randomInt(1, 50),
        team: randomChoice([0, 1]),
        order: k
      }))
    };
  });
  
  writeMockData(filename, data, `/players/${accountId}/matches`);
  return data;
} 
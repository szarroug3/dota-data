import { writeMockData } from '@/lib/mock-data-writer';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/opendota';
import fs from 'fs';
import path from 'path';
import { randomChoice, randomFloat, randomInt } from './utils/fake-data-helpers';
import { getRandomItemIds } from './utils/real-data-helpers';

// Load real heroes data for hero IDs
function loadRealHeroes(): { [key: string]: number } {
  try {
    const heroesPath = path.join(process.cwd(), 'real-data', 'heroes.json');
    const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
    const heroIds: { [key: string]: number } = {};
    
    (Object.values(heroesData) as { name: string; id: number }[]).forEach((hero) => {
      heroIds[hero.name] = hero.id;
    });
    
    return heroIds;
  } catch {
    console.warn('Could not load real heroes data, using fallback');
    return {};
  }
}

// Common hero names for fallback
const COMMON_HEROES = [
  'Anti-Mage', 'Axe', 'Bane', 'Bloodseeker', 'Crystal Maiden', 'Drow Ranger', 'Earthshaker',
  'Juggernaut', 'Mirana', 'Morphling', 'Shadow Fiend', 'Phantom Lancer', 'Puck', 'Pudge',
  'Razor', 'Sand King', 'Storm Spirit', 'Sven', 'Tiny', 'Vengeful Spirit', 'Windranger',
  'Zeus', 'Kunkka', 'Lina', 'Lion', 'Shadow Shaman', 'Slardar', 'Tidehunter', 'Witch Doctor'
];

function generateFakeMatchPlayer(
  accountId: number, 
  playerSlot: number, 
  isRadiant: boolean,
  heroIds: { [key: string]: number }
): OpenDotaMatchPlayer {
  const heroName = randomChoice(COMMON_HEROES);
  const heroId = heroIds[heroName] || randomInt(1, 50);
  
  // Generate realistic item IDs using real data
  const itemIds = getRandomItemIds(6);
  const backpackIds = getRandomItemIds(3);
  const neutralItemId = getRandomItemIds(1)[0];
  
  return {
    account_id: accountId,
    player_slot: playerSlot,
    party_id: randomInt(0, 5),
    permanent_buffs: [],
    party_size: randomInt(1, 5),
    team_number: isRadiant ? 0 : 1,
    team_slot: playerSlot % 5,
    hero_id: heroId,
    hero_variant: 0,
    item_0: itemIds[0],
    item_1: itemIds[1],
    item_2: itemIds[2],
    item_3: itemIds[3],
    item_4: itemIds[4],
    item_5: itemIds[5],
    backpack_0: backpackIds[0],
    backpack_1: backpackIds[1],
    backpack_2: backpackIds[2],
    item_neutral: neutralItemId,
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
    personaname: `Player${accountId}`,
    name: `Player${accountId}`,
    last_login: new Date().toISOString(),
    rank_tier: randomInt(0, 80),
    is_subscriber: randomChoice([true, false]),
    radiant_win: false, // Will be set by match
    start_time: Math.floor(Date.now() / 1000) - randomInt(0, 86400),
    duration: randomInt(1200, 3600),
    cluster: randomInt(100, 200),
    lobby_type: randomInt(0, 10),
    game_mode: randomInt(0, 23),
    is_contributor: false,
    patch: randomInt(50, 60),
    region: randomInt(0, 10),
    isRadiant,
    win: 0, // Will be set by match
    lose: 0, // Will be set by match
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

export function generateFakeMatch(matchId: number, filename: string): OpenDotaMatch {
  const heroIds = loadRealHeroes();
  const radiantWin = randomChoice([true, false]);
  const duration = randomInt(1200, 3600);
  const startTime = Math.floor(Date.now() / 1000) - randomInt(0, 86400);
  
  // Generate 10 players (5 radiant, 5 dire)
  const players: OpenDotaMatchPlayer[] = [];
  
  // Radiant players (slots 0-4)
  for (let i = 0; i < 5; i++) {
    const player = generateFakeMatchPlayer(
      randomInt(1000000, 9999999),
      i,
      true,
      heroIds
    );
    player.radiant_win = radiantWin;
    player.win = radiantWin ? 1 : 0;
    player.lose = radiantWin ? 0 : 1;
    players.push(player);
  }
  
  // Dire players (slots 128-132)
  for (let i = 0; i < 5; i++) {
    const player = generateFakeMatchPlayer(
      randomInt(1000000, 9999999),
      128 + i,
      false,
      heroIds
    );
    player.radiant_win = radiantWin;
    player.win = radiantWin ? 0 : 1;
    player.lose = radiantWin ? 1 : 0;
    players.push(player);
  }
  
  const match: OpenDotaMatch = {
    match_id: matchId,
    start_time: startTime,
    duration,
    radiant_win: radiantWin,
    players,
    radiant_name: 'Radiant',
    dire_name: 'Dire',
    radiant_team_id: randomInt(1000, 9999),
    dire_team_id: randomInt(1000, 9999),
    radiant_score: radiantWin ? randomInt(20, 50) : randomInt(0, 30),
    dire_score: radiantWin ? randomInt(0, 30) : randomInt(20, 50),
    leagueid: randomInt(1000, 9999),
    picks_bans: Array.from({ length: randomInt(10, 20) }, (_, i) => ({
      is_pick: randomChoice([true, false]),
      hero_id: randomInt(1, 50),
      team: randomChoice([0, 1]),
      order: i
    }))
  };
  
  writeMockData(filename, match, '/matches');
  return match;
}

export function generateFakeMatches(count: number, baseFilename: string): OpenDotaMatch[] {
  const matches: OpenDotaMatch[] = [];
  
  for (let i = 0; i < count; i++) {
    const matchId = randomInt(1000000000, 9999999999);
    const filename = `${baseFilename}-${matchId}.json`;
    const match = generateFakeMatch(matchId, filename);
    matches.push(match);
  }
  
  return matches;
} 
// Fake data generator for mock API responses
import { OpenDotaHero, OpenDotaMatch, OpenDotaPlayer, OpenDotaPlayerCounts, OpenDotaPlayerHeroes, OpenDotaPlayerTotals, OpenDotaPlayerWL } from './api';
import { logWithTimestamp } from './utils';

// Hero data for randomization
const HERO_NAMES = [
  "Anti-Mage", "Axe", "Bane", "Bloodseeker", "Crystal Maiden", "Drow Ranger", "Earthshaker", "Juggernaut", 
  "Mirana", "Morphling", "Shadow Fiend", "Phantom Lancer", "Puck", "Pudge", "Razor", "Sand King", 
  "Storm Spirit", "Sven", "Tiny", "Vengeful Spirit", "Windranger", "Zeus", "Kunkka", "Lina", 
  "Lion", "Shadow Shaman", "Slardar", "Tidehunter", "Witch Doctor", "Lich", "Riki", "Enigma", 
  "Tinker", "Sniper", "Necrophos", "Warlock", "Beastmaster", "Queen of Pain", "Venomancer", "Faceless Void",
  "Wraith King", "Death Prophet", "Phantom Assassin", "Pugna", "Templar Assassin", "Viper", "Luna", 
  "Dragon Knight", "Dazzle", "Clockwerk", "Leshrac", "Nature's Prophet", "Lifestealer", "Dark Seer",
  "Clinkz", "Omniknight", "Enchantress", "Huskar", "Night Stalker", "Broodmother", "Bounty Hunter",
  "Weaver", "Jakiro", "Batrider", "Chen", "Spectre", "Ancient Apparition", "Doom", "Ursa",
  "Spirit Breaker", "Gyrocopter", "Alchemist", "Invoker", "Silencer", "Outworld Destroyer", "Lycan",
  "Brewmaster", "Shadow Demon", "Lone Druid", "Chaos Knight", "Meepo", "Treant Protector", "Ogre Magi",
  "Undying", "Rubick", "Disruptor", "Nyx Assassin", "Naga Siren", "Keeper of the Light", "Io",
  "Visage", "Slark", "Medusa", "Troll Warlord", "Centaur Warrunner", "Magnus", "Timbersaw",
  "Bristleback", "Tusk", "Skywrath Mage", "Abaddon", "Elder Titan", "Legion Commander", "Techies",
  "Ember Spirit", "Earth Spirit", "Underlord", "Terrorblade", "Phoenix", "Oracle", "Winter Wyvern",
  "Arc Warden", "Monkey King", "Dark Willow", "Pangolier", "Grimstroke", "Hoodwink", "Void Spirit",
  "Snapfire", "Mars", "Dawnbreaker", "Marci", "Primal Beast", "Muerta", "Dawnbreaker"
];

const HERO_ATTRIBUTES = ["agi", "str", "int"];
const HERO_ATTACK_TYPES = ["Melee", "Ranged"];
const HERO_ROLES = [
  "Carry", "Support", "Nuker", "Disabler", "Jungler", "Durable", "Escape", "Pusher", "Initiator"
];

const PLAYER_NAMES = [
  "Arteezy", "Miracle-", "SumaiL", "N0tail", "KuroKy", "Puppey", "Dendi", "s4", "Fear", "Universe",
  "Zai", "Cr1t-", "Fly", "Notail", "JerAx", "Topson", "ana", "Ceb", "MC", "Mind_Control", "GH",
  "Matumbaman", "w33", "Resolut1on", "RAMZES666", "No[o]ne", "9pasha", "RodjER", "Solo", "Lil",
  "Daxak", "fn", "Miposhka", "Collapse", "Yatoro", "TORONTOTOKYO", "Mira", "Save-", "Kingslayer",
  "Dyrachyo", "gpk", "Nightfall", "DM", "Solo", "Lil", "Daxak", "fn", "Miposhka", "Collapse",
  "Yatoro", "TORONTOTOKYO", "Mira", "Save-", "Kingslayer", "Dyrachyo", "gpk", "Nightfall", "DM"
];

const TEAM_NAMES = [
  "Team Liquid", "OG", "PSG.LGD", "Team Secret", "Virtus.pro", "Evil Geniuses", "Natus Vincere",
  "Alliance", "Fnatic", "T1", "Team Spirit", "Gaimin Gladiators", "Tundra Esports", "Shopify Rebellion",
  "BetBoom Team", "Azure Ray", "Xtreme Gaming", "Team Falcons", "Entity", "Quest Esports"
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomSubset<T>(array: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Get unique random subset (no duplicates)
function uniqueRandomSubset<T>(array: T[], min: number, max: number): T[] {
  const count = Math.min(randomInt(min, max), array.length);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomTimestamp(): number {
  const now = Date.now();
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
  return Math.floor(randomFloat(oneYearAgo, now) / 1000);
}

// Helper to generate a random team name (excluding a given name)
function randomTeamName(exclude?: string): string {
  let name;
  do {
    name = randomChoice(TEAM_NAMES);
  } while (name === exclude);
  return name;
}

// Helper to generate a random team ID (excluding a given ID)
function randomTeamId(exclude?: number): number {
  let id;
  do {
    id = randomInt(1000000, 9999999);
  } while (id === exclude);
  return id;
}

// Helper to generate a player object with account_id and name
function generateFakePlayerWithName(accountId?: number, name?: string) {
  return {
    account_id: accountId || randomInt(100000000, 999999999),
    name: name || randomChoice(PLAYER_NAMES),
    games_played: randomInt(10, 100),
    wins: randomInt(5, 50),
    // ...add more fields as needed
  };
}

// Use a fixed current team for mock data
const CURRENT_TEAM_ID = 9517508;
const CURRENT_TEAM_NAME = "Maple Syrup блинSummary";

// Extended type for fake matches
export type FakeOpenDotaMatch = OpenDotaMatch & {
  radiant_team_id: number;
  dire_team_id: number;
  radiant_name: string;
  dire_name: string;
  players: Array<{ account_id: number; name: string; [key: string]: any }>;
};

// Generate fake hero data
export function generateFakeHeroes(count: number = 50): OpenDotaHero[] {
  // Use unique hero names to avoid duplicates
  const uniqueHeroNames = uniqueRandomSubset(HERO_NAMES, count, count);
  
  return uniqueHeroNames.map((name, i) => {
    const primaryAttr = randomChoice(HERO_ATTRIBUTES);
    const attackType = randomChoice(HERO_ATTACK_TYPES);
    const roles = uniqueRandomSubset(HERO_ROLES, 2, 5);
    
    return {
      id: i + 1,
      name: name.toLowerCase().replace(/\s+/g, '_'),
      localized_name: name,
      primary_attr: primaryAttr,
      attack_type: attackType,
      roles: roles,
      img: `/apps/dota2/images/dota_react/heroes/${name.toLowerCase().replace(/\s+/g, '_')}.png`,
      icon: `/apps/dota2/images/dota_react/heroes/${name.toLowerCase().replace(/\s+/g, '_')}.png`,
      base_health: randomInt(180, 800),
      base_mana: randomInt(0, 400),
      base_armor: randomInt(-2, 8),
      base_attack_min: randomInt(20, 80),
      base_attack_max: randomInt(30, 120),
      move_speed: randomInt(280, 350),
      base_attack_time: randomFloat(1.4, 2.0),
      attack_point: randomFloat(0.3, 0.8),
      attack_range: attackType === "Melee" ? randomInt(100, 200) : randomInt(400, 800),
      projectile_speed: attackType === "Melee" ? 0 : randomInt(900, 1200),
      turn_rate: randomFloat(0.5, 1.0),
      cm_enabled: true,
      legs: randomInt(0, 2),
      day_vision: randomInt(800, 1800),
      night_vision: randomInt(800, 1200),
      hero_id: i + 1,
      turbo_picks: randomInt(1000, 50000),
      turbo_wins: randomInt(500, 25000),
      pro_ban: randomInt(0, 100),
      pro_win: randomInt(0, 50),
      pro_pick: randomInt(0, 100),
      "1_pick": randomInt(0, 1000),
      "1_win": randomInt(0, 500),
      "2_pick": randomInt(0, 1000),
      "2_win": randomInt(0, 500),
      "3_pick": randomInt(0, 1000),
      "3_win": randomInt(0, 500),
      "4_pick": randomInt(0, 1000),
      "4_win": randomInt(0, 500),
      "5_pick": randomInt(0, 1000),
      "5_win": randomInt(0, 500),
      "6_pick": randomInt(0, 1000),
      "6_win": randomInt(0, 500),
      "7_pick": randomInt(0, 1000),
      "7_win": randomInt(0, 500),
      "8_pick": randomInt(0, 1000),
      "8_win": randomInt(0, 500),
      null_pick: randomInt(0, 100),
      null_win: randomInt(0, 50)
    };
  });
}

// Generate fake player data
export function generateFakePlayer(accountId: number): OpenDotaPlayer {
  const name = randomChoice(PLAYER_NAMES);
  const rankTier = randomInt(70, 80); // Divine to Immortal
  
  return {
    account_id: accountId,
    personaname: name,
    name: name,
    avatar: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/default.jpg`,
    avatarfull: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/default.jpg`,
    profileurl: `https://steamcommunity.com/profiles/${accountId}`,
    last_login: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
    loccountrycode: randomChoice(['US', 'EU', 'CN', 'SEA', 'CIS']),
    is_contributor: false,
    is_subscriber: randomChoice([true, false]),
    rank_tier: rankTier,
    leaderboard_rank: rankTier >= 80 ? randomInt(1, 1000) : null,
    solo_competitive_rank: randomInt(4000, 8000),
    competitive_rank: randomInt(4000, 8000),
    mmr_estimate: {
      estimate: randomInt(4000, 8000),
      stdDev: randomInt(100, 500),
      n: randomInt(10, 100)
    }
  } as OpenDotaPlayer;
}

// Generate fake match data
export function generateFakeMatch(matchId: number, playerSlot?: number): FakeOpenDotaMatch {
  const isRadiant = Math.random() < 0.5;
  const radiant_team_id = isRadiant ? CURRENT_TEAM_ID : randomTeamId(CURRENT_TEAM_ID);
  const dire_team_id = isRadiant ? randomTeamId(CURRENT_TEAM_ID) : CURRENT_TEAM_ID;
  const radiant_name = isRadiant ? CURRENT_TEAM_NAME : randomTeamName(CURRENT_TEAM_NAME);
  const dire_name = isRadiant ? randomTeamName(CURRENT_TEAM_NAME) : CURRENT_TEAM_NAME;

  // Unique hero IDs for 10 players
  const allHeroIds = Array.from({ length: 124 }, (_, i) => i + 1);
  const playerHeroIds = uniqueRandomSubset(allHeroIds, 10, 10);

  // Generate unique player names for all 10 players
  const uniquePlayerNames = uniqueRandomSubset(PLAYER_NAMES, 10, 10);

  // Generate 10 players, 5 per side, with realistic stats
  const radiantPlayers = Array.from({ length: 5 }, (_, i) => {
    return {
      account_id: randomInt(100000000, 999999999),
      name: uniquePlayerNames[i],
      hero_id: playerHeroIds[i],
      kills: randomInt(0, 25),
      deaths: randomInt(0, 15),
      assists: randomInt(0, 30),
      gold_per_min: randomInt(250, 900),
      xp_per_min: randomInt(300, 1200),
      last_hits: randomInt(20, 400),
      denies: randomInt(0, 30),
      level: randomInt(12, 30),
      // ...add more fields as needed
    };
  });
  const direPlayers = Array.from({ length: 5 }, (_, i) => {
    return {
      account_id: randomInt(100000000, 999999999),
      name: uniquePlayerNames[i + 5],
      hero_id: playerHeroIds[i + 5],
      kills: randomInt(0, 25),
      deaths: randomInt(0, 15),
      assists: randomInt(0, 30),
      gold_per_min: randomInt(250, 900),
      xp_per_min: randomInt(300, 1200),
      last_hits: randomInt(20, 400),
      denies: randomInt(0, 30),
      level: randomInt(12, 30),
      // ...add more fields as needed
    };
  });
  const players = [...radiantPlayers, ...direPlayers];

  // Calculate scores
  const radiant_score = radiantPlayers.reduce((sum, p) => sum + p.kills, 0);
  const dire_score = direPlayers.reduce((sum, p) => sum + p.kills, 0);
  const radiant_win = radiant_score >= dire_score;

  // Picks/Bans
  const picksBansHeroIds = uniqueRandomSubset(allHeroIds, 20, 20);
  const picks_bans = picksBansHeroIds.map((heroId, i) => ({
    is_pick: i < 10,
    hero_id: heroId,
    team: i % 2,
    order: i
  }));

  return {
    match_id: matchId,
    player_slot: playerSlot ?? randomInt(0, 9),
    radiant_win,
    duration: randomInt(1200, 3600),
    game_mode: randomInt(1, 22),
    lobby_type: randomInt(0, 7),
    hero_id: playerHeroIds[0],
    start_time: randomTimestamp(),
    version: 1,
    kills: randomInt(0, 25),
    deaths: randomInt(0, 15),
    assists: randomInt(0, 20),
    skill: randomInt(1, 3),
    leaver_status: randomChoice([0, 1, 2]),
    party_size: randomInt(1, 5),
    cluster: randomInt(100, 200),
    patch: randomInt(30, 40),
    region: randomInt(1, 20),
    isRadiant: isRadiant,
    win: radiant_win ? 1 : 0,
    lose: radiant_win ? 0 : 1,
    total_gold: randomInt(10000, 80000),
    total_xp: randomInt(10000, 80000),
    kills_per_min: randomFloat(0.1, 1.0),
    kda: randomFloat(0.5, 5.0),
    abandons: randomInt(0, 1),
    neutral_kills: randomInt(0, 50),
    tower_kills: randomInt(0, 5),
    courier_kills: randomInt(0, 3),
    lane_kills: randomInt(0, 20),
    hero_kills: randomInt(0, 25),
    observer_kills: randomInt(0, 10),
    sentry_kills: randomInt(0, 10),
    roshan_kills: randomInt(0, 3),
    necronomicon_kills: randomInt(0, 5),
    ancient_kills: randomInt(0, 1),
    buyback_count: randomInt(0, 2),
    observer_uses: randomInt(0, 10),
    sentry_uses: randomInt(0, 10),
    lane_efficiency: randomFloat(0.5, 1.0),
    lane_efficiency_pct: randomFloat(50, 100),
    lane: randomInt(1, 3),
    lane_role: randomInt(1, 4),
    is_roaming: randomChoice([true, false]),
    purchase_time: {},
    first_purchase_time: {},
    item_win: {},
    item_usage: {},
    purchase_tpscroll: {},
    actions_per_min: randomFloat(100, 300),
    life_state_dead: randomInt(0, 10),
    rank_tier: randomInt(70, 80),
    cosmetics: [],
    benchmarks: {},
    radiant_team_id,
    dire_team_id,
    radiant_name,
    dire_name,
    players,
    radiant_score,
    dire_score,
    picks_bans
  } as FakeOpenDotaMatch;
}

// Generate fake player heroes data
export function generateFakePlayerHeroes(accountId: number, count: number = 20): OpenDotaPlayerHeroes[] {
  // Use unique hero IDs to avoid duplicates
  const uniqueHeroIds = uniqueRandomSubset(Array.from({ length: 124 }, (_, i) => i + 1), count, count);
  
  return uniqueHeroIds.map(heroId => ({
    hero_id: heroId,
    last_played: randomTimestamp(),
    games: randomInt(1, 100),
    win: randomInt(0, 50),
    with_games: randomInt(0, 20),
    with_win: randomInt(0, 10),
    against_games: randomInt(0, 20),
    against_win: randomInt(0, 10)
  }));
}

// Generate fake player win/loss data
export function generateFakePlayerWL(accountId: number): OpenDotaPlayerWL {
  const totalGames = randomInt(100, 1000);
  const wins = randomInt(40, Math.floor(totalGames * 0.7));
  
  return {
    win: wins,
    lose: totalGames - wins
  };
}

// Generate fake player totals data
export function generateFakePlayerTotals(accountId: number): OpenDotaPlayerTotals[] {
  const fields = ['kills', 'deaths', 'assists', 'gold_per_min', 'xp_per_min', 'hero_damage', 'tower_damage', 'hero_healing'];
  
  return fields.map(field => ({
    field: field,
    n: randomInt(50, 200),
    sum: randomInt(1000, 10000)
  }));
}

// Generate fake player counts data
export function generateFakePlayerCounts(accountId: number): OpenDotaPlayerCounts[] {
  const fields = ['leaver_status', 'game_mode', 'lobby_type', 'lane_role', 'region', 'patch'];
  
  return fields.map(field => ({
    field: field,
    n: randomInt(10, 50),
    count: randomInt(1, 20)
  }));
}

// Generate fake team data
export function generateFakeTeam(teamId: string) {
  const name = randomChoice(TEAM_NAMES);
  const playerCount = randomInt(5, 8);
  
  // Use unique player names to avoid duplicates on the same team
  const uniquePlayerNames = uniqueRandomSubset(PLAYER_NAMES, playerCount, playerCount);
  
  return {
    team_id: parseInt(teamId),
    rating: randomFloat(1500, 2000),
    wins: randomInt(50, 200),
    losses: randomInt(20, 100),
    last_match_time: randomTimestamp(),
    name: name,
    tag: name.split(' ').map(word => word[0]).join('').toUpperCase(),
    logo_url: `https://example.com/logos/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    sponsor: randomChoice(['', 'Sponsor1', 'Sponsor2', 'Sponsor3']),
    country_code: randomChoice(['US', 'EU', 'CN', 'SEA', 'CIS']),
    url: `https://example.com/teams/${teamId}`,
    players: uniquePlayerNames.map((playerName, i) => ({
      account_id: randomInt(100000000, 999999999),
      name: playerName,
      games_played: randomInt(10, 100),
      wins: randomInt(5, 50)
    }))
  };
}

// Generate fake match details
export function generateFakeMatchDetails(matchId: number): FakeOpenDotaMatch {
  // Use the same logic as generateFakeMatch for consistency
  return generateFakeMatch(matchId);
}

// Generate fake Dotabuff team matches
export function generateFakeDotabuffMatches(teamId: string, seasonId: string) {
  const matchCount = randomInt(10, 50);
  
  return {
    matchIds: Array.from({ length: matchCount }, () => randomInt(1000000000, 9999999999).toString())
  };
}

// Generate fake meta insights
export function generateFakeMetaInsights() {
  // Use unique hero names for meta trends
  const uniqueHeroNames = uniqueRandomSubset(HERO_NAMES, 20, 20);
  
  return {
    week: randomInt(1, 52),
    year: new Date().getFullYear(),
    heroes: uniqueHeroNames.map((name, i) => ({
      hero_id: i + 1,
      name: name,
      pick_rate: randomFloat(0.05, 0.3),
      win_rate: randomFloat(0.4, 0.6),
      ban_rate: randomFloat(0, 0.2),
      total_picks: randomInt(100, 1000),
      total_wins: randomInt(50, 500)
    })),
    meta_trends: {
      most_picked: uniqueRandomSubset(HERO_NAMES, 5, 10),
      most_banned: uniqueRandomSubset(HERO_NAMES, 5, 10),
      highest_winrate: uniqueRandomSubset(HERO_NAMES, 5, 10),
      emerging_heroes: uniqueRandomSubset(HERO_NAMES, 3, 8)
    }
  };
}

// Main function to generate fake data based on endpoint
export function generateFakeData(endpoint: string, params?: any): any {
  const normalized = endpoint.toLowerCase();

  // Dotabuff team matches endpoint (returns HTML content for cheerio parsing)
  if (normalized.includes('dotabuff.com/esports/teams') && normalized.includes('matches')) {
    // Generate fake HTML content that cheerio can parse to extract match IDs
    const matchCount = 20;
    const matchIds = Array.from({ length: matchCount }, (_, i) => (9000000000 + i).toString());
    // Create HTML table rows with match links and league info
    const tableRows = matchIds.map(matchId => `
      <tr>
        <td>
          <a href="/esports/leagues/16435-rd2l-season-33">Rd2l Season 33</a>
        </td>
        <td>
          <a href="/matches/${matchId}">Match ${matchId}</a>
        </td>
        <td>Team A vs Team B</td>
        <td>${randomInt(20, 60)}:${randomInt(0, 59)}</td>
        <td>${randomChoice(['Radiant', 'Dire'])} Victory</td>
      </tr>
    `).join('');
    // Return full HTML page with table
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Team Matches - Dotabuff</title></head>
        <body>
          <table class="recent-esports-matches">
            <thead>
              <tr>
                <th>League</th>
                <th>Match</th>
                <th>Teams</th>
                <th>Duration</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="pagination">
            <a href="?page=1">1</a>
          </div>
        </body>
      </html>
    `;
  }

  // Return an array of fake heroes for the heroes endpoint
  if (normalized === 'heroes' || normalized.endsWith('/heroes')) {
    return generateFakeHeroes(124); // 124 is the current number of Dota 2 heroes
  }

  const service = endpoint.includes('api.opendota.com') ? 'opendota' : 
                  endpoint.includes('dotabuff.com') ? 'dotabuff' :
                  endpoint.includes('stratz.com') ? 'stratz' :
                  endpoint.includes('dota2protracker.com') ? 'd2pt' : 'unknown';
  logWithTimestamp('log', `[FAKE DATA] Generating fake data for ${service} endpoint: ${endpoint}`);

  // OpenDota endpoints
  if (service === 'opendota') {
    if (endpoint.includes('/players/') && endpoint.includes('/heroes')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayerHeroes(accountId);
    }
    if (endpoint.includes('/players/') && endpoint.includes('/wl')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayerWL(accountId);
    }
    if (endpoint.includes('/players/') && endpoint.includes('/totals')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayerTotals(accountId);
    }
    if (endpoint.includes('/players/') && endpoint.includes('/counts')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayerCounts(accountId);
    }
    if (endpoint.includes('/players/') && endpoint.includes('/recentMatches')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return Array.from({ length: 20 }, (_, i) => generateFakeMatch(randomInt(1000000000, 9999999999), i % 10));
    }
    if (endpoint.includes('/players/') && endpoint.includes('/matches')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return Array.from({ length: 100 }, (_, i) => generateFakeMatch(randomInt(1000000000, 9999999999), i % 10));
    }
    if (endpoint.includes('/matches/')) {
      const matchId = parseInt(endpoint.match(/\/matches\/(\d+)/)?.[1] || '1234567890');
      return generateFakeMatchDetails(matchId);
    }
    // Default player data
    if (endpoint.includes('/players/')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayer(accountId);
    }
  }

  // Handle unknown service endpoints that match OpenDota patterns
  if (service === 'unknown') {
    if (endpoint.includes('/players/') && endpoint.includes('/heroes')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayerHeroes(accountId);
    }
    if (endpoint.includes('/players/') && endpoint.includes('/recentMatches')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return Array.from({ length: 20 }, (_, i) => generateFakeMatch(randomInt(1000000000, 9999999999), i % 10));
    }
    if (endpoint.includes('/players/')) {
      const accountId = parseInt(endpoint.match(/\/players\/(\d+)/)?.[1] || '123456789');
      return generateFakePlayer(accountId);
    }
  }

  // Dotabuff endpoints
  if (service === 'dotabuff') {
    if (endpoint.includes('/teams/') && endpoint.includes('/matches')) {
      const teamId = endpoint.match(/\/teams\/(\d+)/)?.[1] || '123456';
      const seasonId = params?.season || 'current';
      return generateFakeDotabuffMatches(teamId, seasonId);
    }
  }

  // If service is unknown, throw an error
  if (service === 'unknown') {
    throw new Error(`[generateFakeData] Unknown service for endpoint: ${endpoint}`);
  }

  // Default fallback (should never be reached)
  logWithTimestamp('error', `[FAKE DATA] No matching handler for endpoint: ${endpoint}. Service: ${service}. This endpoint is not supported by the fake data generator.`);
  throw new Error(`[generateFakeData] No matching handler for endpoint: ${endpoint}. Service: ${service}`);
} 
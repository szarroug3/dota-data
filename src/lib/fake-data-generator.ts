// Fake data generator for mock API responses
import {
  OpenDotaHero,
  OpenDotaPlayer,
  OpenDotaPlayerCounts,
  OpenDotaPlayerHeroes,
  OpenDotaPlayerTotals,
  OpenDotaPlayerWL
} from '../types/opendota';
import { writeMockData } from './mock-data-writer';
import { FakeOpenDotaMatch } from './types/fake-data-generator-types';
import { getAccountIdForPlayerName, randomChoice, randomFloat, randomInt, randomTeamId, randomTeamName, randomTimestamp, TEAM_NAMES, uniqueRandomSubset } from './utils/fake-data-helpers';

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

const LEAGUE_NAMES = [
  "RD2L Season 33",
  "DPC WEU Tour 3",
  "The International 2024",
  "ESL One Summer",
  "DreamLeague Season 22",
  "BTS Pro Series 15",
  "OGA Dota PIT",
  "Epic League",
  "Asia Challenger League",
  "Americas Cup"
];

// Utility functions
// Use a fixed current team for mock data
const CURRENT_TEAM_ID = 9517508;
const CURRENT_TEAM_NAME = "Maple Syrup блинSummary";

// Helper: generate a fake player for a side
function generateFakePlayerForSide(name: string, heroId: number, player_slot: number): { account_id: number; name: string; hero_id: number; player_slot: number; kills: number; deaths: number; assists: number; gold_per_min: number; xp_per_min: number; last_hits: number; denies: number; level: number } {
  const account_id = getAccountIdForPlayerName(name);
  return {
    account_id,
    name,
    hero_id: heroId,
    player_slot,
    kills: randomInt(0, 25),
    deaths: randomInt(0, 15),
    assists: randomInt(0, 30),
    gold_per_min: randomInt(250, 900),
    xp_per_min: randomInt(300, 1200),
    last_hits: randomInt(20, 400),
    denies: randomInt(0, 30),
    level: randomInt(12, 30),
  };
}

// Helper: calculate team score
function calculateTeamScore(players: Array<{ kills: number }>): number {
  return players.reduce((sum, p) => sum + p.kills, 0);
}

// Helper: generate picks and bans
function generatePicksBans(heroIds: number[]): Array<{ is_pick: boolean; hero_id: number; team: number; order: number }> {
  return heroIds.map((heroId, i) => ({
    is_pick: i < 10,
    hero_id: heroId,
    team: i % 2,
    order: i
  }));
}

// Generate fake hero data
export function generateFakeHeroes(count: number = 50, filename: string): OpenDotaHero[] {
  const uniqueHeroNames = uniqueRandomSubset(HERO_NAMES, count, count);
  const data = uniqueHeroNames.map((name, i) => {
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
  writeMockData(filename, data, '/heroes');
  return data;
}

// Generate fake player data
export function generateFakePlayer(accountId: number, filename: string): OpenDotaPlayer {
  // Deterministically map accountId to a player name from PLAYER_NAMES
  const name = PLAYER_NAMES[Math.abs(accountId) % PLAYER_NAMES.length];
  const rankTier = randomInt(70, 80); // Divine to Immortal
  const data = {
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
    leaderboard_rank: rankTier >= 80 ? randomInt(1, 1000) : 0,
    solo_competitive_rank: randomInt(4000, 8000),
    competitive_rank: randomInt(4000, 8000),
    mmr_estimate: {
      estimate: randomInt(4000, 8000),
      stdDev: randomInt(100, 500),
      n: randomInt(10, 100)
    }
  };
  writeMockData(filename, data, `/players/${accountId}`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}`);
  return data;
}

// Generate fake match data
export function generateFakeMatch(matchId: number, filename: string, playerSlot?: number): FakeOpenDotaMatch {
  const isRadiant = Math.random() < 0.5;
  const radiant_team_id = isRadiant ? CURRENT_TEAM_ID : randomTeamId(CURRENT_TEAM_ID);
  const dire_team_id = isRadiant ? randomTeamId(CURRENT_TEAM_ID) : CURRENT_TEAM_ID;
  const radiant_name = isRadiant ? CURRENT_TEAM_NAME : randomTeamName(CURRENT_TEAM_NAME);
  const dire_name = isRadiant ? randomTeamName(CURRENT_TEAM_NAME) : CURRENT_TEAM_NAME;
  const allHeroIds = Array.from({ length: 124 }, (_, i) => i + 1);
  const playerHeroIds = uniqueRandomSubset(allHeroIds, 10, 10);
  const uniquePlayerNames = uniqueRandomSubset(PLAYER_NAMES, 10, 10);
  const radiantPlayers = Array.from({ length: 5 }, (_, i) => generateFakePlayerForSide(uniquePlayerNames[i], playerHeroIds[i], i));
  const direPlayers = Array.from({ length: 5 }, (_, i) => generateFakePlayerForSide(uniquePlayerNames[i + 5], playerHeroIds[i + 5], 128 + i));
  const players = [...radiantPlayers, ...direPlayers];
  const radiant_score = calculateTeamScore(radiantPlayers);
  const dire_score = calculateTeamScore(direPlayers);
  const radiant_win = radiant_score >= dire_score;
  const picksBansHeroIds = uniqueRandomSubset(allHeroIds, 20, 20);
  const picks_bans = generatePicksBans(picksBansHeroIds);
  const match = {
    match_id: matchId,
    player_slot: playerSlot ?? randomInt(0, 9),
    radiant_win,
    duration: randomInt(1200, 3600),
    game_mode: randomInt(1, 22),
    lobby_type: randomInt(0, 7),
    hero_id: playerHeroIds[0],
    hero_name: HERO_NAMES[(playerHeroIds[0] - 1) % HERO_NAMES.length],
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
  if (matchId === 9999999999) {
    // Add a new player to the Dire side
    const newPlayer = generateFakePlayerForSide('NewPlayerSim', 101, 132);
    direPlayers.push(newPlayer);
  }
  writeMockData(filename, match, `/matches/${matchId}`);
  return match;
}

// Generate fake player heroes data
export function generateFakePlayerHeroes(accountId: number, filename: string): OpenDotaPlayerHeroes[] {
  // Use unique hero IDs to avoid duplicates
  const uniqueHeroIds = uniqueRandomSubset(Array.from({ length: 124 }, (_, i) => i + 1), 20, 20);
  const data = uniqueHeroIds.map(heroId => ({
    hero_id: heroId,
    hero_name: HERO_NAMES[(heroId - 1) % HERO_NAMES.length],
    last_played: randomTimestamp(),
    games: randomInt(1, 100),
    win: randomInt(0, 50),
    with_games: randomInt(0, 20),
    with_win: randomInt(0, 10),
    against_games: randomInt(0, 20),
    against_win: randomInt(0, 10)
  }));
  writeMockData(filename, data, `/players/${accountId}/heroes`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/heroes`);
  return data;
}

// Generate fake player win/loss data
export function generateFakePlayerWL(accountId: number, filename: string): OpenDotaPlayerWL {
  const totalGames = randomInt(100, 1000);
  const wins = randomInt(40, Math.floor(totalGames * 0.7));
  const data = {
    win: wins,
    lose: totalGames - wins
  };
  writeMockData(filename, data, `/players/${accountId}/wl`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/wl`);
  return data;
}

// Generate fake player totals data
export function generateFakePlayerTotals(accountId: number, filename: string): OpenDotaPlayerTotals[] {
  const fields = ['kills', 'deaths', 'assists', 'gold_per_min', 'xp_per_min', 'hero_damage', 'tower_damage', 'hero_healing'];
  const data = fields.map(field => ({
    field: field,
    n: randomInt(50, 200),
    sum: randomInt(1000, 10000)
  }));
  writeMockData(filename, data, `/players/${accountId}/totals`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/totals`);
  return data;
}

// Generate fake player counts data
export function generateFakePlayerCounts(accountId: number, filename: string): OpenDotaPlayerCounts[] {
  const fields = ['leaver_status', 'game_mode', 'lobby_type', 'lane_role', 'region', 'patch'];
  const data = fields.map(field => ({
    field: field,
    n: randomInt(10, 50),
    count: randomInt(1, 20)
  }));
  writeMockData(filename, data, `/players/${accountId}/counts`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/counts`);
  return data;
}

// Generate fake match details
export function generateFakeMatchDetails(matchId: number, filename: string): FakeOpenDotaMatch {
  const match = generateFakeMatch(matchId, filename);
  // Already written in generateFakeMatch
  return match;
}

// Add specific functions for each endpoint

export function generateFakePlayerData(accountId: number, filename: string) {
  const data = generateFakePlayer(accountId, filename);
  writeMockData(filename, data, `/players/${accountId}`);
  return data;
}

export function generateFakePlayerWLData(accountId: number, filename: string) {
  const data = generateFakePlayerWL(accountId, filename);
  writeMockData(filename, data, `/players/${accountId}/wl`);
  return data;
}

export function generateFakePlayerTotalsData(accountId: number, filename: string) {
  const data = generateFakePlayerTotals(accountId, filename);
  writeMockData(filename, data, `/players/${accountId}/totals`);
  return data;
}

export function generateFakePlayerCountsData(accountId: number, filename: string) {
  const data = generateFakePlayerCounts(accountId, filename);
  writeMockData(filename, data, `/players/${accountId}/counts`);
  return data;
}

export function generateFakePlayerHeroesData(accountId: number, filename: string) {
  const data = generateFakePlayerHeroes(accountId, filename);
  writeMockData(filename, data, `/players/${accountId}/heroes`);
  return data;
}

export function generateFakePlayerRecentMatches(accountId: number, filename: string): FakeOpenDotaMatch[] {
  const data = Array.from({ length: 20 }, (_, i) => generateFakeMatch(9000000000 + i, filename, i % 10));
  writeMockData(filename, data, `/players/${accountId}/recentMatches`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/recentMatches`);
  return data;
}

export function generateFakePlayerMatches(accountId: number, filename: string): FakeOpenDotaMatch[] {
  const data = Array.from({ length: 100 }, (_, i) => generateFakeMatch(9000000000 + i, filename, i % 10));
  writeMockData(filename, data, `/players/${accountId}/matches`);
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/matches`);
  return data;
}

// Generate fake team data (for Dotabuff/teams API)
export function generateFakeTeam(teamId: string, filename: string) {
  const idNum = Math.abs(parseInt(teamId, 10)) || 0;
  const name = TEAM_NAMES[idNum % TEAM_NAMES.length];
  const playerCount = randomInt(5, 8);
  const uniquePlayerNames = uniqueRandomSubset(PLAYER_NAMES, playerCount, playerCount);
  const data = {
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
    players: uniquePlayerNames.map((playerName) => ({
      account_id: getAccountIdForPlayerName(playerName),
      name: playerName,
      games_played: randomInt(10, 100),
      wins: randomInt(5, 50)
    }))
  };
  writeMockData(filename, data, `/teams/${teamId}`);
  return data;
}

// Generate fake Dotabuff team matches (JSON, for /teams/:id/matches)
export function generateFakeDotabuffMatches(teamId: string, seasonId: string, filename: string) {
  const matches = Array.from({ length: 10 }, (_, i) => ({
    match_id: randomInt(1000000000, 2000000000),
    team_id: teamId,
    season_id: seasonId,
    index: i
  }));
  writeMockData(filename, matches, '/teams/[id]/matches');
  return matches;
}

// Generate fake Dotabuff league HTML (for /leagues/:id)
export function generateFakeDotabuffLeagueHtml(leagueId: string, filename: string) {
  // filename should be .html for mock HTML
  // Use a deterministic fake league name from the LEAGUE_NAMES array
  const leagueNames = LEAGUE_NAMES;
  const idNum = Math.abs(parseInt(leagueId, 10)) || 0;
  const fakeLeagueName = leagueNames[idNum % leagueNames.length];
  let html = `
    <html><body>
      <img class="img-league img-avatar" alt="${fakeLeagueName}" src="/fake-league.png" />
      <table>
  `;
  for (let index = 0; index < 10; index++) {
    html += `<tr><td>Match ${index}</td></tr>`;
  }
  html += '</table></body></html>';
  writeMockData(filename, html, '/leagues/[id]');
  return html;
}

// Generate fake Dotabuff team matches HTML (for /teams/:id/matches?page=)
export function generateFakeDotabuffTeamMatchesHtml(teamId: string, pageNum: number, filename: string) {
  // Fake team name for the img alt
  const idNum = Math.abs(parseInt(teamId, 10)) || 0;
  const teamName = TEAM_NAMES[idNum % TEAM_NAMES.length];
  const matchesPerPage = 10;
  const totalPages = 3;
  const matchStart = (pageNum - 1) * matchesPerPage;
  let html = `<html><body>`;
  html += `<img class="img-team img-avatar" alt="${teamName}" src="/fake-team.png" />`;
  html += '<table>';
  for (let i = 0; i < matchesPerPage; i++) {
    const matchId = 8000000000 + matchStart + i;
    html += `<tr><td><a href="/matches/${matchId}">Team Match ${matchId}</a></td></tr>`;
  }
  // Add a new match for refresh simulation
  if (pageNum === 1) {
    html += `<tr><td><a href="/matches/9999999999">Team Match 9999999999</a></td></tr>`;
  }
  html += '</table>';
  // Add pagination if more than one page
  if (totalPages > 1) {
    html += '<span class="last"><a href="?page=' + totalPages + '">' + totalPages + '</a></span>';
  }
  html += '</body></html>';
  writeMockData(filename, html, '/teams/[id]/matches');
  return html;
}

// Generate fake PlayerStats (for /players/:id/stats)
export function generateFakePlayerStats(accountId: number, filename: string) {
  // Deterministically map accountId to a player name from PLAYER_NAMES
  const name = PLAYER_NAMES[Math.abs(accountId) % PLAYER_NAMES.length];
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
    { metric: "Win Rate", value: winRate, trend: "+2%", direction: "up" },
    { metric: "Avg KDA", value: avgKDA, trend: "+0.1", direction: "up" },
    { metric: "Avg GPM", value: avgGPM, trend: "+5", direction: "up" },
    { metric: "Game Impact", value: "Medium", trend: "Improving", direction: "up" }
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
  writeMockData(`cache-${filename}`, data, `/players/${accountId}/stats`);
  return data;
} 
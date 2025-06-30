// API utilities for OpenDota and other data sources
import { CACHE_CONFIGS, cacheService } from './cache-service';
import { generateMockFilename, readMockData } from './mock-data-writer';
import { logWithTimestamp } from './utils';

const OPENDOTA_BASE_URL = "https://api.opendota.com/api";

// Generic fetch function for internal API endpoints
export async function fetchData<T>(endpoint: string): Promise<T> {
  const mock = await tryMockApi(endpoint);
  if (mock) return mock.json();
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

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

// Generic API fetch function with error handling
async function fetchFromAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    logWithTimestamp('error', `Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

// Player data functions
export async function getPlayerData(
  accountId: number,
): Promise<OpenDotaPlayer> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayer>(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached player data for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayer>(endpoint);
  
  // Cache the result
  await cacheService.set("player-data", data, accountId, undefined, CACHE_CONFIGS.PLAYER_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached player data for ${accountId}`);
  
  return data;
}

export async function getPlayerWL(
  accountId: number,
): Promise<OpenDotaPlayerWL> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/wl`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayerWL>(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached WL data for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayerWL>(endpoint);
  
  // Cache the result
  await cacheService.set("player-wl", data, accountId, undefined, CACHE_CONFIGS.PLAYER_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached WL data for ${accountId}`);
  
  return data;
}

export async function getPlayerTotals(
  accountId: number,
): Promise<OpenDotaPlayerTotals[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/totals`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayerTotals[]>(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached totals data for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayerTotals[]>(endpoint);
  
  // Cache the result
  await cacheService.set("player-totals", data, accountId, undefined, CACHE_CONFIGS.PLAYER_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached totals data for ${accountId}`);
  
  return data;
}

export async function getPlayerCounts(
  accountId: number,
): Promise<OpenDotaPlayerCounts[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/counts`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayerCounts[]>(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached counts data for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayerCounts[]>(endpoint);
  
  // Cache the result
  await cacheService.set("player-counts", data, accountId, undefined, CACHE_CONFIGS.PLAYER_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached counts data for ${accountId}`);
  
  return data;
}

export async function getPlayerHeroes(
  accountId: number,
): Promise<OpenDotaPlayerHeroes[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/heroes`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayerHeroes[]>(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached heroes data for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayerHeroes[]>(endpoint);
  
  // Cache the result
  await cacheService.set("player-heroes", data, accountId, undefined, CACHE_CONFIGS.PLAYER_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached heroes data for ${accountId}`);
  
  return data;
}

export async function getPlayerRecentMatches(
  accountId: number,
  limit: number = 20,
): Promise<OpenDotaPlayerRecentMatches[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/recentMatches`;
  const params = { limit };
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaPlayerRecentMatches[]>("player-recent-matches", accountId);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached recent matches for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaPlayerRecentMatches[]>(endpoint);
  
  // Cache the result
  await cacheService.set("player-recent-matches", data, accountId, undefined, CACHE_CONFIGS.PLAYER_MATCHES.ttl);
  logWithTimestamp('log', `[Cache] Cached recent matches for ${accountId}`);
  
  return data;
}

export async function getPlayerMatches(
  accountId: number,
  limit: number = 100,
): Promise<OpenDotaMatch[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/players/${accountId}/matches`;
  const params = { limit };
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaMatch[]>("player-matches", accountId);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached matches for ${accountId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaMatch[]>(endpoint);
  
  // Cache the result
  await cacheService.set("player-matches", data, accountId, undefined, CACHE_CONFIGS.PLAYER_MATCHES.ttl);
  logWithTimestamp('log', `[Cache] Cached matches for ${accountId}`);
  
  return data;
}

// Hero data functions
export async function getHeroes(): Promise<OpenDotaHero[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/heroes`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaHero[]>("heroes");
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached heroes data`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaHero[]>(endpoint);
  
  // Cache the result with no expiration (Infinity TTL)
  await cacheService.set("heroes", data, undefined, undefined, CACHE_CONFIGS.HEROES.ttl);
  logWithTimestamp('log', `[Cache] Cached heroes data`);
  
  return data;
}

// Function to check if a hero is recognized and refresh heroes if needed
export async function ensureHeroRecognized(heroId: number): Promise<boolean> {
  const heroes = await getHeroes();
  const hero = heroes.find(h => h.id === heroId);
  
  if (!hero) {
    logWithTimestamp('log', `[Cache] Hero ${heroId} not recognized, refreshing heroes data`);
    // Invalidate heroes cache to force refresh
    await cacheService.invalidate("heroes");
    return false;
  }
  
  return true;
}

export async function getHeroStats(): Promise<OpenDotaHero[]> {
  const endpoint = `${OPENDOTA_BASE_URL}/heroes/stats`;
  
  // Try to get from cache first
  const cached = await cacheService.get<OpenDotaHero[]>("hero-stats");
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached hero stats`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit<OpenDotaHero[]>(endpoint);
  
  // Cache the result with no expiration (Infinity TTL)
  await cacheService.set("hero-stats", data, undefined, undefined, CACHE_CONFIGS.HEROES.ttl);
  logWithTimestamp('log', `[Cache] Cached hero stats`);
  
  return data;
}

// Match data functions
export async function getMatch(matchId: number): Promise<unknown> {
  const endpoint = `${OPENDOTA_BASE_URL}/matches/${matchId}`;
  
  // Try to get from cache first
  const cached = await cacheService.get<unknown>("match", matchId);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached match data for ${matchId}`);
    return cached;
  }

  // Use queue system for fetching
  const data = await cacheService.queueRequest('opendota', async () => {
    logWithTimestamp('log', `[Queue] Fetching match data for ${matchId}`);
    const response = await fetch(endpoint);
    
    if (response.status === 429) {
      await cacheService.recordRateLimitHit('opendota');
      throw new Error('Rate limit exceeded for OpenDota');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
  
  // Cache the result with no expiration (Infinity TTL)
  await cacheService.set("match", data, matchId, undefined, CACHE_CONFIGS.MATCH_DETAILS.ttl);
  logWithTimestamp('log', `[Cache] Cached match data for ${matchId}`);
  
  return data;
}

// Function to force refresh match details (for parsing or explicit requests)
export async function refreshMatchDetails(matchId: number): Promise<unknown> {
  const endpoint = `${OPENDOTA_BASE_URL}/matches/${matchId}`;
  
  // Invalidate cache to force refresh
  await cacheService.invalidate("match", matchId);
  
  // Use queue system for fetching fresh data
  const data = await cacheService.queueRequest('opendota', async () => {
    logWithTimestamp('log', `[Queue] Force refreshing match data for ${matchId}`);
    const response = await fetch(endpoint);
    
    if (response.status === 429) {
      await cacheService.recordRateLimitHit('opendota');
      throw new Error('Rate limit exceeded for OpenDota');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
  
  // Cache the result with no expiration
  await cacheService.set("match", data, matchId, undefined, CACHE_CONFIGS.MATCH_DETAILS.ttl);
  logWithTimestamp('log', `[Cache] Refreshed and cached match data for ${matchId}`);
  
  return data;
}

// Pro matches and meta data
export async function getProMatches(limit: number = 100): Promise<unknown[]> {
  return fetchFromAPI<unknown[]>(`/proMatches?limit=${limit}`);
}

export async function getPublicMatches(
  limit: number = 100,
): Promise<unknown[]> {
  return fetchFromAPI<unknown[]>(`/publicMatches?limit=${limit}`);
}

// Utility functions for data transformation
export function calculateWinRate(wins: number, total: number): number {
  return total > 0 ? (wins / total) * 100 : 0;
}

export function calculateKDA(
  kills: number,
  deaths: number,
  assists: number,
): number {
  return deaths > 0 ? (kills + assists) / deaths : kills + assists;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getRankTierInfo(rankTier: number): {
  rank: string;
  stars: number;
  image: string;
} {
  if (rankTier === 0)
    return { rank: "Uncalibrated", stars: 0, image: "/ranks/uncalibrated.png" };

  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;

  const rankNames = [
    "Herald",
    "Guardian",
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];

  const rank = rankNames[tier - 1] || "Unknown";
  const image = `/ranks/${rank.toLowerCase()}.png`;

  return { rank, stars, image };
}

// Rate limiting utility
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();

// Enhanced fetch function with rate limiting
export async function fetchWithRateLimit<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const mock = await tryMockApi(endpoint);
  if (mock) return mock.json();
  await rateLimiter.waitForSlot();
  return fetchFromAPI<T>(endpoint, options);
}

export async function fetchOpenDotaTeam(teamId: string) {
  const endpoint = `https://api.opendota.com/api/teams/${teamId}`;
  
  // Try to get from cache first
  const cached = await cacheService.get(endpoint);
  if (cached) {
    logWithTimestamp('log', `[Cache] Using cached team data for ${teamId}`);
    return cached;
  }

  // Fetch from API with rate limiting
  await rateLimiter.waitForSlot();
  const data = await fetchWithRateLimit(endpoint);
  
  // Cache the result with 1-day TTL
  await cacheService.set("team", data, teamId, undefined, CACHE_CONFIGS.TEAM_DATA.ttl);
  logWithTimestamp('log', `[Cache] Cached team data for ${teamId}`);
  
  return data;
}

// Parse Dotabuff team URL and fetch team info via the Next.js API route
export async function importTeamFromDotabuff(url: string) {
  const res = await fetch("/api/import-dotabuff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to import from Dotabuff");
  return res.json();
}

// Fetch and parse matches for a team from a Dotabuff league page
export async function fetchAndParseTeamMatches(
  team: { id: string; name: string },
  leagueUrl: string,
) {
  const res = await fetch("/api/import-dotabuff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team, leagueUrl }),
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function fetchDotabuffTeamMatches(
  teamId: string,
  seasonId: string,
): Promise<{ matchIds: string[] }> {
  const res = await fetch(
    `/api/teams/${teamId}/import-dotabuff-matches?season=${seasonId}`,
  );
  if (!res.ok) throw new Error("Failed to fetch Dotabuff matches");
  return res.json();
}

// Rate-limited fetch functions
export async function rateLimitedFetch(url: string, service: 'opendota' | 'dotabuff' | 'default', options?: RequestInit): Promise<Response> {
  // Use queue system for rate-limited requests
  return cacheService.queueRequest(service, async () => {
    logWithTimestamp('log', `[${service.toUpperCase()}] Making request to: ${url}`);
    
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      logWithTimestamp('error', `[${service.toUpperCase()}] RATE LIMIT HIT!`, {
        url,
        status: response.status,
        statusText: response.statusText,
        retryAfter,
        rateLimitRemaining,
        rateLimitReset,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Parse retry-after value (could be seconds or HTTP date)
      let retryAfterSeconds: number | undefined;
      if (retryAfter) {
        const retryAfterNum = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterNum)) {
          // If it's a number, it's seconds
          retryAfterSeconds = retryAfterNum;
        } else {
          // If it's a date string, calculate seconds until that time
          const retryDate = new Date(retryAfter);
          if (!isNaN(retryDate.getTime())) {
            retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
          }
        }
      }
      
      await cacheService.recordRateLimitHit(service, retryAfterSeconds);
      throw new Error(`Rate limit exceeded for ${service}`);
    }
    
    if (!response.ok) {
      logWithTimestamp('error', `[${service.toUpperCase()}] Request failed:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    logWithTimestamp('log', `[${service.toUpperCase()}] Request successful: ${url}`);
    return response;
  });
}

// Queue-aware fetch functions for specific services
export async function fetchOpenDota(endpoint: string, options?: RequestInit, bypassQueue: boolean = false): Promise<Response> {
  const service = 'opendota';
  logWithTimestamp('log', `[fetchOpenDota] Called with endpoint: ${endpoint}, options:`, options, `bypassQueue: ${bypassQueue}`);
  
  // If bypassQueue is true, execute directly without queuing
  if (bypassQueue) {
    logWithTimestamp('log', `[fetchOpenDota] Bypassing queue for endpoint: ${endpoint}`);
    const mock = await tryMockApi(endpoint);
    if (mock) {
      logWithTimestamp('log', `[fetchOpenDota] Returning mock data for endpoint: ${endpoint}`);
      return mock;
    }
    logWithTimestamp('log', `[fetchOpenDota] Making real request to: ${endpoint}`);
    const response = await fetch(endpoint, options);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      logWithTimestamp('error', `[OPENDOTA] RATE LIMIT HIT!`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        retryAfter,
        rateLimitRemaining,
        rateLimitReset,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Parse retry-after value (could be seconds or HTTP date)
      let retryAfterSeconds: number | undefined;
      if (retryAfter) {
        const retryAfterNum = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterNum)) {
          // If it's a number, it's seconds
          retryAfterSeconds = retryAfterNum;
        } else {
          // If it's a date string, calculate seconds until that time
          const retryDate = new Date(retryAfter);
          if (!isNaN(retryDate.getTime())) {
            retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
          }
        }
      }
      
      await cacheService.recordRateLimitHit(service, retryAfterSeconds);
      throw new Error(`Rate limit exceeded for ${service}`);
    }
    
    if (!response.ok) {
      logWithTimestamp('error', `[OPENDOTA] Request failed:`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    logWithTimestamp('log', `[fetchOpenDota] Real request successful for endpoint: ${endpoint}`);
    return response;
  }
  
  // Use queue system for all requests (including mock data)
  return cacheService.queueRequest(service, async () => {
    const mock = await tryMockApi(endpoint);
    if (mock) {
      logWithTimestamp('log', `[fetchOpenDota] Returning mock data for endpoint: ${endpoint}`);
      return mock;
    }
    logWithTimestamp('log', `[fetchOpenDota] Making real request to: ${endpoint}`);
    const response = await fetch(endpoint, options);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      logWithTimestamp('error', `[OPENDOTA] RATE LIMIT HIT!`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        retryAfter,
        rateLimitRemaining,
        rateLimitReset,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Parse retry-after value (could be seconds or HTTP date)
      let retryAfterSeconds: number | undefined;
      if (retryAfter) {
        const retryAfterNum = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterNum)) {
          // If it's a number, it's seconds
          retryAfterSeconds = retryAfterNum;
        } else {
          // If it's a date string, calculate seconds until that time
          const retryDate = new Date(retryAfter);
          if (!isNaN(retryDate.getTime())) {
            retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
          }
        }
      }
      
      await cacheService.recordRateLimitHit(service, retryAfterSeconds);
      throw new Error(`Rate limit exceeded for ${service}`);
    }
    
    if (!response.ok) {
      logWithTimestamp('error', `[OPENDOTA] Request failed:`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    logWithTimestamp('log', `[fetchOpenDota] Real request successful for endpoint: ${endpoint}`);
    return response;
  });
}

export async function fetchDotabuff(url: string, options?: RequestInit): Promise<Response> {
  const service = 'dotabuff';
  
  // Use queue system for all requests (including mock data)
  return cacheService.queueRequest(service, async () => {
    const mock = await tryMockApi(url);
    if (mock) {
      logWithTimestamp('log', `[MOCK ${service.toUpperCase()}] Returning mock data for ${url}`);
      return mock;
    }
    
    logWithTimestamp('log', `[${service.toUpperCase()}] Making request to: ${url}`);
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      logWithTimestamp('error', `[${service.toUpperCase()}] RATE LIMIT HIT!`, {
        url,
        status: response.status,
        statusText: response.statusText,
        retryAfter,
        rateLimitRemaining,
        rateLimitReset,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Parse retry-after value (could be seconds or HTTP date)
      let retryAfterSeconds: number | undefined;
      if (retryAfter) {
        const retryAfterNum = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterNum)) {
          // If it's a number, it's seconds
          retryAfterSeconds = retryAfterNum;
        } else {
          // If it's a date string, calculate seconds until that time
          const retryDate = new Date(retryAfter);
          if (!isNaN(retryDate.getTime())) {
            retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
          }
        }
      }
      
      await cacheService.recordRateLimitHit(service, retryAfterSeconds);
      throw new Error(`Rate limit exceeded for ${service}`);
    }
    
    if (!response.ok) {
      logWithTimestamp('error', `[${service.toUpperCase()}] Request failed:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    logWithTimestamp('log', `[${service.toUpperCase()}] Request successful: ${url}`);
    return response;
  });
}

// Get rate limit statistics
export function getRateLimitStats() {
  return cacheService.getRateLimitStats();
}

export function getQueueStats() {
  return cacheService.getQueueStats();
}

// Get queue statistics from API endpoint
export async function getQueueStatsFromAPI() {
  try {
    logWithTimestamp('log', '[getQueueStatsFromAPI] Making request to /api/cache?action=queue-stats');
    const response = await fetch('/api/cache?action=queue-stats');
    logWithTimestamp('log', '[getQueueStatsFromAPI] Response status:', response.status);
    logWithTimestamp('log', '[getQueueStatsFromAPI] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      logWithTimestamp('error', '[getQueueStatsFromAPI] Response not ok, error text:', errorText);
      throw new Error(`Failed to fetch queue stats: ${response.status}`);
    }
    
    const data = await response.json();
    logWithTimestamp('log', '[getQueueStatsFromAPI] Response data:', data);
    return data;
  } catch (error) {
    logWithTimestamp('error', '[getQueueStatsFromAPI] Error fetching queue stats:', error);
    return { queueStats: {}, rateLimitStats: {} };
  }
}

export function getDebugInfo() {
  const stats = cacheService.getStats();
  const queueStats = cacheService.getQueueStats();
  const activeSignatures = cacheService.getActiveSignatures();
  
  return {
    rateLimits: stats,
    queueStats,
    activeSignatures,
    summary: Object.entries(stats).map(([service, data]) => ({
      service,
      currentRequests: data.current,
      limit: data.limit,
      queueLength: data.queueLength,
      processing: data.processing,
      backoffMs: data.backoffMs,
      utilization: `${data.current}/${data.limit} (${Math.round((data.current / data.limit) * 100)}%)`
    }))
  };
}

// Helper function to determine which service an endpoint belongs to
function getServiceFromEndpoint(endpoint: string): 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'unknown' {
  if (endpoint.includes('api.opendota.com')) return 'opendota';
  if (endpoint.includes('dotabuff.com')) return 'dotabuff';
  if (endpoint.includes('stratz.com')) return 'stratz';
  if (endpoint.includes('dota2protracker.com')) return 'd2pt';
  return 'unknown';
}

// Check if a specific service should be mocked
function shouldMockService(service: 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'unknown'): boolean {
  switch (service) {
    case 'opendota':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_OPENDOTA === 'true';
    case 'dotabuff':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_DOTABUFF === 'true';
    case 'stratz':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_STRATZ === 'true';
    case 'd2pt':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_D2PT === 'true';
    case 'unknown':
    default:
      return process.env.USE_MOCK_API === 'true';
  }
}

async function tryMockApi(endpoint: string): Promise<Response | null> {
  logWithTimestamp('log', `[tryMockApi] Starting for endpoint: ${endpoint}`);
  const service = getServiceFromEndpoint(endpoint);
  logWithTimestamp('log', `[tryMockApi] Detected service: ${service}`);
  
  if (shouldMockService(service)) {
    logWithTimestamp('log', `[tryMockApi] Service ${service} should be mocked`);
    const filename = generateMockFilename(endpoint);
    logWithTimestamp('log', `[tryMockApi] Generated filename: ${filename}`);
    
    logWithTimestamp('log', `[tryMockApi] Reading mock data...`);
    const mockData = await readMockData(filename, endpoint);
    logWithTimestamp('log', `[tryMockApi] Mock data result:`, mockData ? 'found' : 'not found');
    
    if (mockData) {
      logWithTimestamp('log', `[MOCK ${service.toUpperCase()}] Returning mock data for ${endpoint} from file: ${filename}`);
      
      // For Dotabuff endpoints that return HTML content, return as text/html
      if (service === 'dotabuff' && endpoint.includes('/matches')) {
        logWithTimestamp('log', `[tryMockApi] Returning HTML mock data for Dotabuff matches endpoint`);
        return new Response(mockData, {
          status: 200,
          headers: { 'Content-Type': 'text/html', 'X-Mock-Data': 'true', 'X-Mock-Service': service },
        });
      }
      
      // For all other endpoints, return as JSON
      logWithTimestamp('log', `[tryMockApi] Returning JSON mock data for endpoint: ${endpoint}`);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Mock-Data': 'true', 'X-Mock-Service': service },
      });
    } else {
      logWithTimestamp('warn', `[MOCK ${service.toUpperCase()}] Mock data not found for ${endpoint}. Tried file: ${filename}`);
      return new Response(JSON.stringify({ error: 'Mock data not found', filename, service }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'X-Mock-Data': 'true', 'X-Mock-Service': service },
      });
    }
  }
  
  logWithTimestamp('log', `[tryMockApi] Service ${service} not mocked, returning null`);
  return null;
}

// Client-side function to enrich match data via server-side API
export async function enrichMatchViaAPI(matchId: string, team: any): Promise<any> {
  const response = await fetch(`/api/matches/${matchId}/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ team }),
  });

  if (!response.ok) {
    throw new Error(`Failed to enrich match: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Client-side function to batch enrich matches via server-side API
export async function enrichMatchesBatchViaAPI(
  matches: any[],
  team: any,
  onProgress?: (completed: number, total: number) => void
): Promise<any[]> {
  logWithTimestamp('log', `[enrichMatchesBatchViaAPI] Starting batch enrichment for ${matches.length} matches`);
  
  const enrichedMatches = [];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    try {
      logWithTimestamp('log', `[enrichMatchesBatchViaAPI] Processing match ${i + 1}/${matches.length}: ${match.id}`);
      const enriched = await enrichMatchViaAPI(match.id, team);
      enrichedMatches.push(enriched);
      onProgress?.(i + 1, matches.length);
    } catch (error) {
      logWithTimestamp('error', `[enrichMatchesBatchViaAPI] Failed to enrich match ${match.id}:`, error);
      enrichedMatches.push(match); // Return original match if enrichment fails
      onProgress?.(i + 1, matches.length);
    }
  }
  
  logWithTimestamp('log', `[enrichMatchesBatchViaAPI] Completed batch enrichment for ${matches.length} matches`);
  return enrichedMatches;
}

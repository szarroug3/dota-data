import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { CacheValue } from '@/types/cache';
import {
    OpenDotaPlayerCounts,
    OpenDotaPlayerHero,
    OpenDotaPlayerTotals,
    OpenDotaPlayerWL
} from '@/types/external-apis';

import { RateLimiter } from '@/lib/rate-limiter';

/**
 * Fetches a Dota 2 player's heroes from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_heroes
 *
 * @param playerId The player/account ID to fetch heroes for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Array of OpenDotaPlayerHero objects
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerHeroes(playerId: string, force = false): Promise<OpenDotaPlayerHero[]> {
  const cacheKey = `opendota:player-heroes:${playerId}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours
  const cache = new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
  const rateLimiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  if (process.env.USE_MOCK_API === 'true') {
    return loadMockPlayerHeroes(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerHeroes(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const heroes = await fetchPlayerHeroesFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(heroes), cacheTTL);
  return heroes;
}

/**
 * Fetches a Dota 2 player's counts from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_counts
 *
 * @param playerId The player/account ID to fetch counts for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaPlayerCounts object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerCounts(playerId: string, force = false): Promise<OpenDotaPlayerCounts> {
  const cacheKey = `opendota:player-counts:${playerId}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours
  const cache = new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
  const rateLimiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  if (process.env.USE_MOCK_API === 'true') {
    return loadMockPlayerCounts(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerCounts(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const counts = await fetchPlayerCountsFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(counts), cacheTTL);
  return counts;
}

/**
 * Fetches a Dota 2 player's totals from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_totals
 *
 * @param playerId The player/account ID to fetch totals for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaPlayerTotals object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerTotals(playerId: string, force = false): Promise<OpenDotaPlayerTotals> {
  const cacheKey = `opendota:player-totals:${playerId}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours
  const cache = new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
  const rateLimiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  if (process.env.USE_MOCK_API === 'true') {
    return loadMockPlayerTotals(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerTotals(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const totals = await fetchPlayerTotalsFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(totals), cacheTTL);
  return totals;
}

/**
 * Fetches a Dota 2 player's win/loss record from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_wl
 *
 * @param playerId The player/account ID to fetch win/loss for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaPlayerWL object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerWL(playerId: string, force = false): Promise<OpenDotaPlayerWL> {
  const cacheKey = `opendota:player-wl:${playerId}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours
  const cache = new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
  const rateLimiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  if (process.env.USE_MOCK_API === 'true') {
    return loadMockPlayerWL(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerWL(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const wl = await fetchPlayerWLFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(wl), cacheTTL);
  return wl;
}

// Helper functions for player heroes
async function loadMockPlayerHeroes(playerId: string): Promise<OpenDotaPlayerHero[]> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-heroes-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerHero[];
  } catch (err) {
    throw new Error(`Failed to load OpenDota player heroes ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerHeroes(cached: CacheValue): OpenDotaPlayerHero[] | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as OpenDotaPlayerHero[];
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerHeroesFromApi(playerId: string): Promise<OpenDotaPlayerHero[]> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/heroes`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player heroes ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player heroes response: ${err}`);
  }
}

// Helper functions for player counts
async function loadMockPlayerCounts(playerId: string): Promise<OpenDotaPlayerCounts> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-counts-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerCounts;
  } catch (err) {
    throw new Error(`Failed to load OpenDota player counts ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerCounts(cached: CacheValue): OpenDotaPlayerCounts | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as OpenDotaPlayerCounts;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerCountsFromApi(playerId: string): Promise<OpenDotaPlayerCounts> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/counts`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player counts ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player counts response: ${err}`);
  }
}

// Helper functions for player totals
async function loadMockPlayerTotals(playerId: string): Promise<OpenDotaPlayerTotals> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-totals-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerTotals;
  } catch (err) {
    throw new Error(`Failed to load OpenDota player totals ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerTotals(cached: CacheValue): OpenDotaPlayerTotals | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as OpenDotaPlayerTotals;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerTotalsFromApi(playerId: string): Promise<OpenDotaPlayerTotals> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/totals`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player totals ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player totals response: ${err}`);
  }
}

// Helper functions for player W/L
async function loadMockPlayerWL(playerId: string): Promise<OpenDotaPlayerWL> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-wl-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerWL;
  } catch (err) {
    throw new Error(`Failed to load OpenDota player W/L ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerWL(cached: CacheValue): OpenDotaPlayerWL | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as OpenDotaPlayerWL;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerWLFromApi(playerId: string): Promise<OpenDotaPlayerWL> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/wl`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player W/L ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player W/L response: ${err}`);
  }
}

async function ensureNotRateLimited(rateLimiter: RateLimiter): Promise<void> {
  const rateResult = await rateLimiter.checkServiceLimit('opendota', 'players');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by OpenDota API');
  }
} 
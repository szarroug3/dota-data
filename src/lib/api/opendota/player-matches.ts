import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { CacheValue } from '@/types/cache';
import { OpenDotaPlayerMatch, OpenDotaPlayerRecentMatches } from '@/types/external-apis';

import { RateLimiter } from '@/lib/rate-limiter';

/**
 * Fetches a Dota 2 player's matches from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_matches
 *
 * @param playerId The player/account ID to fetch matches for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Array of OpenDotaPlayerMatch objects
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerMatches(playerId: string, force = false): Promise<OpenDotaPlayerMatch[]> {
  const cacheKey = `opendota:player-matches:${playerId}`;
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
    return loadMockPlayerMatches(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerMatches(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const matches = await fetchPlayerMatchesFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(matches), cacheTTL);
  return matches;
}

/**
 * Fetches a Dota 2 player's recent matches from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id_recentMatches
 *
 * @param playerId The player/account ID to fetch recent matches for
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Array of OpenDotaPlayerRecentMatches objects
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayerRecentMatches(playerId: string, force = false): Promise<OpenDotaPlayerRecentMatches[]> {
  const cacheKey = `opendota:player-recent-matches:${playerId}`;
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
    return loadMockPlayerRecentMatches(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayerRecentMatches(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const recentMatches = await fetchPlayerRecentMatchesFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(recentMatches), cacheTTL);
  return recentMatches;
}

// Helper functions for player matches
async function loadMockPlayerMatches(playerId: string): Promise<OpenDotaPlayerMatch[]> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-matches-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerMatch[];
  } catch (err) {
    throw new Error(`Failed to load OpenDota player matches ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerMatches(cached: CacheValue): OpenDotaPlayerMatch[] | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as OpenDotaPlayerMatch[];
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerMatchesFromApi(playerId: string): Promise<OpenDotaPlayerMatch[]> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/matches`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player matches ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player matches response: ${err}`);
  }
}

// Helper functions for player recent matches
async function loadMockPlayerRecentMatches(playerId: string): Promise<OpenDotaPlayerRecentMatches[]> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-recent-matches-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayerRecentMatches[];
  } catch (err) {
    throw new Error(`Failed to load OpenDota player recent matches ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayerRecentMatches(cached: CacheValue): OpenDotaPlayerRecentMatches[] | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as OpenDotaPlayerRecentMatches[];
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function fetchPlayerRecentMatchesFromApi(playerId: string): Promise<OpenDotaPlayerRecentMatches[]> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}/recentMatches`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player recent matches ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player recent matches response: ${err}`);
  }
}

async function ensureNotRateLimited(rateLimiter: RateLimiter): Promise<void> {
  const rateResult = await rateLimiter.checkServiceLimit('opendota', 'players');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by OpenDota API');
  }
} 
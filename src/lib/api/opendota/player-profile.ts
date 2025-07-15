import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { CacheValue } from '@/types/cache';
import { OpenDotaPlayer } from '@/types/external-apis';

import { RateLimiter } from '@/lib/rate-limiter';

/**
 * Fetches a Dota 2 player profile from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/players/operation/get_players_account_id
 *
 * @param playerId The player/account ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaPlayer object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaPlayer(playerId: string, force = false): Promise<OpenDotaPlayer> {
  const cacheKey = `opendota:player:${playerId}`;
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
    return loadMockPlayer(playerId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedPlayer(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const player = await fetchPlayerFromApi(playerId);
  await cache.set(cacheKey, JSON.stringify(player), cacheTTL);
  return player;
}

async function loadMockPlayer(playerId: string): Promise<OpenDotaPlayer> {
  const mockPath = path.join(process.cwd(), 'mock-data', `player-${playerId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaPlayer;
  } catch (err) {
    throw new Error(`Failed to load OpenDota player ${playerId} from mock data: ${err}`);
  }
}

function parseCachedPlayer(cached: CacheValue): OpenDotaPlayer | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as OpenDotaPlayer;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function ensureNotRateLimited(rateLimiter: RateLimiter): Promise<void> {
  const rateResult = await rateLimiter.checkServiceLimit('opendota', 'players');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by OpenDota API');
  }
}

async function fetchPlayerFromApi(playerId: string): Promise<OpenDotaPlayer> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/players/${playerId}`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota player ${playerId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player response: ${err}`);
  }
} 
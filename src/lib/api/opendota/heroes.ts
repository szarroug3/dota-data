import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { CacheValue } from '@/types/cache';
import { OpenDotaHero } from '@/types/external-apis';

import { RateLimiter } from '@/lib/rate-limiter';

/**
 * Fetches the list of Dota 2 heroes from OpenDota API, with cache, rate limiting, and mock mode support.
 * OpenDota API docs: https://docs.opendota.com/#tag/heroes/operation/get_heroes
 *
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Array of OpenDotaHero objects
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchOpenDotaHeroes(force = false): Promise<OpenDotaHero[]> {
  const cacheKey = 'opendota:heroes';
  const cacheTTL = 60 * 60 * 24 * 7; // 7 days
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

  // 1. Mock mode
  if (process.env.USE_MOCK_API === 'true') {
    return loadMockHeroes();
  }

  // 2. Cache check
  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedHeroes(cached);
    if (parsed) return parsed;
  }

  // 3. Rate limit
  await ensureNotRateLimited(rateLimiter);

  // 4. Fetch from OpenDota
  const heroes = await fetchHeroesFromApi();
  await cache.set(cacheKey, JSON.stringify(heroes), cacheTTL);
  return heroes;
}

async function loadMockHeroes(): Promise<OpenDotaHero[]> {
  const mockPath = path.join(process.cwd(), 'mock-data', 'heroes.json');
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaHero[];
  } catch (err) {
    throw new Error(`Failed to load OpenDota heroes from mock data: ${err}`);
  }
}

function parseCachedHeroes(cached: CacheValue): OpenDotaHero[] | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as OpenDotaHero[];
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function ensureNotRateLimited(rateLimiter: RateLimiter): Promise<void> {
  const rateResult = await rateLimiter.checkServiceLimit('opendota', 'heroes');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by OpenDota API');
  }
}

async function fetchHeroesFromApi(): Promise<OpenDotaHero[]> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/heroes`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch OpenDota heroes: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse OpenDota heroes response: ${err}`);
  }
} 
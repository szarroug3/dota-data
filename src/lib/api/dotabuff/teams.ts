import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { RateLimiter } from '@/lib/rate-limiter';
import { CacheValue } from '@/types/cache';
import { DotabuffTeam } from '@/types/external-apis';

/**
 * Fetches a Dota 2 team profile from Dotabuff, with cache, rate limiting, and mock mode support.
 * Dotabuff endpoint: https://www.dotabuff.com/esports/teams/{teamId}
 *
 * @param teamId The team ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns DotabuffTeam object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchDotabuffTeam(teamId: string, force = false): Promise<DotabuffTeam> {
  const cacheKey = `dotabuff:team:${teamId}`;
  const cacheTTL = 60 * 60 * 6; // 6 hours
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
    return loadMockTeam(teamId);
  }

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedTeam(cached);
    if (parsed) return parsed;
  }

  await ensureNotRateLimited(rateLimiter);

  const team = await fetchTeamFromDotabuff(teamId);
  await cache.set(cacheKey, JSON.stringify(team), cacheTTL);
  return team;
}

async function loadMockTeam(teamId: string): Promise<DotabuffTeam> {
  const mockPath = path.join(process.cwd(), 'mock-data', 'teams', `dotabuff-team-${teamId}.json`);
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as DotabuffTeam;
  } catch (err) {
    throw new Error(`Failed to load Dotabuff team ${teamId} from mock data: ${err}`);
  }
}

function parseCachedTeam(cached: CacheValue): DotabuffTeam | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as DotabuffTeam;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

async function ensureNotRateLimited(rateLimiter: RateLimiter): Promise<void> {
  const rateResult = await rateLimiter.checkServiceLimit('dotabuff', 'teams');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by Dotabuff');
  }
}

async function fetchTeamFromDotabuff(teamId: string): Promise<DotabuffTeam> {
  const baseUrl = process.env.DOTABUFF_BASE_URL || 'https://www.dotabuff.com';
  const url = `${baseUrl}/esports/teams/${teamId}`;
  const timeout = Number(process.env.DOTABUFF_REQUEST_DELAY) || 1000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Failed to fetch Dotabuff team ${teamId}: ${err}`);
  }
  clearTimeout(id);
  if (!response.ok) {
    throw new Error(`Dotabuff API error: ${response.status} ${response.statusText}`);
  }
  try {
    // In a real implementation, parse the HTML and extract team data here
    // For now, assume the endpoint returns JSON (for mock/test purposes)
    return await response.json();
  } catch (err) {
    throw new Error(`Failed to parse Dotabuff team response: ${err}`);
  }
} 
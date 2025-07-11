import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { RateLimiter } from '@/lib/rate-limiter';
import { CacheValue } from '@/types/cache';
import { DotabuffLeague } from '@/types/external-apis';

/**
 * Fetches a Dota 2 league profile from Dotabuff, with cache, rate limiting, and mock mode support.
 * Dotabuff endpoint: https://www.dotabuff.com/esports/leagues/{leagueId}
 *
 * @param leagueId The league ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns DotabuffLeague object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchDotabuffLeague(leagueId: string, force = false): Promise<DotabuffLeague> {
  const cacheKey = `dotabuff:league:${leagueId}`;
  const cacheTTL = 60 * 60 * 24 * 7; // 7 days
  const cache = new CacheService();
  const limiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  if (!force) {
    const cached = await cache.get(cacheKey);
    const parsed = parseCachedLeague(cached);
    if (parsed) return parsed;
  }

  return fetchDotabuffLeagueUncached(leagueId, cache, cacheKey, cacheTTL, limiter);
}

async function fetchDotabuffLeagueUncached(
  leagueId: string,
  cache: CacheService,
  cacheKey: string,
  cacheTTL: number,
  limiter: RateLimiter
): Promise<DotabuffLeague> {
  const useMock = process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_DOTABUFF === 'true';
  const mockFile = path.join(process.cwd(), 'mock-data', `league-${leagueId}.html`);
  if (useMock) {
    return fetchDotabuffLeagueFromMock(mockFile, leagueId, cache, cacheKey, cacheTTL);
  }
  return fetchDotabuffLeagueFromApi(leagueId, mockFile, cache, cacheKey, cacheTTL, limiter);
}

async function fetchDotabuffLeagueFromMock(
  mockFile: string,
  leagueId: string,
  cache: CacheService,
  cacheKey: string,
  cacheTTL: number
): Promise<DotabuffLeague> {
  try {
    const file = await fs.readFile(mockFile, 'utf-8');
    const league = parseDotabuffLeagueHtml(file, leagueId);
    await cache.set(cacheKey, JSON.stringify(league), cacheTTL);
    return league;
  } catch {
    throw new Error(`Mock data file not found for league ${leagueId}`);
  }
}

async function fetchDotabuffLeagueFromApi(
  leagueId: string,
  mockFile: string,
  cache: CacheService,
  cacheKey: string,
  cacheTTL: number,
  limiter: RateLimiter
): Promise<DotabuffLeague> {
  await limiter.checkLimit('dotabuff:league', {
    window: 60,
    max: 60,
    service: 'dotabuff',
    identifier: `league:${leagueId}`,
  });
  try {
    const res = await fetch(`https://www.dotabuff.com/esports/leagues/${leagueId}`);
    if (!res.ok) throw new Error(`Dotabuff API error: ${res.status}`);
    const html = await res.text();
    const league = parseDotabuffLeagueHtml(html, leagueId);
    if (process.env.WRITE_REAL_DATA_TO_MOCK === 'true') {
      await fs.writeFile(mockFile, html, 'utf-8');
    }
    await cache.set(cacheKey, JSON.stringify(league), cacheTTL);
    return league;
  } catch (error) {
    throw new Error(`Failed to fetch Dotabuff league: ${error}`);
  }
}

function parseCachedLeague(cached: CacheValue): DotabuffLeague | null {
  if (typeof cached === 'string') {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed as DotabuffLeague;
      }
    } catch {
      // ignore parse error
    }
  }
  return null;
}

// TODO: Implement a robust HTML parser for Dotabuff league pages
function parseDotabuffLeagueHtml(html: string, leagueId: string): DotabuffLeague {
  // Placeholder: return minimal object for now
  return {
    league_id: Number(leagueId),
    name: `League ${leagueId}`,
    description: '',
    tournament_url: '',
    matches: [],
  };
} 
import { shouldMockService, tryMock } from '@/lib/api';
import { fetchAPI, isAlreadyQueuedResult } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { generateFakeHeroes } from '@/lib/fake-data-generator';
import { logWithTimestampToFile } from '@/lib/server-logger';
import type { OpenDotaHero } from '@/types/opendota';

/**
 * Background job pattern:
 * - Only real or mock data is ever written to cache/disk (via cacheService.set), never a status object.
 * - Status objects (e.g., { status: 'queued' }) are only returned by the API handler when polling and data is not yet ready.
 * - This ensures cache files are always valid data, never a status.
 */

export async function getHeroes(forceRefresh = false): Promise<OpenDotaHero[] | { status: string; signature: string }> {
  const cacheKey = 'opendota-heroes';
  const filename = `${cacheKey}.json`;
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  // 1. Check cache for data
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaHero[]>(cacheKey, filename, HEROES_TTL);
    if (cached) return cached;
  }

  // 2. Queue the fetch
  const queueResult = await cacheService.queueRequest(
    'opendota',
    cacheKey,
    async () => {
      // 1. Try mock data if available
      const mockRes = await tryMock('opendota', filename);
      if (mockRes) {
        return await mockRes.json();
      }
      
      // 2. Check if we should use mock service
      if (shouldMockService('opendota')) {
        const fakeData = generateFakeHeroes(124, filename);
        await cacheService.set('opendota', cacheKey, fakeData, HEROES_TTL, filename);
        if (typeof logWithTimestampToFile === 'function') {
          logWithTimestampToFile('log', `[SAMREEN] [BGJOB] Wrote mock hero data to cache for filename=${filename}`);
        }
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaHero[]>("opendota", "/heroes", cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    HEROES_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getHeroStats(forceRefresh = false): Promise<OpenDotaHero[] | { status: string; signature: string }> {
  const cacheKey = "opendota-hero-stats";
  const filename = `${cacheKey}.json`;
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  // 1. Check cache for data
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaHero[]>(cacheKey, filename, HEROES_TTL);
    if (cached) return cached;
  }

  // 2. Queue the fetch
  const queueResult = await cacheService.queueRequest(
    'opendota',
    cacheKey,
    async () => {
      // 1. Try mock data if available
      const mockRes = await tryMock('opendota', filename);
      if (mockRes) {
        return await mockRes.json();
      }
      
      // 2. Check if we should use mock service
      if (shouldMockService('opendota')) {
        const fakeData = generateFakeHeroes(124, filename);
        await cacheService.set('opendota', cacheKey, fakeData, HEROES_TTL, filename);
        if (typeof logWithTimestampToFile === 'function') {
          logWithTimestampToFile('log', `[SAMREEN] [BGJOB] Wrote mock hero data to cache for filename=${filename}`);
        }
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaHero[]>("opendota", "/heroes/stats", cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    HEROES_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
} 
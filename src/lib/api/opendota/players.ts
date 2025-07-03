import { shouldMockService, tryMock } from '@/lib/api';
import { fetchAPI } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { getPlayerStats as getPlayerStatsFromService, type PlayerStats } from '@/lib/data-service';
import { generateFakePlayer, generateFakePlayerCounts, generateFakePlayerHeroes, generateFakePlayerMatches, generateFakePlayerRecentMatches, generateFakePlayerStats, generateFakePlayerTotals, generateFakePlayerWL } from '@/lib/fake-data-generator';
import { logWithTimestampToFile } from '@/lib/server-logger';
import {
    getOpendotaPlayerCacheKey,
    getOpendotaPlayerCountsCacheKey,
    getOpendotaPlayerHeroesCacheKey,
    getOpendotaPlayerMatchesCacheKey,
    getOpendotaPlayerRecentMatchesCacheKey,
    getOpendotaPlayerStatsCacheKey,
    getOpendotaPlayerTotalsCacheKey,
    getOpendotaPlayerWlCacheKey
} from '@/lib/utils/cache-keys';
import type { OpenDotaMatch, OpenDotaPlayer, OpenDotaPlayerCounts, OpenDotaPlayerHeroes, OpenDotaPlayerRecentMatches, OpenDotaPlayerTotals, OpenDotaPlayerWL } from '@/types/opendota';

// Helper function to check if result is already queued
function isAlreadyQueuedResult(obj: unknown): obj is { status: string; signature: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    (obj as { status?: string }).status === 'queued' &&
    'signature' in obj
  );
}

/**
 * Background job pattern:
 * - Only real or mock data is ever written to cache/disk (via cacheService.set), never a status object.
 * - Status objects (e.g., { status: 'queued' }) are only returned by the API handler when polling and data is not yet ready.
 * - This ensures cache files are always valid data, never a status.
 */
export async function getPlayerData(accountId: number, forceRefresh = false): Promise<OpenDotaPlayer | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaPlayer>(cacheKey, filename, PLAYER_TTL);
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
        const fakeData = generateFakePlayer(accountId, filename);
        await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
        if (typeof logWithTimestampToFile === 'function') {
          logWithTimestampToFile('log', `[SAMREEN] [BGJOB] Wrote mock player data to cache for accountId=${accountId}, filename=${filename}`);
        }
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayer>('opendota', `/players/${accountId}`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerWL(accountId: number): Promise<OpenDotaPlayerWL | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerWlCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerWL>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerWL(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayerWL>('opendota', `/players/${accountId}/wl`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerTotals(accountId: number): Promise<OpenDotaPlayerTotals[] | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerTotalsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerTotals[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerTotals(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayerTotals[]>('opendota', `/players/${accountId}/totals`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerCounts(accountId: number): Promise<OpenDotaPlayerCounts[] | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerCountsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerCounts[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerCounts(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayerCounts[]>('opendota', `/players/${accountId}/counts`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerHeroes(accountId: number): Promise<OpenDotaPlayerHeroes[] | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerHeroesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerHeroes[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerHeroes(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayerHeroes[]>('opendota', `/players/${accountId}/heroes`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerRecentMatches(accountId: number): Promise<OpenDotaPlayerRecentMatches[] | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerRecentMatchesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerRecentMatches[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerRecentMatches(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaPlayerRecentMatches[]>('opendota', `/players/${accountId}/recentMatches`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerMatches(accountId: number): Promise<OpenDotaMatch[] | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerMatchesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaMatch[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

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
        const fakeData = generateFakePlayerMatches(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data
      const data = await fetchAPI<OpenDotaMatch[]>('opendota', `/players/${accountId}/matches`, cacheKey);
      
      // 4. Write processed data to cache (not HTML, so write processed data)
      await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}

export async function getPlayerStats(accountId: number, forceRefresh = false): Promise<PlayerStats | { status: string; signature: string }> {
  const cacheKey = getOpendotaPlayerStatsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_STATS_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  if (!forceRefresh) {
    const cached = await cacheService.get<PlayerStats>(cacheKey, filename, PLAYER_STATS_TTL);
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
        const fakeData = generateFakePlayerStats(accountId, filename);
        return fakeData;
      }
      
      // 3. Fetch real data using the data service
      const data = await getPlayerStatsFromService(accountId);
      
      // 4. Write processed data to cache
      await cacheService.set('opendota', cacheKey, data, PLAYER_STATS_TTL, filename);
      
      // 5. Return processed data
      return data;
    },
    PLAYER_STATS_TTL,
    filename
  );

  if (isAlreadyQueuedResult(queueResult)) {
    return { status: 'queued', signature: queueResult.signature };
  }
  return queueResult;
}
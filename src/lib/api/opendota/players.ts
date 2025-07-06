import { shouldMockService, tryMock } from '@/lib/api';
import { fetchAPI } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { getPlayerStats as getPlayerStatsFromService, type PlayerStats } from '@/lib/data-service';
import { generateFakePlayer, generateFakePlayerCounts, generateFakePlayerHeroes, generateFakePlayerMatches, generateFakePlayerRecentMatches, generateFakePlayerStats, generateFakePlayerTotals, generateFakePlayerWL } from '@/lib/fake-data-generators/player-generator';
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
import type { OpenDotaMatch, OpenDotaPlayer, OpenDotaPlayerCounts, OpenDotaPlayerHeroes, OpenDotaPlayerRecentMatch, OpenDotaPlayerTotals, OpenDotaPlayerWL } from '@/types/opendota';

/**
 * Get player data from OpenDota API
 * @param accountId - Player account ID
 * @param forceRefresh - Force refresh from API
 * @returns Promise<OpenDotaPlayer> - Player data
 */
export async function getPlayerData(accountId: number, forceRefresh = false): Promise<OpenDotaPlayer> {
  const cacheKey = getOpendotaPlayerCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data (unless force refresh)
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaPlayer>(cacheKey, filename, PLAYER_TTL);
    if (cached) return cached;
  }

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayer(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaPlayer>('opendota', `/players/${accountId}`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  
  // 6. Return processed data
  return data;
}

export async function getPlayerWL(accountId: number): Promise<OpenDotaPlayerWL> {
  const cacheKey = getOpendotaPlayerWlCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerWL>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerWL(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaPlayerWL>('opendota', `/players/${accountId}/wl`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  
  // 6. Return processed data
  return data;
}

export async function getPlayerTotals(accountId: number): Promise<OpenDotaPlayerTotals[]> {
  const cacheKey = getOpendotaPlayerTotalsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerTotals[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerTotals(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaPlayerTotals[]>('opendota', `/players/${accountId}/totals`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  
  // 6. Return processed data
  return data;
}

export async function getPlayerCounts(accountId: number): Promise<OpenDotaPlayerCounts> {
  const cacheKey = getOpendotaPlayerCountsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<OpenDotaPlayerCounts>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerCounts(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaPlayerCounts>('opendota', `/players/${accountId}/counts`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  
  // 6. Return processed data
  return data;
}

export async function getPlayerHeroes(accountId: number): Promise<OpenDotaPlayerHeroes[]> {
  const cacheKey = getOpendotaPlayerHeroesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  const cached = await cacheService.get<OpenDotaPlayerHeroes[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    return await mockRes.json();
  }

  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerHeroes(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }

  const data = await fetchAPI<OpenDotaPlayerHeroes[]>('opendota', `/players/${accountId}/heroes`, cacheKey);
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  return data;
}

export async function getPlayerRecentMatches(accountId: number): Promise<OpenDotaPlayerRecentMatch[]> {
  const cacheKey = getOpendotaPlayerRecentMatchesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  const cached = await cacheService.get<OpenDotaPlayerRecentMatch[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    return await mockRes.json();
  }

  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerRecentMatches(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }

  const data = await fetchAPI<OpenDotaPlayerRecentMatch[]>('opendota', `/players/${accountId}/recentMatches`, cacheKey);
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  return data;
}

export async function getPlayerMatches(accountId: number): Promise<OpenDotaMatch[]> {
  const cacheKey = getOpendotaPlayerMatchesCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_TTL = 60 * 60 * 24; // 1 day in seconds

  const cached = await cacheService.get<OpenDotaMatch[]>(cacheKey, filename, PLAYER_TTL);
  if (cached) return cached;

  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    return await mockRes.json();
  }

  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerMatches(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_TTL, filename);
    return fakeData;
  }

  const data = await fetchAPI<OpenDotaMatch[]>('opendota', `/players/${accountId}/matches`, cacheKey);
  await cacheService.set('opendota', cacheKey, data, PLAYER_TTL, filename);
  return data;
}

export async function getPlayerStats(accountId: number, forceRefresh = false): Promise<PlayerStats> {
  const cacheKey = getOpendotaPlayerStatsCacheKey(accountId.toString());
  const filename = `${cacheKey}.json`;
  const PLAYER_STATS_TTL = 60 * 60 * 24; // 1 day in seconds

  if (!forceRefresh) {
    const cached = await cacheService.get<PlayerStats>(cacheKey, filename, PLAYER_STATS_TTL);
    if (cached) return cached;
  }

  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    return await mockRes.json();
  }

  if (shouldMockService('opendota')) {
    const fakeData = generateFakePlayerStats(accountId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, PLAYER_STATS_TTL, filename);
    return fakeData;
  }

  const data = await getPlayerStatsFromService(accountId);
  await cacheService.set('opendota', cacheKey, data, PLAYER_STATS_TTL, filename);
  return data;
}
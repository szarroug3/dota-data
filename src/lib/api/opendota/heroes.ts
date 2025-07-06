import { shouldMockService, tryMock } from '@/lib/api';
import { fetchAPI } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { generateFakeHeroes } from '@/lib/fake-data-generators/hero-generator';
import type { OpenDotaHero } from '@/types/opendota';

/**
 * Get heroes data from OpenDota API
 * @param forceRefresh - Force refresh from API
 * @returns Promise<OpenDotaHero[]> - Heroes data
 */
export async function getHeroes(forceRefresh = false): Promise<OpenDotaHero[]> {
  const cacheKey = 'opendota-heroes';
  const filename = `${cacheKey}.json`;
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  // 1. Check cache for data (unless force refresh)
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaHero[]>(cacheKey, filename, HEROES_TTL);
    if (cached) return cached;
  }

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakeHeroes(124, filename);
    await cacheService.set('opendota', cacheKey, fakeData, HEROES_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaHero[]>("opendota", "/heroes", cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
  
  // 6. Return processed data
  return data;
}

export async function getHeroStats(forceRefresh = false): Promise<OpenDotaHero[]> {
  const cacheKey = "opendota-hero-stats";
  const filename = `${cacheKey}.json`;
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  // 1. Check cache for data (unless force refresh)
  if (!forceRefresh) {
    const cached = await cacheService.get<OpenDotaHero[]>(cacheKey, filename, HEROES_TTL);
    if (cached) return cached;
  }

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakeHeroes(124, filename);
    await cacheService.set('opendota', cacheKey, fakeData, HEROES_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<OpenDotaHero[]>("opendota", "/heroes/stats", cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, HEROES_TTL, filename);
  
  // 6. Return processed data
  return data;
} 
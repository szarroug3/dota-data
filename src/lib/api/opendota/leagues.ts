import path from 'path';

import { getEnv } from '@/lib/config/environment';
import { request, requestWithRetry } from '@/lib/utils/request';

export interface OpendotaLeague {
  leagueid?: number;
  name?: string;
}

function buildOpendotaLeaguesUrl(): string {
  const base = getEnv.OPENDOTA_API_BASE_URL();
  return `${base}/leagues`;
}

async function fetchLeagues(): Promise<string> {
  const url = buildOpendotaLeaguesUrl();
  const res = await requestWithRetry('GET', url);
  if (!res.ok) {
    throw new Error(`OpenDota API error: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export async function fetchLeaguesFromOpendota(force = false): Promise<OpendotaLeague[]> {
  const cacheKey = `opendota:leagues`;
  const cacheTTL = 60 * 60 * 12; // 12 hours
  const mockFilename = path.join(process.cwd(), 'mock-data', 'leagues', 'opendota-leagues.json');

  const result = await request<OpendotaLeague[] | null>(
    'opendota',
    () => fetchLeagues(),
    (data: string) => {
      try {
        return JSON.parse(data) as OpendotaLeague[];
      } catch (err) {
        throw new Error(`Failed to parse OpenDota leagues list: ${err}`);
      }
    },
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  return result ?? [];
}

import path from 'path';

import { CacheTtlSeconds } from '@/lib/cache-ttls';
import { getEnv } from '@/lib/config/environment';
import { request, requestWithRetry } from '@/lib/utils/request';

export interface SteamMatchSummary {
  match_id: number;
  match_seq_num?: number;
  start_time?: number;
  lobby_type?: number;
  radiant_team_id?: number;
  dire_team_id?: number;
  radiant_name?: string;
  dire_name?: string;
  series_id?: number;
  series_type?: number;
}

export interface SteamGetMatchHistoryResult {
  status: number;
  num_results?: number;
  total_results?: number;
  results_remaining?: number;
  matches?: SteamMatchSummary[];
}

async function fetchLeaguePage(leagueId: string, startAtMatchId?: number): Promise<SteamGetMatchHistoryResult> {
  const url = buildSteamLeagueUrl(leagueId, undefined, startAtMatchId);
  const response = await requestWithRetry('GET', url);
  const text = await response.text();
  const json = JSON.parse(text) as { result: SteamGetMatchHistoryResult };
  return json.result;
}

function buildSteamLeagueUrl(leagueId: string, key?: string, startAtMatchId?: number): string {
  const apiKey = key || getEnv.STEAM_API_KEY?.();
  const base = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/';
  const params = new URLSearchParams();
  if (apiKey) params.set('key', apiKey);
  params.set('league_id', String(leagueId));
  if (typeof startAtMatchId === 'number' && Number.isFinite(startAtMatchId)) {
    params.set('start_at_match_id', String(startAtMatchId));
  }
  return `${base}?${params.toString()}`;
}

export async function fetchSteamLeague(
  leagueId: string,
  force = false,
): Promise<{ result: SteamGetMatchHistoryResult }> {
  const cacheKey = `steam:league:${leagueId}`;
  const cacheTTL = CacheTtlSeconds.steamLeagues;
  const mockFilename = path.join(process.cwd(), 'mock-data', 'leagues', `steam-league-${leagueId}.json`);

  const aggregator = async (): Promise<string> => {
    let aggregatedMatches: SteamMatchSummary[] = [];
    let status = 1;
    let totalResults = 0;
    let lastMatchId: number | undefined = undefined;
    let resultsRemaining = 0;

    for (let safetyCounter = 0; safetyCounter < 1000; safetyCounter++) {
      const page = await fetchLeaguePage(leagueId, lastMatchId);
      status = page.status;
      totalResults = page.total_results || totalResults;
      resultsRemaining = page.results_remaining ?? 0;

      const pageMatches = page.matches ?? [];
      aggregatedMatches = aggregatedMatches.concat(pageMatches);

      const last = pageMatches[pageMatches.length - 1];
      lastMatchId = typeof last?.match_id === 'number' ? last.match_id - 1 : undefined;

      const continuePaging = resultsRemaining > 0 && Boolean(lastMatchId);
      if (!continuePaging) break;
    }

    const aggregated = {
      result: {
        status,
        num_results: aggregatedMatches.length,
        total_results: totalResults || aggregatedMatches.length,
        results_remaining: 0,
        matches: aggregatedMatches,
      },
    };
    return JSON.stringify(aggregated);
  };

  const result = await request<{ result: SteamGetMatchHistoryResult }>(
    'steam',
    aggregator,
    (data: string) => JSON.parse(data) as { result: SteamGetMatchHistoryResult },
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch league data for league ${leagueId}`);
  }

  return result;
}

import path from 'path';

import { request, requestWithRetry } from '@/lib/utils/request';
import { SteamLeague } from '@/types/external-apis';
import { getEnv } from '@/lib/config/environment';

/**
 * Fetches a Dota 2 league profile from Steam API, with cache, rate limiting, and mock mode support.
 * Steam API endpoint: https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1
 *
 * @param leagueId The league ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns SteamLeague object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchSteamLeague(leagueId: string, force = false): Promise<SteamLeague> {
  const cacheKey = `steam:league:${leagueId}`;
  const cacheTTL = 60 * 60 * 24; // 1 day
  const mockFilename = path.join(process.cwd(), 'mock-data', 'leagues', `steam-league-${leagueId}.json`);

  const result = await request<SteamLeague>(
    'steam',
    () => fetchLeagueFromSteam(leagueId),
    (data: any) => parseSteamLeagueData(data, leagueId),
    mockFilename,
    force,
    cacheTTL,
    cacheKey
  );

  if (!result) {
    throw new Error(`Failed to fetch league data for league ${leagueId}`);
  }

  return result;
}

async function fetchLeagueFromSteam(leagueId: string): Promise<any> {
  const API_KEY = getEnv.STEAM_API_KEY();
  if (!API_KEY) {
    throw new Error('STEAM_API_KEY environment variable is required');
  }
  const MATCH_HISTORY_URL = 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1';
  
  const url = new URL(MATCH_HISTORY_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('league_id', leagueId);
  url.searchParams.set('matches_requested', '100');

  const response = await requestWithRetry('GET', url.toString());
  const data = await response.json();
  
  if (!data.result || !data.result.matches) {
    throw new Error('Invalid response from Steam API');
  }

  return data.result;
}

function parseSteamLeagueData(data: any, leagueId: string): SteamLeague {
  const matches = data.matches || [];
  
  // For now, we'll use a generic name since Steam API doesn't provide league names
  // In a real implementation, you might want to maintain a mapping of league IDs to names
  const name = `League ${leagueId}`;
  
  return {
    id: leagueId,
    name,
    matches: matches.map((match: any) => ({
      seriesId: match.series_id,
      seriesType: match.series_type,
      matchId: match.match_id,
      matchSeqNum: match.match_seq_num,
      startTime: match.start_time,
      lobbyType: match.lobby_type,
      radiantTeamId: match.radiant_team_id,
      direTeamId: match.dire_team_id,
      players: (match.players || []).map((player: any) => ({
        accountId: player.account_id,
        playerSlot: player.player_slot,
        teamNumber: player.team_number,
        teamSlot: player.team_slot,
        heroId: player.hero_id,
        heroVariant: player.hero_variant
      }))
    }))
  };
}
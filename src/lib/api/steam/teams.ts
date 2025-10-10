import path from 'path';

import { CacheTtlSeconds } from '@/lib/cache-ttls';
import { request, requestWithRetry } from '@/lib/utils/request';
import type { SteamTeam } from '@/types/external-apis/steam';

interface SteamTeamInfoTeam {
  team_id?: number;
  name?: string;
  tag?: string;
}

interface SteamTeamInfoResponse {
  result?: {
    teams?: SteamTeamInfoTeam[];
  };
}

function buildSteamTeamInfoUrl(teamId: string, apiKey?: string): string {
  const key = apiKey || process.env.STEAM_API_KEY;
  const base = 'https://api.steampowered.com/IDOTA2Match_570/GetTeamInfoByTeamID/v1/';
  const params = new URLSearchParams();
  if (key) params.set('key', key);
  params.set('start_at_team_id', String(teamId));
  params.set('teams_requested', '1');
  return `${base}?${params.toString()}`;
}

async function fetchTeamInfoFromSteam(teamId: string): Promise<string> {
  const url = buildSteamTeamInfoUrl(teamId);
  const res = await requestWithRetry('GET', url);
  if (!res.ok) {
    throw new Error(`Steam API error: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function parseSteamTeamInfo(data: string, teamId: string): SteamTeam {
  const json = JSON.parse(data) as SteamTeamInfoResponse;
  const team = json.result?.teams?.[0];

  if (!team || !team.name) {
    throw new Error(`Data Not Found: Team ${teamId} does not exist`);
  }

  return { id: String(teamId), name: team.name } as SteamTeam;
}

export async function fetchSteamTeam(teamId: string, force = false): Promise<SteamTeam> {
  const cacheKey = `steam:team:${teamId}`;
  const cacheTTL = CacheTtlSeconds.steamTeamById;
  const externalDataFilename = path.join(
    process.cwd(),
    'mock-data',
    'external-data',
    'teams',
    `steam-team-${teamId}.json`,
  );

  const result = await request<SteamTeam>(
    'steam',
    () => fetchTeamInfoFromSteam(teamId),
    (data: string) => parseSteamTeamInfo(data, teamId),
    externalDataFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch team data for team ${teamId}`);
  }
  return result;
}

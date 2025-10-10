import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import { SteamTeam } from '@/types/external-apis/steam';

export async function getTeam(teamId: number, force = false): Promise<SteamTeam> {
  const path = force ? `/api/teams/${teamId}?force=true` : `/api/teams/${teamId}`;
  return requestAndValidate<SteamTeam>(path, (d: JsonValue) => {
    const parsed = (schemas as { getApiTeams: { parse: (data: JsonValue) => SteamTeam } }).getApiTeams.parse(d);
    return parsed as SteamTeam;
  });
}

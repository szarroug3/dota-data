import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import type { DotabuffTeam } from '@/types/external-apis';

export async function getTeam(teamId: number, force = false): Promise<DotabuffTeam> {
  const path = force ? `/api/teams/${teamId}?force=true` : `/api/teams/${teamId}`;
  type Parser<T> = { parse: (data: JsonValue) => T };
  const mod = schemas as never as { getApiTeams?: Parser<DotabuffTeam> };
  const schema = mod.getApiTeams;
  if (!schema) {
    throw new Error('Missing Zod schema for getApiteams');
  }
  return requestAndValidate<DotabuffTeam>(path, (d: JsonValue) => schema.parse(d));
}



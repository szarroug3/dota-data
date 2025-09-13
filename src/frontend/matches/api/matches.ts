import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import type { OpenDotaMatch } from '@/types/external-apis';

export async function getMatch(matchId: number, force = false): Promise<OpenDotaMatch> {
  const path = force ? `/api/matches/${matchId}?force=true` : `/api/matches/${matchId}`;
  type Parser<T> = { parse: (data: JsonValue) => T };
  const mod = schemas as never as { getApiMatches?: Parser<OpenDotaMatch> };
  const schema = mod.getApiMatches;
  if (!schema) {
    throw new Error('Missing Zod schema for getApimatches');
  }
  return requestAndValidate<OpenDotaMatch>(path, (d: JsonValue) => schema.parse(d));
}



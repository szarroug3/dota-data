import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

export async function getPlayer(playerId: number, force = false): Promise<OpenDotaPlayerComprehensive> {
  const path = force ? `/api/players/${playerId}?force=true` : `/api/players/${playerId}`;
  type Parser<T> = { parse: (data: JsonValue) => T };
  const mod = schemas as never as { getApiPlayers?: Parser<OpenDotaPlayerComprehensive> };
  const schema = mod.getApiPlayers;
  if (!schema) {
    throw new Error('Missing Zod schema for getApiplayers');
  }
  return requestAndValidate<OpenDotaPlayerComprehensive>(path, (d: JsonValue) => schema.parse(d));
}

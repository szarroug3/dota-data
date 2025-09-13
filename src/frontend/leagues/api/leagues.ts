import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import type { DotabuffLeague } from '@/types/external-apis';

export async function getLeague(leagueId: number, force = false): Promise<DotabuffLeague> {
  const path = force ? `/api/leagues/${leagueId}?force=true` : `/api/leagues/${leagueId}`;
  const validated = await requestAndValidate<{ data: DotabuffLeague }>(
    path,
    (d: JsonValue) => {
      const parsed = schemas.getApiLeaguesId.parse(d) as { data?: DotabuffLeague };
      return { data: parsed.data as DotabuffLeague };
    }
  );
  return validated.data;
}




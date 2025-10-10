import { z } from 'zod';

import { JsonValue, requestAndValidate } from '@/frontend/lib/api-client';
import type { SteamLeague } from '@/types/external-apis/steam';

// Local schema to preserve Steam payload while validating id/name minimally
const SteamMatchSummarySchema = z
  .object({
    match_id: z.number().int(),
    radiant_team_id: z.number().int().optional(),
    dire_team_id: z.number().int().optional(),
  })
  .partial()
  .catchall(z.unknown());

const SteamLeagueSchema = z
  .object({
    result: z
      .object({
        status: z.number().int().optional(),
        matches: z.array(SteamMatchSummarySchema).optional(),
      })
      .partial()
      .catchall(z.unknown()),
  })
  .catchall(z.unknown());

export type { SteamLeague };

export type OpendotaLeague = { leagueid?: number; name?: string };

const OpendotaLeaguesSchema = z
  .object({
    leagues: z.array(
      z
        .object({
          leagueid: z.number().int().optional(),
          name: z.string().optional(),
        })
        .catchall(z.unknown()),
    ),
  })
  .catchall(z.unknown());

export async function getLeagues(force: boolean = false): Promise<OpendotaLeague[]> {
  const path = force ? '/api/leagues?force=true' : '/api/leagues';
  const validated = await requestAndValidate<{ leagues: OpendotaLeague[] }>(
    path,
    (d: JsonValue) => OpendotaLeaguesSchema.parse(d) as { leagues: OpendotaLeague[] },
  );
  return validated.leagues ?? [];
}

function findLeagueName(leagues: OpendotaLeague[], leagueId: number): string | null {
  const idNum = Number(leagueId);
  const found = leagues.find((l) => l.leagueid === idNum);
  return found?.name ?? null;
}

export async function getLeague(leagueId: number, force = false): Promise<SteamLeague> {
  const path = force ? `/api/leagues/${leagueId}?force=true` : `/api/leagues/${leagueId}`;
  const normalized = await requestAndValidate<SteamLeague>(path, (d: JsonValue) => {
    const raw = SteamLeagueSchema.parse(d);
    const rawMatches = Array.isArray(raw.result?.matches) ? raw.result.matches : [];
    const matches = rawMatches
      .filter((m) => m && typeof m.match_id === 'number')
      .map((m) => ({
        match_id: m.match_id as number,
        radiant_team_id: typeof m.radiant_team_id === 'number' ? m.radiant_team_id : undefined,
        dire_team_id: typeof m.dire_team_id === 'number' ? m.dire_team_id : undefined,
      }));

    const mapped: SteamLeague = {
      id: String(leagueId),
      name: `League ${leagueId}`,
      steam: {
        result: {
          status: typeof raw.result?.status === 'number' ? raw.result.status : undefined,
          matches,
        },
      },
    };
    return mapped;
  });

  // Resolve league name via OpenDota list, retry with force on miss
  let leagues = await getLeagues(false);
  let resolvedName = findLeagueName(leagues, leagueId);
  if (!resolvedName) {
    leagues = await getLeagues(true);
    resolvedName = findLeagueName(leagues, leagueId);
  }

  return { ...normalized, name: resolvedName ?? `League ${leagueId}` };
}

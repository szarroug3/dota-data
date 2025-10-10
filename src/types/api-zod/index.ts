import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core';
import { z } from 'zod';

const postApiCacheInvalidateBody = z.object({ pattern: z.string(), key: z.string() }).partial().passthrough();

const endpoints = makeApi([
  {
    method: 'post',
    path: '/api/cache/invalidate',
    alias: 'postApicacheinvalidate',
    description: `Invalidates cache entries either by pattern matching or by specific key. Supports both Redis and memory cache backends with automatic fallback.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: postApiCacheInvalidateBody,
      },
    ],
    response: z
      .object({
        data: z.object({ invalidated: z.number().int(), pattern: z.string() }).partial().passthrough(),
        timestamp: z.string().datetime({ offset: true }),
        backend: z.enum(['redis', 'memory']),
        details: z
          .object({
            pattern: z.string(),
            key: z.string(),
            invalidatedCount: z.number().int(),
            existed: z.boolean(),
            invalidated: z.boolean(),
            operation: z.enum(['pattern-invalidation', 'key-invalidation']),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 403,
        description: `Permission denied`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 503,
        description: `Cache backend unavailable`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/cache/invalidate',
    alias: 'getApicacheinvalidate',
    description: `Retrieves cache backend information, health status, statistics, and available invalidation endpoints. Useful for monitoring cache performance and understanding available operations.`,
    requestFormat: 'json',
    response: z
      .object({
        data: z
          .object({
            backend: z.enum(['redis', 'memory']),
            healthy: z.boolean(),
            statistics: z
              .object({ hits: z.number().int(), misses: z.number().int(), keys: z.number().int(), hitRate: z.number() })
              .partial()
              .passthrough(),
            endpoints: z
              .object({
                invalidatePattern: z
                  .object({
                    method: z.string(),
                    description: z.string(),
                    example: z.object({ pattern: z.string() }).partial().passthrough(),
                  })
                  .partial()
                  .passthrough(),
                invalidateKey: z
                  .object({
                    method: z.string(),
                    description: z.string(),
                    example: z.object({ key: z.string() }).partial().passthrough(),
                  })
                  .partial()
                  .passthrough(),
              })
              .partial()
              .passthrough(),
          })
          .partial()
          .passthrough(),
        timestamp: z.string().datetime({ offset: true }),
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/heroes',
    alias: 'getApiHeroes',
    description: `Retrieves raw heroes data from OpenDota API including hero attributes, roles, and statistics.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.array(
      z
        .object({
          id: z.number().int(),
          name: z.string(),
          localized_name: z.string(),
          primary_attr: z.string(),
          attack_type: z.string(),
          roles: z.array(z.string()),
          img: z.string(),
          icon: z.string(),
          base_health: z.number().int(),
          base_mana: z.number().int(),
          base_armor: z.number().int(),
          base_attack_min: z.number().int(),
          base_attack_max: z.number().int(),
          move_speed: z.number().int(),
          base_attack_time: z.number(),
          attack_point: z.number(),
          attack_range: z.number().int(),
          projectile_speed: z.number().int(),
          turn_rate: z.number(),
          cm_enabled: z.boolean(),
          legs: z.number().int(),
          day_vision: z.number().int(),
          night_vision: z.number().int(),
          hero_id: z.number().int(),
          turbo_picks: z.number().int(),
          turbo_wins: z.number().int(),
          pro_ban: z.number().int(),
          pro_win: z.number().int(),
          pro_pick: z.number().int(),
        })
        .partial()
        .passthrough(),
    ),
    errors: [
      {
        status: 422,
        description: `Invalid heroes data`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/items',
    alias: 'getApiItems',
    description: `Retrieves raw items data from OpenDota API including item attributes, abilities, and statistics.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.record(
      z.string(),
      z
        .object({
          id: z.number().int(),
          img: z.string(),
          dname: z.string(),
          qual: z.string(),
          cost: z.number().int().nullable(),
          behavior: z.union([z.string(), z.array(z.string()), z.boolean()]),
          target_team: z.union([z.string(), z.array(z.string())]),
          target_type: z.union([z.string(), z.array(z.string())]),
          notes: z.string(),
          attrib: z.array(
            z
              .object({ key: z.string(), value: z.union([z.string(), z.number()]), display: z.string() })
              .partial()
              .passthrough(),
          ),
          mc: z.union([z.number(), z.boolean()]),
          hc: z.union([z.number(), z.boolean()]),
          cd: z.union([z.number(), z.boolean()]),
          lore: z.string(),
          components: z.union([z.array(z.string()), z.unknown()]),
          created: z.boolean(),
          charges: z.union([z.number(), z.boolean()]),
          abilities: z.array(
            z.object({ type: z.string(), title: z.string(), description: z.string() }).partial().passthrough(),
          ),
          hint: z.array(z.string()),
          dispellable: z.string(),
          dmg_type: z.string(),
          bkbpierce: z.string(),
          tier: z.number().int(),
        })
        .partial()
        .passthrough(),
    ),
    errors: [
      {
        status: 422,
        description: `Invalid items data`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/leagues',
    alias: 'getApileagues',
    description: `Returns the full list of leagues from OpenDota. Frontend filters this list by leagueid to find a league name. Supports forcing a refresh of the cached list.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z
      .object({ leagues: z.array(z.object({ leagueid: z.number().int(), name: z.string() }).partial().passthrough()) })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/leagues/:id',
    alias: 'getApiLeaguesId',
    description: `Retrieves league information from Steam Web API (GetMatchHistory) using league_id. The backend aggregates all pages server-side and returns a single combined Steam payload including matches with results_remaining set to 0.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z
      .object({
        result: z
          .object({
            status: z.number().int(),
            num_results: z.number().int(),
            total_results: z.number().int(),
            results_remaining: z.number().int(),
            matches: z.array(
              z
                .object({
                  match_id: z.number().int(),
                  radiant_team_id: z.number().int(),
                  dire_team_id: z.number().int(),
                })
                .partial()
                .passthrough(),
            ),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Invalid league ID`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 404,
        description: `League not found`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 422,
        description: `Invalid league data`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by Steam API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/matches/:id',
    alias: 'getApiMatchesId',
    description: `Retrieves raw match data from OpenDota API including players, teams, and game statistics.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 404,
        description: `Match not found`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'post',
    path: '/api/matches/:id/parse',
    alias: 'postApimatchesIdparse',
    description: `Initiates match parsing through OpenDota API and polls for completion. Returns parsed match data when complete.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 404,
        description: `Match not found`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 408,
        description: `Match parsing timed out`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 422,
        description: `Invalid match data`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/players/:id',
    alias: 'getApiPlayersId',
    description: `Retrieves complete player data including profile, statistics, heroes, counts, totals, win/loss, recent matches, rankings, ratings, and ward map. Includes rate limiting with delays between API calls.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 404,
        description: `Player not found`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/teams/:id',
    alias: 'getApiTeamsId',
    description: `Retrieves raw team info from Steam Web API (GetTeamInfoByTeamID) and returns id and name.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'force',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
      {
        name: 'view',
        type: 'Query',
        schema: z.enum(['full', 'summary']).optional().default('full'),
      },
      {
        name: 'includeMatches',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
      {
        name: 'includeRoster',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z
      .object({
        id: z.string(),
        name: z.string(),
        timestamp: z.string().datetime({ offset: true }),
        view: z.string(),
        options: z.object({ includeMatches: z.boolean(), includeRoster: z.boolean() }).partial().passthrough(),
      })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `Invalid team ID`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 404,
        description: `Team not found`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 422,
        description: `Invalid team data`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 429,
        description: `Rate limited by Steam API`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z.object({ error: z.string(), status: z.number().int(), details: z.string() }).partial().passthrough(),
      },
    ],
  },
]);

export const api = new Zodios('/api', endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

// Map endpoint response schemas to stable names expected across the codebase
const findResponseSchemaByAlias = (alias: string) => {
  const endpoint = endpoints.find((e) => e.alias === alias);
  return endpoint ? endpoint.response : z.any();
};

const getApiHeroes = findResponseSchemaByAlias('getApiHeroes');
const getApiItems = findResponseSchemaByAlias('getApiItems');
const getApiLeaguesId = findResponseSchemaByAlias('getApiLeaguesId');
const getApiMatches = findResponseSchemaByAlias('getApiMatchesId');
const getApiPlayers = findResponseSchemaByAlias('getApiPlayersId');
const getApiTeams = findResponseSchemaByAlias('getApiTeamsId');

export const schemas = {
  postApiCacheInvalidateBody,
  getApiHeroes,
  getApiItems,
  getApiLeaguesId,
  getApiMatches,
  getApiPlayers,
  getApiTeams,
};

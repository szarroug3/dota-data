import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core';
import { z } from 'zod';

const postApiCacheInvalidateBody = z.object({ pattern: z.string(), key: z.string() }).partial().catchall(z.unknown());

// Response schemas for clients that validate via schemas.* lookups (permissive)
const getApiMatches = z.unknown();
const getApiPlayers = z.unknown();
const getApiTeams = z.unknown();
const getApiLeagues = z.unknown();

// Concrete response schemas used directly by our typed API clients
const getApiHeroes = z.array(
  z
    .object({
      id: z.number().int(),
      name: z.string(),
      localized_name: z.string(),
      primary_attr: z.string(),
      attack_type: z.string(),
      roles: z.array(z.string()),
    })
    .partial()
    .catchall(z.unknown()),
);

const getApiItems = z
  .object({
    data: z.record(
      z.string(),
      z
        .object({
          id: z.number().int(),
          image: z.string(),
          displayName: z.string(),
        })
        .partial()
        .catchall(z.unknown()),
    ),
    timestamp: z.string().datetime({ offset: true }).optional(),
  })
  .partial()
  .catchall(z.unknown());

const getApiLeaguesId = z
  .union([
    z.object({ id: z.string(), name: z.string() }).catchall(z.unknown()),
    z.object({ data: z.object({ id: z.string(), name: z.string() }).catchall(z.unknown()) }).catchall(z.unknown()),
  ])
  .transform((input) => {
    if ('data' in input) {
      return { data: input.data } as { data: { id: string; name: string } };
    }
    return { data: { id: input.id, name: input.name } } as { data: { id: string; name: string } };
  });

export const schemas = {
  postApiCacheInvalidateBody,
  getApiHeroes,
  getApiItems,
  getApiLeaguesId,
  getApiMatches,
  getApiPlayers,
  getApiTeams,
  getApiLeagues,
};

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
        data: z.object({ invalidated: z.number().int(), pattern: z.string() }).partial().catchall(z.unknown()),
        timestamp: z.iso.datetime({ offset: true }),
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
          .catchall(z.unknown()),
      })
      .partial()
      .catchall(z.unknown()),
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 403,
        description: `Permission denied`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 503,
        description: `Cache backend unavailable`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
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
              .object({
                hits: z.number().int(),
                misses: z.number().int(),
                keys: z.number().int(),
                hitRate: z.number(),
              })
              .partial()
              .catchall(z.unknown()),
            endpoints: z
              .object({
                invalidatePattern: z
                  .object({
                    method: z.string(),
                    description: z.string(),
                    example: z.object({ pattern: z.string() }).partial().catchall(z.unknown()),
                  })
                  .partial()
                  .catchall(z.unknown()),
                invalidateKey: z
                  .object({
                    method: z.string(),
                    description: z.string(),
                    example: z.object({ key: z.string() }).partial().catchall(z.unknown()),
                  })
                  .partial()
                  .catchall(z.unknown()),
              })
              .partial()
              .catchall(z.unknown()),
          })
          .partial()
          .catchall(z.unknown()),
        timestamp: z.string().datetime({ offset: true }),
      })
      .partial()
      .catchall(z.unknown()),
    errors: [
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/heroes',
    alias: 'getApiHeroes',
    description: `Retrieves raw heroes data from OpenDota API including hero attributes, roles, and statistics.`,
    requestFormat: 'json',
    parameters: [{ name: 'force', type: 'Query', schema: z.boolean().optional().default(false) }],
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
        .catchall(z.unknown()),
    ),
    errors: [
      {
        status: 422,
        description: `Invalid heroes data`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/items',
    alias: 'getApiItems',
    description: `Retrieves raw items data from OpenDota API including item attributes, abilities, and statistics.`,
    requestFormat: 'json',
    parameters: [{ name: 'force', type: 'Query', schema: z.boolean().optional().default(false) }],
    response: z
      .object({
        data: z.record(
          z.string(),
          z
            .object({
              id: z.number().int(),
              img: z.string(),
              dname: z.string(),
              qual: z.string(),
              cost: z.number().int(),
              behavior: z.union([z.string(), z.array(z.string()), z.boolean()]),
              target_team: z.union([z.string(), z.array(z.string())]),
              target_type: z.union([z.string(), z.array(z.string())]),
              notes: z.string(),
              attrib: z.array(
                z
                  .object({ key: z.string(), value: z.union([z.string(), z.number()]), display: z.string() })
                  .partial()
                  .catchall(z.unknown()),
              ),
              mc: z.union([z.number(), z.boolean()]),
              hc: z.union([z.number(), z.boolean()]),
              cd: z.union([z.number(), z.boolean()]),
              lore: z.string(),
              components: z.union([z.array(z.string()), z.unknown()]),
              created: z.boolean(),
              charges: z.union([z.number(), z.boolean()]),
              abilities: z.array(
                z
                  .object({ type: z.string(), title: z.string(), description: z.string() })
                  .partial()
                  .catchall(z.unknown()),
              ),
              hint: z.array(z.string()),
              dispellable: z.string(),
              dmg_type: z.string(),
              bkbpierce: z.string(),
              tier: z.number().int(),
            })
            .partial()
            .catchall(z.unknown()),
        ),
        timestamp: z.string().datetime({ offset: true }).optional(),
      })
      .partial()
      .catchall(z.unknown()),
    errors: [
      {
        status: 422,
        description: `Invalid items data`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 429,
        description: `Rate limited by Dotabuff API`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/leagues/:id',
    alias: 'getApiLeaguesId',
    description: `Retrieves league information including tournament details, matches, and statistics from Dotabuff. Supports different view modes for optimized data delivery.`,
    requestFormat: 'json',
    parameters: [
      { name: 'id', type: 'Path', schema: z.string() },
      { name: 'force', type: 'Query', schema: z.boolean().optional().default(false) },
      { name: 'includeMatches', type: 'Query', schema: z.boolean().optional().default(false) },
      { name: 'view', type: 'Query', schema: z.enum(['full', 'summary']).optional().default('full') },
    ],
    response: z
      .object({
        data: z
          .object({
            leagueId: z.string(),
            name: z.string(),
            description: z.string(),
            tournamentUrl: z.string(),
            matches: z.array(
              z
                .object({
                  matchId: z.string(),
                  duration: z.number().int(),
                  radiant_win: z.boolean(),
                  radiant_name: z.string(),
                  dire_name: z.string(),
                })
                .partial()
                .catchall(z.unknown()),
            ),
            statistics: z
              .object({
                totalMatches: z.number().int(),
                averageDuration: z.number(),
                radiantWins: z.number().int(),
                direWins: z.number().int(),
                uniqueTeams: z.number().int(),
              })
              .partial()
              .catchall(z.unknown()),
            processed: z.object({ timestamp: z.string(), version: z.string() }).partial().catchall(z.unknown()),
          })
          .partial()
          .catchall(z.unknown()),
        timestamp: z.string().datetime({ offset: true }),
        view: z.string(),
        options: z.object({ includeMatches: z.boolean() }).partial().catchall(z.unknown()),
      })
      .partial()
      .catchall(z.unknown()),
    errors: [
      {
        status: 400,
        description: `Invalid league ID`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 404,
        description: `League not found`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 422,
        description: `Invalid league data`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 429,
        description: `Rate limited by Dotabuff API`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/matches/:id',
    alias: 'getApiMatches',
    description: `Retrieves raw match data from OpenDota API.`,
    requestFormat: 'json',
    parameters: [
      { name: 'id', type: 'Path', schema: z.string() },
      { name: 'force', type: 'Query', schema: z.boolean().optional().default(false) },
    ],
    response: getApiMatches,
    errors: [
      {
        status: 404,
        description: `Match not found`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 422,
        description: `Invalid match data`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/players/:id',
    alias: 'getApiPlayers',
    description: `Retrieves comprehensive player data from OpenDota API.`,
    requestFormat: 'json',
    parameters: [
      { name: 'id', type: 'Path', schema: z.string() },
      { name: 'force', type: 'Query', schema: z.boolean().optional().default(false) },
    ],
    response: getApiPlayers,
    errors: [
      {
        status: 404,
        description: `Player not found`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 422,
        description: `Invalid player data`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 429,
        description: `Rate limited by OpenDota API`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: z
          .object({ error: z.string(), status: z.number().int(), details: z.string() })
          .partial()
          .catchall(z.unknown()),
      },
    ],
  },
]);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

export { schemas as apiSchemas, createApiClient as createZodApiClient };

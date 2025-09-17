import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core';
import { z } from 'zod';

const postApiCacheInvalidateBody = z.object({ pattern: z.string(), key: z.string() }).partial().catchall(z.unknown());

// Response schemas for clients that validate via schemas.* lookups (permissive)
// Accept full OpenDota match object
const getApiMatches = z
  .object({
    match_id: z.number().int(),
    start_time: z.number().int(),
    duration: z.number().int(),
    radiant_win: z.boolean(),
    players: z
      .array(
        z
          .object({
            account_id: z.number().int(),
            player_slot: z.number().int(),
            hero_id: z.number().int(),
            isRadiant: z.boolean().optional(),
            personaname: z.string().optional(),
            lane_role: z.number().int().optional(),
            observer_uses: z.number().int().optional(),
            sentry_uses: z.number().int().optional(),
            is_roaming: z.boolean().optional(),
            item_0: z.number().int().optional(),
            item_1: z.number().int().optional(),
            item_2: z.number().int().optional(),
            item_3: z.number().int().optional(),
            item_4: z.number().int().optional(),
            item_5: z.number().int().optional(),
            kills: z.number().int().optional(),
            deaths: z.number().int().optional(),
            assists: z.number().int().optional(),
            last_hits: z.number().int().optional(),
            denies: z.number().int().optional(),
            gold_per_min: z.number().int().optional(),
            xp_per_min: z.number().int().optional(),
            level: z.number().int().optional(),
          })
          .partial()
          .catchall(z.unknown()),
      )
      .optional(),
  })
  .partial()
  .catchall(z.unknown());
const getApiPlayers = z
  .object({
    profile: z
      .object({
        profile: z
          .object({
            account_id: z.number().int(),
            personaname: z.string().optional(),
            avatar: z.string().optional(),
            avatarmedium: z.string().optional(),
            avatarfull: z.string().optional(),
          })
          .partial()
          .catchall(z.unknown()),
        rank_tier: z.number().int().optional(),
        leaderboard_rank: z.number().int().nullable().optional(),
      })
      .partial()
      .catchall(z.unknown()),
    heroes: z
      .array(
        z
          .object({ hero_id: z.number().int(), games: z.number().int(), win: z.number().int() })
          .partial()
          .catchall(z.unknown()),
      )
      .optional(),
    recentMatches: z
      .array(
        z
          .object({ hero_id: z.number().int(), player_slot: z.number().int(), radiant_win: z.boolean() })
          .partial()
          .catchall(z.unknown()),
      )
      .optional(),
    wl: z.object({ win: z.number().int(), lose: z.number().int() }).partial().catchall(z.unknown()).optional(),
  })
  .partial()
  .catchall(z.unknown());

// Concrete response schemas used directly by our typed API clients
const getApiHeroes = z.array(
  z
    .object({
      id: z.number().int(),
      name: z.string(),
      localized_name: z.string(),
      primary_attr: z.string().optional(),
      attack_type: z.string().optional(),
      roles: z.array(z.string()).optional(),
      img: z.string().optional(),
      icon: z.string().optional(),
      base_health: z.number().int().optional(),
      base_mana: z.number().int().optional(),
      base_armor: z.number().int().optional(),
      base_attack_min: z.number().int().optional(),
      base_attack_max: z.number().int().optional(),
      move_speed: z.number().int().optional(),
      base_attack_time: z.number().optional(),
      attack_point: z.number().optional(),
      attack_range: z.number().int().optional(),
      projectile_speed: z.number().int().optional(),
      turn_rate: z.number().optional(),
      cm_enabled: z.boolean().optional(),
      legs: z.number().int().optional(),
      day_vision: z.number().int().optional(),
      night_vision: z.number().int().optional(),
      hero_id: z.number().int().optional(),
      turbo_picks: z.number().int().optional(),
      turbo_wins: z.number().int().optional(),
      pro_ban: z.number().int().optional(),
      pro_win: z.number().int().optional(),
      pro_pick: z.number().int().optional(),
    })
    .partial()
    .catchall(z.unknown()),
);

const getApiItems = z.record(
  z.string(),
  z
    .object({
      id: z.number().int(),
      img: z.string(),
      dname: z.string(),
    })
    .partial()
    .catchall(z.unknown()),
);

const getApiLeaguesId = z
  .object({
    id: z.string(),
    name: z.string(),
    steam: z
      .object({
        result: z
          .object({
            status: z.number().int().optional(),
            matches: z
              .array(
                z
                  .object({
                    match_id: z.number().int(),
                    radiant_team_id: z.number().int().optional(),
                    dire_team_id: z.number().int().optional(),
                  })
                  .partial()
                  .catchall(z.unknown()),
              )
              .optional(),
          })
          .partial()
          .catchall(z.unknown()),
      })
      .partial()
      .catchall(z.unknown())
      .optional(),
  })
  .catchall(z.unknown());

const getApiTeams = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .catchall(z.unknown());

export const schemas = {
  postApiCacheInvalidateBody,
  getApiHeroes,
  getApiItems,
  getApiLeaguesId,
  getApiMatches,
  getApiPlayers,
  getApiTeams,
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
    description: `Retrieves league information with Steam match history payload preserved for client consumption.`,
    requestFormat: 'json',
    parameters: [
      { name: 'id', type: 'Path', schema: z.string() },
      { name: 'force', type: 'Query', schema: z.boolean().optional().default(false) },
      { name: 'includeMatches', type: 'Query', schema: z.boolean().optional().default(false) },
      { name: 'view', type: 'Query', schema: z.enum(['full', 'summary']).optional().default('full') },
    ],
    response: getApiLeaguesId,
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

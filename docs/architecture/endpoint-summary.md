# API Endpoint Summary

This document provides a comprehensive overview of all API endpoints, their file operations, cache key usage, and TTLs. All endpoints integrate with the [caching layer](./caching-layer.md), [rate limiting layer](./rate-limiting-layer.md), and [queueing layer](./queueing-layer.md) as described in the [backend data flow](./backend-data-flow.md).

## Summary Table

| Endpoint | Method | Mock Data File(s) | Cache Keys | TTL |
|----------|--------|-------------------|------------|-----|
| `/api/heroes` | GET | `mock-data/heroes.json` | `opendota:heroes` | 7 days |
| `/api/leagues/[id]` | POST | `mock-data/league-{id}.html` | `dotabuff:league:{id}` | 7 days |
| `/api/teams/[id]` | POST | `mock-data/team-{id}.html` | `dotabuff:team:{id}` | 6 hours |
| `/api/players/[id]` | POST | `mock-data/player-{id}.json` | `opendota:player:{id}` | 24 hours |
| `/api/players/[id]/matches` | POST | `mock-data/player-matches-{id}.json` | `opendota:player-matches:{id}` | 24 hours |
| `/api/players/[id]/heroes` | POST | `mock-data/player-heroes-{id}.json` | `opendota:player-heroes:{id}` | 24 hours |
| `/api/players/[id]/counts` | POST | `mock-data/player-counts-{id}.json` | `opendota:player-counts:{id}` | 24 hours |
| `/api/players/[id]/totals` | POST | `mock-data/player-totals-{id}.json` | `opendota:player-totals:{id}` | 24 hours |
| `/api/players/[id]/wl` | POST | `mock-data/player-wl-{id}.json` | `opendota:player-wl:{id}` | 24 hours |
| `/api/players/[id]/recentMatches` | POST | `mock-data/player-recent-matches-{id}.json` | `opendota:player-recent-matches:{id}` | 24 hours |
| `/api/matches/[id]` | POST | `mock-data/match-{id}-parsed.json` | `opendota:match:{id}` | 14 days |
| `/api/matches/[id]/parse` | POST | `mock-data/match-{id}-parsed.json` | `opendota:match:{id}` | 14 days |
| `/api/configs/[id]` | POST/GET | `mock-data/dashboard-config-{id}.json` | `dashboard-config:{id}` | 7 days |
| `/api/cache/invalidate` | POST | - | - | - |
| `/api/openapi` | GET | `public/openapi.json` | - | - |

### Notes
- All endpoints now read and write raw mock data exclusively from the `mock-data` folder, using the file listed above for both operations.
- For teams and leagues, the mock data file is an HTML file (`.html`), and both reading and writing use this file.
- Cache keys and TTLs are standardized and shown above for each endpoint.
- No file writing is done in the route handler itself; all is handled by service/helper layers.

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including endpoint integration
- **[Caching Layer](./caching-layer.md):** Cache key patterns and TTL strategies
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Rate limiting per endpoint and service
- **[Queueing Layer](./queueing-layer.md):** Background job processing for endpoints
- **[Project Structure](./project-structure.md):** Recommended folder structure for API organization
- **[Type Organization](./type-organization.md):** TypeScript types for API responses and requests 
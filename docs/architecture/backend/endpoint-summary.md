# API Endpoint Summary

This document provides a comprehensive overview of all API endpoints, their file operations, cache key usage, and TTLs. All endpoints integrate with the [caching layer](./caching-layer.md), [rate limiting layer](./rate-limiting-layer.md), and [queueing layer](./queueing-layer.md) as described in the [backend data flow](./backend-data-flow.md).

## Current API Endpoints (7 Total)

All endpoints are fully documented with comprehensive OpenAPI/Swagger specifications including parameters, responses, examples, and error cases.

### Summary Table

| Endpoint | Method | Description | Mock Data File(s) | Cache Keys | TTL | Documentation Status |
|----------|--------|-------------|-------------------|------------|-----|---------------------|
| `/api/heroes` | GET | Fetch and filter Dota 2 heroes | `mock-data/heroes.json` | `opendota:heroes` | 7 days | ✅ Complete |
| `/api/players/[id]` | GET | Fetch player profile and statistics | `mock-data/player-{id}.json` | `opendota:player:{id}` | 24 hours | ✅ Complete |
| `/api/teams/[id]` | GET | Fetch team data and statistics | `mock-data/team-{id}.html` | `dotabuff:team:{id}` | 6 hours | ✅ Complete |
| `/api/matches/[id]` | GET | Fetch match data and statistics | `mock-data/match-{id}-parsed.json` | `opendota:match:{id}` | 14 days | ✅ Complete |
| `/api/matches/[id]/parse` | POST | Parse match through background job | `mock-data/match-{id}-parsed.json` | `opendota:match:{id}` | 14 days | ✅ Complete |
| `/api/leagues/[id]` | GET | Fetch league tournament data | `mock-data/league-{id}.html` | `dotabuff:league:{id}` | 7 days | ✅ Complete |
| `/api/cache/invalidate` | POST/GET | Cache management and invalidation | - | - | - | ✅ Complete |

### Endpoint Details

#### Heroes Endpoint
- **Path:** `/api/heroes`
- **Method:** GET
- **Parameters:** `force`, `complexity`, `role`, `primaryAttribute`, `tier`
- **Features:** Filtering, caching, rate limiting
- **Response:** Array of processed heroes with metadata

#### Players Endpoint  
- **Path:** `/api/players/[id]`
- **Method:** GET
- **Parameters:** `force`, `view`, `includeMatches`, `includeHeroes`, `includeRecent`
- **Features:** Multiple view modes, comprehensive player data
- **Response:** Player profile, statistics, and performance metrics

#### Teams Endpoint
- **Path:** `/api/teams/[id]`
- **Method:** GET
- **Parameters:** `force`, `view`, `includeMatches`, `includeRoster`
- **Features:** Team statistics, performance analysis
- **Response:** Team data with statistics and performance metrics

#### Matches Endpoint
- **Path:** `/api/matches/[id]`
- **Method:** GET
- **Parameters:** `force`, `parsed`, `view`
- **Features:** Multiple view modes, parsed/unparsed data
- **Response:** Detailed match data with player and team statistics

#### Match Parse Endpoint
- **Path:** `/api/matches/[id]/parse`
- **Method:** POST
- **Parameters:** `priority`, `timeout`
- **Features:** Background job processing, queue management
- **Response:** Job status and parsed match data

#### Leagues Endpoint
- **Path:** `/api/leagues/[id]`
- **Method:** GET
- **Parameters:** `force`, `includeMatches`, `view`
- **Features:** Tournament data, match statistics
- **Response:** League information with optional match data

#### Cache Invalidate Endpoint
- **Path:** `/api/cache/invalidate`
- **Methods:** POST (invalidate), GET (status)
- **Features:** Pattern-based and key-based invalidation
- **Response:** Cache statistics and invalidation results

### OpenAPI Documentation

All endpoints are comprehensively documented with:
- ✅ Complete parameter descriptions with types and examples
- ✅ Full response schemas with nested object definitions
- ✅ Example responses for success and error cases
- ✅ Error response documentation with specific status codes
- ✅ Proper tagging for endpoint grouping
- ✅ Request/response body schemas where applicable

**Generated Documentation:** `public/openapi.json` (3,385 lines)

### Notes

- All endpoints support mock mode through `USE_MOCK_API=true` environment variable
- Cache keys follow standardized patterns for each service (opendota, dotabuff)
- TTLs are optimized based on data volatility and update frequency
- Rate limiting is implemented per service and endpoint
- All endpoints handle errors gracefully with detailed error responses
- Background job processing is available for intensive operations (match parsing)

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including endpoint integration
- **[Caching Layer](./caching-layer.md):** Cache key patterns and TTL strategies
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Rate limiting per endpoint and service
- **[Queueing Layer](./queueing-layer.md):** Background job processing for endpoints
- **[Project Structure](./project-structure.md):** Recommended folder structure for API organization
- **[Type Organization](./type-organization.md):** TypeScript types for API responses and requests
- **[OpenAPI Documentation](../../public/openapi.json):** Complete API specification with examples 
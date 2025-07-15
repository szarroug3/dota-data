# API Endpoints Documentation

This document provides comprehensive documentation for all API endpoints in the Dota 2 Data Dashboard, including request/response formats, error handling, and usage examples.

## Overview

The API follows RESTful principles with consistent patterns across all endpoints. All endpoints support:
- **Mock Mode**: Development and testing with mock data
- **Caching**: Redis-first caching with memory fallback
- **Rate Limiting**: Per-service rate limiting with graceful degradation
- **Error Handling**: Standardized error responses
- **Background Processing**: Queue-based processing for intensive operations

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for API endpoints. All endpoints are publicly accessible.

## Common Response Headers

```
Content-Type: application/json
Cache-Control: public, max-age=3600
X-Rate-Limit-Remaining: 99
X-Rate-Limit-Reset: 1640995200
```

## Error Handling

All endpoints return standardized error responses:

### 404 - Data Not Found
```json
{
  "error": "Data Not Found"
}
```

### 500 - Processing Error
```json
{
  "error": "Failed to process [resource]",
  "details": "[stack trace or error message]"
}
```

### 429 - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Endpoints

### 1. Heroes Endpoint

**GET** `/api/heroes`

Fetch and filter Dota 2 heroes with comprehensive metadata.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | boolean | No | `false` | Force refresh from external API |
| `complexity` | string | No | - | Filter by hero complexity (1, 2, 3) |
| `role` | string | No | - | Filter by role (Carry, Support, etc.) |
| `primaryAttribute` | string | No | - | Filter by primary attribute (agi, str, int) |
| `tier` | string | No | - | Filter by tier (S, A, B, C, D) |

#### Response Format

```json
{
  "heroes": [
    {
      "id": 1,
      "name": "Anti-Mage",
      "localized_name": "Anti-Mage",
      "primary_attr": "agi",
      "attack_type": "Melee",
      "roles": ["Carry", "Escape", "Nuker"],
      "complexity": 1,
      "tier": "S",
      "img": "antimage.png",
      "icon": "antimage_icon.png",
      "base_health": 200,
      "base_mana": 75,
      "base_armor": 2,
      "base_attack_min": 29,
      "base_attack_max": 33,
      "move_speed": 310,
      "turn_rate": 0.6,
      "legs": 2
    }
  ],
  "total": 124,
  "filtered": 1
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/heroes?complexity=1&role=Carry"
```

#### Example Response

```json
{
  "heroes": [
    {
      "id": 1,
      "name": "Anti-Mage",
      "localized_name": "Anti-Mage",
      "primary_attr": "agi",
      "attack_type": "Melee",
      "roles": ["Carry", "Escape", "Nuker"],
      "complexity": 1,
      "tier": "S"
    }
  ],
  "total": 124,
  "filtered": 1
}
```

#### Cache Information

- **Cache Key**: `opendota:heroes`
- **TTL**: 7 days
- **Mock File**: `mock-data/heroes.json`

---

### 2. Players Endpoint

**GET** `/api/players/{id}`

Fetch comprehensive player profile and statistics.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Player's Steam ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | boolean | No | `false` | Force refresh from external API |
| `view` | string | No | `overview` | View mode (overview, detailed, matches) |
| `includeMatches` | boolean | No | `false` | Include recent matches |
| `includeHeroes` | boolean | No | `false` | Include hero statistics |
| `includeRecent` | boolean | No | `false` | Include recent performance |

#### Response Format

```json
{
  "profile": {
    "account_id": 123456789,
    "personaname": "PlayerName",
    "name": "Player Name",
    "plus": true,
    "cheese": 0,
    "steamid": "76561198012345678",
    "avatar": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "avatarmedium": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "profileurl": "https://steamcommunity.com/id/...",
    "last_login": "2024-01-15T10:30:00Z",
    "loccountrycode": "US",
    "is_contributor": false,
    "is_subscriber": false,
    "real_name": "Real Name"
  },
  "stats": {
    "total_matches": 1500,
    "wins": 850,
    "losses": 650,
    "win_rate": 56.67,
    "avg_kills": 8.5,
    "avg_deaths": 6.2,
    "avg_assists": 12.1,
    "avg_gpm": 450,
    "avg_xpm": 520,
    "rank_tier": 70,
    "competitive_rank": 4500
  },
  "recent_matches": [
    {
      "match_id": 1234567890,
      "hero_id": 1,
      "hero_name": "Anti-Mage",
      "kills": 12,
      "deaths": 3,
      "assists": 8,
      "gpm": 650,
      "xpm": 720,
      "result": "win",
      "duration": 2400,
      "start_time": 1640995200
    }
  ],
  "heroes": [
    {
      "hero_id": 1,
      "hero_name": "Anti-Mage",
      "games": 45,
      "wins": 28,
      "win_rate": 62.22,
      "avg_kills": 9.2,
      "avg_deaths": 4.1,
      "avg_assists": 6.8
    }
  ]
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/players/123456789?view=detailed&includeMatches=true"
```

#### Example Response

```json
{
  "profile": {
    "account_id": 123456789,
    "personaname": "PlayerName",
    "name": "Player Name",
    "plus": true,
    "steamid": "76561198012345678",
    "avatar": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/...",
    "loccountrycode": "US"
  },
  "stats": {
    "total_matches": 1500,
    "wins": 850,
    "losses": 650,
    "win_rate": 56.67,
    "avg_kills": 8.5,
    "avg_deaths": 6.2,
    "avg_assists": 12.1,
    "rank_tier": 70
  },
  "recent_matches": [
    {
      "match_id": 1234567890,
      "hero_id": 1,
      "hero_name": "Anti-Mage",
      "kills": 12,
      "deaths": 3,
      "assists": 8,
      "result": "win",
      "duration": 2400
    }
  ]
}
```

#### Cache Information

- **Cache Key**: `opendota:player:{id}`
- **TTL**: 24 hours
- **Mock File**: `mock-data/player-{id}.json`

---

### 3. Teams Endpoint

**GET** `/api/teams/{id}`

Fetch team data and comprehensive statistics.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Team ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | boolean | No | `false` | Force refresh from external API |
| `view` | string | No | `overview` | View mode (overview, detailed, matches) |
| `includeMatches` | boolean | No | `false` | Include recent matches |
| `includeRoster` | boolean | No | `false` | Include team roster |

#### Response Format

```json
{
  "team": {
    "team_id": 123456,
    "name": "Team Name",
    "tag": "TAG",
    "logo_url": "https://cdn.dota2.com/apps/dota2/images/team_logos/...",
    "country_code": "US",
    "url": "https://www.dotabuff.com/teams/123456",
    "sponsor": "Sponsor Name",
    "total_earnings": 50000,
    "formed_at": "2020-01-01T00:00:00Z"
  },
  "stats": {
    "total_matches": 150,
    "wins": 95,
    "losses": 55,
    "win_rate": 63.33,
    "avg_match_duration": 2400,
    "total_earnings": 50000,
    "tournaments_won": 3,
    "tournaments_played": 12
  },
  "roster": [
    {
      "account_id": 123456789,
      "name": "Player Name",
      "role": "Carry",
      "join_date": "2020-01-01T00:00:00Z",
      "leave_date": null
    }
  ],
  "recent_matches": [
    {
      "match_id": 1234567890,
      "opponent": "Opponent Team",
      "result": "win",
      "score": "2-1",
      "tournament": "Tournament Name",
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/teams/123456?view=detailed&includeRoster=true"
```

#### Example Response

```json
{
  "team": {
    "team_id": 123456,
    "name": "Team Name",
    "tag": "TAG",
    "logo_url": "https://cdn.dota2.com/apps/dota2/images/team_logos/...",
    "country_code": "US",
    "total_earnings": 50000
  },
  "stats": {
    "total_matches": 150,
    "wins": 95,
    "losses": 55,
    "win_rate": 63.33,
    "total_earnings": 50000
  },
  "roster": [
    {
      "account_id": 123456789,
      "name": "Player Name",
      "role": "Carry",
      "join_date": "2020-01-01T00:00:00Z"
    }
  ]
}
```

#### Cache Information

- **Cache Key**: `dotabuff:team:{id}`
- **TTL**: 6 hours
- **Mock File**: `mock-data/team-{id}.html`

---

### 4. Matches Endpoint

**GET** `/api/matches/{id}`

Fetch detailed match data and statistics.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Match ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | boolean | No | `false` | Force refresh from external API |
| `parsed` | boolean | No | `false` | Request parsed match data |
| `view` | string | No | `overview` | View mode (overview, detailed, players) |

#### Response Format

```json
{
  "match": {
    "match_id": 1234567890,
    "radiant_win": true,
    "duration": 2400,
    "start_time": 1640995200,
    "game_mode": 1,
    "lobby_type": 0,
    "human_players": 10,
    "league_id": 123,
    "league_name": "Tournament Name",
    "series_id": 456,
    "series_type": 1,
    "radiant_team_id": 123456,
    "radiant_name": "Radiant Team",
    "dire_team_id": 789012,
    "dire_name": "Dire Team",
    "radiant_score": 2,
    "dire_score": 1
  },
  "players": [
    {
      "account_id": 123456789,
      "player_slot": 0,
      "hero_id": 1,
      "hero_name": "Anti-Mage",
      "kills": 12,
      "deaths": 3,
      "assists": 8,
      "leaver_status": 0,
      "gold": 25000,
      "last_hits": 200,
      "denies": 5,
      "gold_per_min": 625,
      "xp_per_min": 720,
      "gold_spent": 22000,
      "hero_damage": 15000,
      "tower_damage": 5000,
      "hero_healing": 0,
      "level": 25,
      "item_0": 29,
      "item_1": 30,
      "item_2": 31,
      "item_3": 32,
      "item_4": 33,
      "item_5": 34
    }
  ],
  "picks_bans": [
    {
      "is_pick": true,
      "hero_id": 1,
      "team": 0,
      "order": 0
    }
  ],
  "objectives": [
    {
      "time": 600,
      "type": "building_kill",
      "unit": "npc_dota_creep_goodguys_melee",
      "key": 0,
      "slot": 0,
      "player_slot": 0,
      "unit_type": "building",
      "building_type": "tower4_top",
      "x": 2000,
      "y": 2000
    }
  ]
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/matches/1234567890?view=detailed&parsed=true"
```

#### Example Response

```json
{
  "match": {
    "match_id": 1234567890,
    "radiant_win": true,
    "duration": 2400,
    "start_time": 1640995200,
    "game_mode": 1,
    "radiant_team_id": 123456,
    "radiant_name": "Radiant Team",
    "dire_team_id": 789012,
    "dire_name": "Dire Team",
    "radiant_score": 2,
    "dire_score": 1
  },
  "players": [
    {
      "account_id": 123456789,
      "player_slot": 0,
      "hero_id": 1,
      "hero_name": "Anti-Mage",
      "kills": 12,
      "deaths": 3,
      "assists": 8,
      "gold_per_min": 625,
      "xp_per_min": 720,
      "level": 25
    }
  ]
}
```

#### Cache Information

- **Cache Key**: `opendota:match:{id}`
- **TTL**: 14 days
- **Mock File**: `mock-data/match-{id}-parsed.json`

---

### 5. Match Parse Endpoint

**POST** `/api/matches/{id}/parse`

Parse match data through background job processing.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Match ID |

#### Request Body

```json
{
  "priority": "normal",
  "timeout": 300
}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `priority` | string | No | `normal` | Job priority (low, normal, high) |
| `timeout` | number | No | `300` | Job timeout in seconds |

#### Response Format

```json
{
  "job_id": "job_123456789",
  "status": "queued",
  "match_id": 1234567890,
  "estimated_completion": "2024-01-15T11:00:00Z",
  "message": "Match parsing job queued successfully"
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/matches/1234567890/parse" \
  -H "Content-Type: application/json" \
  -d '{"priority": "high", "timeout": 600}'
```

#### Example Response

```json
{
  "job_id": "job_123456789",
  "status": "queued",
  "match_id": 1234567890,
  "estimated_completion": "2024-01-15T11:00:00Z",
  "message": "Match parsing job queued successfully"
}
```

#### Background Processing

- **Real Mode**: Fetches from external API and polls for completion
- **Mock Mode**: Immediately returns processed mock data
- **Queue Management**: Uses QStash with memory fallback
- **Job Tracking**: Status tracking and completion monitoring

---

### 6. Leagues Endpoint

**GET** `/api/leagues/{id}`

Fetch league tournament data and statistics.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | League ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `force` | boolean | No | `false` | Force refresh from external API |
| `includeMatches` | boolean | No | `false` | Include tournament matches |
| `view` | string | No | `overview` | View mode (overview, detailed, matches) |

#### Response Format

```json
{
  "league": {
    "league_id": 123,
    "name": "Tournament Name",
    "tier": "S",
    "region": "International",
    "url": "https://www.dotabuff.com/leagues/123",
    "description": "Tournament description",
    "tournament_url": "https://www.tournament.com",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-15T00:00:00Z",
    "status": "ongoing",
    "prize_pool": 1000000,
    "prize_pool_currency": "USD"
  },
  "teams": [
    {
      "team_id": 123456,
      "name": "Team Name",
      "tag": "TAG",
      "logo_url": "https://cdn.dota2.com/apps/dota2/images/team_logos/...",
      "wins": 5,
      "losses": 2,
      "draws": 0,
      "points": 15,
      "position": 1
    }
  ],
  "matches": [
    {
      "match_id": 1234567890,
      "team1": "Team A",
      "team2": "Team B",
      "team1_score": 2,
      "team2_score": 1,
      "winner": "Team A",
      "date": "2024-01-10T10:30:00Z",
      "stage": "Group Stage",
      "best_of": 3
    }
  ]
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/leagues/123?view=detailed&includeMatches=true"
```

#### Example Response

```json
{
  "league": {
    "league_id": 123,
    "name": "Tournament Name",
    "tier": "S",
    "region": "International",
    "prize_pool": 1000000,
    "status": "ongoing"
  },
  "teams": [
    {
      "team_id": 123456,
      "name": "Team Name",
      "tag": "TAG",
      "wins": 5,
      "losses": 2,
      "points": 15,
      "position": 1
    }
  ],
  "matches": [
    {
      "match_id": 1234567890,
      "team1": "Team A",
      "team2": "Team B",
      "team1_score": 2,
      "team2_score": 1,
      "winner": "Team A",
      "date": "2024-01-10T10:30:00Z"
    }
  ]
}
```

#### Cache Information

- **Cache Key**: `dotabuff:league:{id}`
- **TTL**: 7 days
- **Mock File**: `mock-data/league-{id}.html`

---

### 7. Cache Invalidate Endpoint

**POST** `/api/cache/invalidate`

Manual cache invalidation and management.

#### Request Body

```json
{
  "pattern": "opendota:*",
  "keys": ["opendota:heroes", "opendota:player:123456789"]
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pattern` | string | No | Redis pattern for bulk invalidation |
| `keys` | array | No | Specific cache keys to invalidate |

#### Response Format

```json
{
  "invalidated_keys": 15,
  "invalidated_patterns": ["opendota:*"],
  "cache_stats": {
    "total_keys": 100,
    "memory_usage": "50MB",
    "hit_rate": 85.5
  },
  "message": "Cache invalidation completed successfully"
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/cache/invalidate" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "opendota:heroes"}'
```

#### Example Response

```json
{
  "invalidated_keys": 1,
  "invalidated_patterns": ["opendota:heroes"],
  "cache_stats": {
    "total_keys": 99,
    "memory_usage": "49MB",
    "hit_rate": 85.5
  },
  "message": "Cache invalidation completed successfully"
}
```

#### GET Method

**GET** `/api/cache/invalidate`

Get cache statistics and status.

#### Response Format

```json
{
  "cache_stats": {
    "total_keys": 100,
    "memory_usage": "50MB",
    "hit_rate": 85.5,
    "backend": "redis"
  },
  "rate_limits": {
    "opendota": {
      "remaining": 95,
      "reset_time": 1640995200
    },
    "dotabuff": {
      "remaining": 98,
      "reset_time": 1640995200
    }
  }
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting per service:

| Service | Rate Limit | Window | Description |
|---------|------------|--------|-------------|
| OpenDota | 100 requests | 1 minute | Hero, player, match data |
| Dotabuff | 50 requests | 1 minute | Team, league data |

Rate limit headers are included in all responses:
- `X-Rate-Limit-Remaining`: Remaining requests in current window
- `X-Rate-Limit-Reset`: Unix timestamp when rate limit resets

## Mock Mode

Enable mock mode by setting the environment variable:
```bash
USE_MOCK_API=true
```

In mock mode:
- All endpoints return mock data from local files
- No external API calls are made
- Rate limiting is simulated
- Cache behavior is preserved

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md)**: Complete backend data flow architecture
- **[Endpoint Summary](./endpoint-summary.md)**: Quick reference for all endpoints
- **[Caching Layer](./caching-layer.md)**: Cache key patterns and TTL strategies
- **[Rate Limiting Layer](./rate-limiting-layer.md)**: Rate limiting implementation
- **[Queueing Layer](./queueing-layer.md)**: Background job processing
- **[Frontend API Integration](../frontend/api-integration.md)**: Frontend integration guide 
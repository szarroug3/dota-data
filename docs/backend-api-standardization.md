# Backend API Standardization Plan

## Overview

This document outlines the comprehensive plan to standardize all backend API routes and services in the Dota data project. The goal is to create a consistent, maintainable API structure that maps directly to external service endpoints while providing clean, processed data to the frontend.

## Key Principles

1. **Direct Mapping**: Routes should map directly to external service endpoints (OpenDota, Dotabuff)
2. **Consistent Patterns**: All routes follow the same implementation pattern
3. **Service Layer**: Routes call services, services handle data fetching/processing
4. **Deterministic Mock Data**: Fake data generation uses real templates with deterministic logic
5. **Proper Caching**: Cache-first approach with force refresh option
6. **Type Safety**: Separate external types from route response types
7. **Frontend Integration**: Support for league filtering and real-time updates

## API Route Structure

### Player Routes (OpenDota)
All routes map directly to OpenDota endpoints:

- `/api/players/[id]` → `/players/{account_id}` (basic player data)
- `/api/players/[id]/matches` → `/players/{account_id}/matches` (match history)
- `/api/players/[id]/heroes` → `/players/{account_id}/heroes` (hero stats)
- `/api/players/[id]/recentMatches` → `/players/{account_id}/recentMatches` (recent matches)
- `/api/players/[id]/wl` → `/players/{account_id}/wl` (win/loss record)
- `/api/players/[id]/totals` → `/players/{account_id}/totals` (player totals)
- `/api/players/[id]/counts` → `/players/{account_id}/counts` (player counts)

### Match Routes (OpenDota)
- `/api/matches/[id]` → `/matches/{match_id}` (match data)

### Hero Routes (OpenDota)
- `/api/heroes` → `/heroes` (all heroes data)

### Item Routes (OpenDota)
- `/api/items` → `/constants/items` (all items data)

### Team Routes (Dotabuff Only)
- `/api/teams/[id]` → Dotabuff team page parsing (team data + all matches)

### League Routes (Dotabuff Only)
- `/api/leagues/[id]` → Dotabuff league page parsing (league data)

## Route Implementation Pattern

All routes follow this standardized pattern:

```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Parse request body for force option
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    // Use default force=false
  }

  // 2. Check cache first (unless force=true)
  if (!force) {
    const cached = await cacheService.get(cacheKey, filename, TTL);
    if (cached) return new Response(JSON.stringify(cached), { status: 200 });
  }

  // 3. Invalidate cache if force refresh
  if (force) {
    await cacheService.invalidate(cacheKey, filename);
  }

  // 4. Call service layer
  try {
    const data = await serviceFunction(Number(id), force);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
  }
}
```

## Frontend Integration Requirements

### League Filtering Support
The backend provides comprehensive data that the frontend filters by league:

1. **Team Data Structure**: `/api/teams/[id]` returns all matches organized by league
2. **Frontend Filtering**: Frontend selects league and filters displayed data
3. **League Validation**: Frontend validates league exists using `/api/leagues/[id]`
4. **Background Processing**: Frontend starts background fetching of filtered matches

### Real-Time Updates
The backend supports real-time frontend updates:

1. **Immediate Response**: All endpoints return data immediately (no polling)
2. **Background Processing**: Frontend can start background jobs for additional data
3. **Context Updates**: Frontend contexts update in real-time as data loads
4. **Loading States**: Frontend shows skeleton loading states during data fetching

### Error Handling
Standardized error responses for frontend integration:

1. **HTTP Status Codes**: 200 (success), 400 (bad request), 500 (server error)
2. **Error Messages**: Clear error messages for debugging
3. **League Validation**: Specific errors for missing leagues
4. **Empty States**: Support for empty data scenarios

## Type Naming Convention

### External Service Types
- `OpenDotaPlayer` - Raw OpenDota player data
- `OpenDotaMatch` - Raw OpenDota match data
- `OpenDotaPlayerHeroes` - Raw OpenDota player heroes data
- `OpenDotaHero` - Raw OpenDota hero data
- `OpenDotaItems` - Raw OpenDota items data
- `DotabuffTeam` - Raw Dotabuff team data
- `DotabuffLeague` - Raw Dotabuff league data

### Route Response Types
- `Player` - Processed player data for frontend
- `Match` - Processed match data for frontend
- `PlayerHeroes` - Processed player heroes data
- `Hero` - Processed hero data for frontend
- `Items` - Processed items data for frontend
- `Team` - Processed team data for frontend
- `League` - Processed league data for frontend

## Real Data Collection ✅ COMPLETED

### OpenDota API Data Collected
Using API key from `.env.development.local`, the following real data has been collected and saved to `real-data/` folder:

#### Player Data (ID: 40927904)
- `player-40927904.json` - Basic player profile (664 bytes)
- `player-matches-40927904.json` - All player matches (2.5MB)
- `player-recent-matches-40927904.json` - Recent matches (8.7KB)
- `player-rankings-40927904.json` - Player rankings (10.7KB)
- `player-ratings-40927904.json` - Player ratings (28.5KB)
- `player-wl-40927904.json` - Win/loss record (24 bytes)
- `player-totals-40927904.json` - Player totals (1.3KB)
- `player-counts-40927904.json` - Player counts (2.2KB)
- `player-heroes-40927904.json` - Player hero statistics (16.3KB)

#### Match Data
- `match-8054301932.json` - Detailed match information (17.8KB)

#### Heroes Data
- `heroes.json` - All heroes information (21.6KB)

#### Items Data
- `items.json` - All items information (TBD)

#### Existing Dotabuff Data
- `team-9517508.html` - Team data from Dotabuff (39.5KB)
- `league-16435.html` - League data from Dotabuff (135.9KB)

### Data Collection Process
```bash
# Player data collection
curl -H "Authorization: Bearer 6EFD142E831FF01907E739C9389D620B" \
  "https://api.opendota.com/api/players/40927904" > real-data/player-40927904.json

# Match data collection
curl -H "Authorization: Bearer 6EFD142E831FF01907E739C9389D620B" \
  "https://api.opendota.com/api/matches/8054301932" > real-data/match-8054301932.json

# Heroes data collection
curl -H "Authorization: Bearer 6EFD142E831FF01907E739C9389D620B" \
  "https://api.opendota.com/api/heroes" > real-data/heroes.json

# Items data collection
curl -H "Authorization: Bearer 6EFD142E831FF01907E739C9389D620B" \
  "https://api.opendota.com/api/constants/items" > real-data/items.json
```

## Mock Data Generation

### Real Data Templates ✅ COMPLETED
Using real data from OpenDota API as templates:
- `real-data/player-40927904.json` - Player data template
- `real-data/player-matches-40927904.json` - Player matches template
- `real-data/player-heroes-40927904.json` - Player heroes template
- `real-data/match-8054301932.json` - Match data template
- `real-data/team-9517508.html` - Dotabuff team template
- `real-data/league-16435.html` - Dotabuff league template

### Deterministic Logic
- Same player ID always gets same name/avatar
- Same match ID always gets same teams/players
- Same hero ID always gets same hero name
- Unique players in matches (no duplicates)
- Valid hero IDs and match IDs
- Consistent team IDs and names

### Folder Structure
```
data-cache/
├── players/
├── matches/
├── heroes/
├── teams/
└── leagues/

mock-data/
├── players/
├── matches/
├── heroes/
├── teams/
└── leagues/

real-data/
├── players/
├── matches/
├── heroes/
├── teams/
└── leagues/
```

### Mock Data Generation

- Fake data generation is now split into smaller files by entity type (e.g., hero-generator.ts, match-generator.ts, etc.)
- The large src/lib/fake-data-generator.ts file has been removed; use the smaller files directly for all mock data needs

## ✅ Phase 2: Service Layer Updates - COMPLETED

### Key Changes Made
- **Removed Queued Responses**: All services now return actual data or throw errors instead of returning status objects
- **Standardized Function Signatures**: All functions return `Promise<T>` instead of `Promise<T | { status: string; signature: string }>`
- **Updated Fake Data Generators**: All services now use the new modular fake data generators
- **Type Safety**: Ensured complete type safety across all service functions
- **Error Handling**: Standardized error handling patterns across all services
- **Utility Files**: Created missing utility files for fake data generation:
  - `src/lib/fake-data-generators/utils/fake-data-helpers.ts`
  - `src/lib/fake-data-generators/utils/real-data-helpers.ts`

### Services Updated
- ✅ `src/lib/api/opendota/players.ts` - Removed queued responses, updated to use new fake data generators
- ✅ `src/lib/api/opendota/matches.ts` - Removed queued responses, updated to use new fake data generators
- ✅ `src/lib/api/opendota/heroes.ts` - Removed queued responses, updated to use new fake data generators
- ✅ `src/lib/api/opendota/items.ts` - Already using new pattern, updated to use new fake data generators
- ✅ `src/lib/api/opendota/teams.ts` - Updated to use new fake data generators (REMOVED in Phase 3)
- ✅ `src/lib/api/dotabuff/teams.ts` - Updated to use new fake data generators
- ✅ `src/lib/api/dotabuff/leagues.ts` - Updated to use new fake data generators

### Benefits Achieved
- **Consistent API**: All services follow the same pattern and return consistent data types
- **Better Error Handling**: Clear error propagation instead of status objects
- **Maintainable Code**: Modular fake data generators are easier to maintain and update
- **Type Safety**: Complete type safety across all service functions
- **Backward Compatibility**: Existing API calls continue to work with the new structure

## Service Layer Updates

### Player Services
- Remove queued status responses
- Ensure all functions return actual data or throw errors
- Add service functions for each endpoint

### Match Services
- Remove queued status handling
- Update to follow new pattern

### Hero Services
- Create new service for heroes data fetching

### Item Services
- Create new service for items data fetching

### Team Services
- Merge team matches logic into main team function
- Remove OpenDota team references
- Ensure Dotabuff-only implementation

### League Services
- Create new service for league data fetching

## Frontend Integration Patterns

### Team Import Flow
1. Frontend calls `/api/teams/[id]` and `/api/leagues/[id]` in parallel
2. Backend returns comprehensive team data with all matches organized by league
3. Frontend validates league exists in team data
4. Frontend starts background fetching of filtered matches
5. Frontend extracts player IDs and fetches player data for active team players
6. Frontend updates contexts in real-time as data loads

### Match History Flow
1. Frontend uses league-filtered match IDs from team data
2. Frontend fetches all matches in parallel using `/api/matches/[id]`
3. Frontend displays matches as they load with skeleton loading states
4. Frontend handles empty states for leagues with no matches

### Player Stats Flow
1. Frontend uses player IDs from active team
2. Frontend fetches player data using new endpoints:
   - `/api/players/[id]` - Basic player data
   - `/api/players/[id]/matches` - Match history
   - `/api/players/[id]/heroes` - Hero statistics
   - `/api/players/[id]/totals` - Player totals
   - `/api/players/[id]/wl` - Win/loss record
3. Frontend displays player statistics in real-time
4. Frontend handles loading and error states

### Error Handling Patterns
- **League Validation**: Frontend validates league exists before proceeding
- **Empty States**: Generic "No matches found for this league" messages
- **Manual Add**: Support for manual match/player addition
- **Clear Errors**: Specific error messages for debugging

### Real-Time Updates
- **Context Updates**: Frontend contexts update as data loads
- **Skeleton Loading**: Show skeleton states during data fetching
- **Progressive Display**: Display data as it becomes available
- **Responsive UI**: Maintain responsive interface throughout

## Testing and Validation

### API Testing
```bash
# Test teams endpoint
curl -X POST http://localhost:3000/api/teams/9517508 \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Test player endpoints
curl -X POST http://localhost:3000/api/players/40927904 \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Test heroes endpoint
curl -X POST http://localhost:3000/api/heroes \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

### Frontend Integration Testing
- Test league filtering functionality
- Test real-time data updates
- Test error handling scenarios
- Test empty state handling
- Test background data fetching

## Documentation Updates

### Frontend Integration Guide
- League filtering implementation details
- Real-time update patterns
- Error handling strategies
- Background data fetching approach

### API Reference
- Updated endpoint documentation
- Request/response examples
- Error code definitions
- League filtering documentation

This comprehensive plan ensures the backend API standardization supports all frontend requirements while maintaining clean, maintainable code and providing excellent user experience. 
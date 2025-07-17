# Frontend Contexts

This document outlines the context patterns, data flow, and state management for the Dota 2 Data Dashboard frontend.

## Table of Contents

- [Contexts Summary](#contexts-summary)
- [Data Fetching Contexts](#data-fetching-contexts)
- [Data Management Contexts](#data-management-contexts)
- [Context Integration](#context-integration)
- [State Management Patterns](#state-management-patterns)

## Contexts Summary

| Context Name                | Main Responsibility                        | Type |
|-----------------------------|--------------------------------------------|------|
| TeamDataFetchingContext     | Fetches and manages team data              | Data Fetching |
| MatchDataFetchingContext    | Fetches and manages match data             | Data Fetching |
| PlayerDataFetchingContext   | Fetches and manages player data            | Data Fetching |
| HeroDataFetchingContext     | Fetches and manages hero data              | Data Fetching |
| CacheManagementContext      | Handles cache invalidation and refresh     | Data Fetching |
| TeamManagementContext       | Manages team state and actions             | Data Management |
| MatchDataManagementContext  | Manages match state and actions            | Data Management |
| PlayerDataManagementContext | Manages player state and actions           | Data Management |
| HeroDataManagementContext   | Manages hero state and actions             | Data Management |

## Data Fetching Contexts

These contexts handle all direct API interactions and should be the only contexts that make API calls.

### 1. `TeamDataFetchingContext`
- **Purpose:** Handles all API interactions for team-related data
- **Endpoints Used:**
  - `POST /api/teams/[id]` - Fetch team data with matches and summary
  - `POST /api/leagues/[id]` - Fetch league metadata
- **Provides:**
  - `fetchTeamData: (teamId: string, force?: boolean) => Promise<TeamData>`
  - `fetchLeagueData: (leagueId: string, force?: boolean) => Promise<LeagueData>`
  - Error and loading state management for all operations
- **Used by:** Team Management Page, Dashboard Page, Team Analysis Page

### 2. `MatchDataFetchingContext`
- **Purpose:** Handles all API interactions for match-related data
- **Endpoints Used:**
  - `POST /api/matches/[id]` - Fetch detailed match data
  - `POST /api/matches/[id]/parse` - Request match parsing
- **Provides:**
  - `fetchMatchData: (matchId: string, force?: boolean) => Promise<MatchData>`
  - `parseMatch: (matchId: string) => Promise<MatchData>`
  - Error and loading state management for all operations
- **Used by:** Match History Page, Team Analysis Page, Draft Suggestions Page

### 3. `PlayerDataFetchingContext`
- **Purpose:** Handles all API interactions for player-related data
- **Endpoints Used:**
  - `POST /api/players/[id]` - Fetch player data
  - `POST /api/players/[id]/heroes` - Fetch player heroes
  - `POST /api/players/[id]/counts` - Fetch player counts
  - `POST /api/players/[id]/totals` - Fetch player totals
  - `POST /api/players/[id]/wl` - Fetch player win/loss
  - `POST /api/players/[id]/recentMatches` - Fetch player recent matches
- **Provides:**
  - `fetchPlayerData: (playerId: string, force?: boolean) => Promise<PlayerData>`
  - `fetchPlayerHeroes: (playerId: string, force?: boolean) => Promise<PlayerHeroData[]>`
  - `fetchPlayerCounts: (playerId: string, force?: boolean) => Promise<PlayerCountData>`
  - `fetchPlayerTotals: (playerId: string, force?: boolean) => Promise<PlayerTotalData>`
  - `fetchPlayerWL: (playerId: string, force?: boolean) => Promise<PlayerWLData>`
  - `fetchPlayerRecentMatches: (playerId: string, force?: boolean) => Promise<PlayerRecentMatchData[]>`
  - Error and loading state management for all operations
- **Used by:** Player Stats Page, Team Analysis Page

### 4. `HeroDataFetchingContext`
- **Purpose:** Handles all API interactions for hero-related data
- **Endpoints Used:**
  - `GET /api/heroes` - Fetch all heroes data
- **Provides:**
  - `fetchHeroesData: (force?: boolean) => Promise<HeroData[]>`
  - Error and loading state management for all operations
- **Used by:** Draft Suggestions Page, Player Stats Page, Team Analysis Page

### 5. `CacheManagementContext`
- **Purpose:** Handles cache invalidation and management
- **Endpoints Used:**
  - `POST /api/cache/invalidate` - Invalidate cache entries
- **Provides:**
  - `invalidateCache: (cacheKey: string) => Promise<void>`
  - `invalidateAllCache: () => Promise<void>`
  - Error and loading state management for all operations
- **Used by:** All pages for cache management and data refresh

## Data Management Contexts

These contexts manage application state, filtering, and derived data. They use data fetching contexts but never make API calls directly.

### 1. `TeamManagementContext`
- **Purpose:** Manages team state, active team, and team management actions
- **Uses:** TeamDataFetchingContext
- **Provides:**
  - `teams: Team[]`
  - `activeTeamId: string | null`
  - `setActiveTeam: (teamId: string) => void`
  - `addTeam: (teamId: string, leagueId: string) => Promise<void>`
  - `removeTeam: (teamId: string) => Promise<void>`
  - `refreshTeam: (teamId: string) => Promise<void>`
  - `updateTeam: (teamId: string) => Promise<void>`
- **Used by:** Team Management Page, Dashboard Page, Team Analysis Page

### 2. `MatchDataManagementContext`
- **Purpose:** Manages match data state, filtering, and derived data
- **Uses:** MatchDataFetchingContext
- **Provides:**
  - `matches: Match[]`
  - `filteredMatches: Match[]`
  - `hiddenMatchIds: string[]`
  - `filters: MatchFilters`
  - `setFilters: (filters: MatchFilters) => void`
  - `selectMatch: (matchId: string) => void`
  - `selectedMatchId: string | null`
  - `heroStatsGrid: HeroStatsGrid`
  - `hideMatch: (matchId: string) => void`
  - `showMatch: (matchId: string) => void`
- **Used by:** Match History Page, Dashboard Page, Team Analysis Page

### 3. `PlayerDataManagementContext`
- **Purpose:** Manages player data state, filtering, and derived data
- **Uses:** PlayerDataFetchingContext
- **Provides:**
  - `players: Player[]`
  - `filteredPlayers: Player[]`
  - `selectedPlayerId: string | null`
  - `playerStats: PlayerStats`
  - `setSelectedPlayer: (playerId: string) => void`
  - `addPlayer: (playerId: string) => Promise<void>`
  - `removePlayer: (playerId: string) => Promise<void>`
- **Used by:** Player Stats Page, Team Analysis Page

### 4. `HeroDataManagementContext`
- **Purpose:** Manages hero data state and derived data
- **Uses:** HeroDataFetchingContext
- **Provides:**
  - `heroes: Hero[]`
  - `heroStats: HeroStats`
  - `filteredHeroes: Hero[]`
  - `setHeroFilters: (filters: HeroFilters) => void`
- **Used by:** Draft Suggestions Page, Player Stats Page, Team Analysis Page

## Context Integration

### Context Hierarchy
```
Root Layout
├── TeamManagementContext (manages active team)
├── TeamDataFetchingContext (fetches team data)
├── MatchDataManagementContext (manages match state)
├── MatchDataFetchingContext (fetches match data)
├── PlayerDataManagementContext (manages player state)
├── PlayerDataFetchingContext (fetches player data)
├── HeroDataManagementContext (manages hero state)
├── HeroDataFetchingContext (fetches hero data)
└── CacheManagementContext (manages cache)
```

### Context Dependencies
- **Data Management Contexts** depend on **Data Fetching Contexts**
- **Data Fetching Contexts** are independent of each other
- **CacheManagementContext** is used by all other contexts
- **TeamManagementContext** is the primary context that others depend on

### Context Initialization
1. **TeamManagementContext** initializes first (loads from localStorage)
2. **Data Fetching Contexts** initialize independently
3. **Data Management Contexts** initialize after their corresponding fetching contexts
4. **CacheManagementContext** initializes last

## State Management Patterns

### Data Flow Pattern
```
User Action → Context Method → API Call → State Update → UI Re-render
```

### Error Handling Pattern
```
API Call → Error → Context Error State → UI Error Display → User Recovery Action
```

### Loading State Pattern
```
API Call → Loading State → Data Received → State Update → Loading Complete
```

### Cache Integration Pattern
```
API Call → Check Cache → Cache Hit/Miss → Fetch if needed → Update Cache → Return Data
```

### Optimistic Updates Pattern
```
User Action → Optimistic UI Update → API Call → Success/Error → Confirm/Revert UI
```

## Related Documentation

- **[Overview](./overview.md)**: Universal requirements and principles
- **[Pages](./pages.md)**: Page architecture and routing
- **[Components](./components.md)**: Component patterns and organization
- **[UI Standards](./ui-standards.md)**: UI patterns and accessibility
- **[Backend Data Flow](../backend/data-flow.md)**: Backend integration patterns 
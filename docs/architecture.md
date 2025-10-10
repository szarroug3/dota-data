# Architecture

## Overview & Principles

- **Separation of concerns**: Frontend UI lives in `src/frontend/`; backend API routes live in `src/app/api/`. They interact only via HTTP.
- **Shared contracts**: Cross-cutting types and schemas live in `src/types/`; shared utilities in `src/lib/`. Client code does not import server-only modules.
- **Accessibility**: UI adheres to WCAG 2.1, semantic HTML, ARIA where appropriate, keyboard and screen reader support.
- **Code quality**: Zero lint warnings, strict typing (no `any`), no dynamic imports; imports at file top; camelCase.
- **No backend guessing**: API routes retrieve and organize data only; no inferred calculations beyond shaping responses.

## Directory Structure

- **Backend**: `src/app/api/`
- **Frontend**: `src/frontend/`
- **Frontend libs**: `src/frontend/lib/`
- **Shared libraries**: `src/lib/`
- **Types & validation**: `src/types/` and `src/types/api-zod/`
- **Mock fixtures**: `mock-data/`
- **Tests**: `src/tests/`

## Frontend Architecture: Simple Data Store

### **Core Principle**

- **Single Data Store**: All data in one place (`AppData` class in `src/frontend/lib/app-data.ts`)
- **Simple Contexts**: Just wrap the store, no complex state management
- **Computed Data**: Pre-calculated and stored, not computed in UI
- **Easy to Find**: Everything in 3 files total

### **File Structure**

```
src/
  frontend/
    lib/
      app-data.ts          // Single AppData class - ~500 lines
  contexts/
    app-data-context.tsx   // Simple React context wrapper - ~50 lines
  hooks/
    use-app-data.ts        // Simple hook - ~50 lines
```

### **AppData Class Structure**

The `AppData` class is the single source of truth for all application data:

#### Core Data Maps

- `teams: Map<string, Team>` - All teams (key: `${teamId}-${leagueId}`)
- `matches: Map<number, Match>` - All matches (key: matchId)
- `players: Map<number, Player>` - All players (key: playerId)
- `heroes: Map<number, Hero>` - All heroes (key: heroId)
- `items: Map<string, Item>` - All items (key: itemName)
- `leagues: Map<number, League>` - All leagues (key: leagueId)

#### Manual Data Tracking

- `manualMatchIds: Set<number>` - User-added matches
- `manualPlayerIds: Set<number>` - User-added players (per team)
- `globalPlayerIds: Set<number>` - All player IDs across teams

#### UI State

- `selectedTeamId: string | null` - Currently selected team
- `selectedLeagueId: number | null` - League ID for selected team
- `selectedMatchId: number | null` - Currently selected match
- `selectedPlayerId: number | null` - Currently selected player
- `isLoading: boolean` - Global loading state
- `error: string | null` - Global error state

#### CRUD Operations

- **Teams**: `addTeam()`, `removeTeam()`, `updateTeam()`, `getTeams()`, `getTeam()`
- **Matches**: `addMatch()`, `removeMatch()`, `getMatches()`, `getMatch()`
- **Players**: `addPlayer()`, `removePlayer()`, `getPlayers()`, `getPlayer()`
- **Selection**: `setSelectedTeam()`, `setSelectedMatch()`, `setSelectedPlayer()`

#### Computed Data Methods

These compute on-the-fly, NOT stored:

- `getTeamMatches(teamId)` - Get all matches for a team
- `getTeamPlayers(teamId)` - Get all players for a team
- `getPlayerHeroStats(playerId)` - Get hero stats for a player
- `getPlayerMatches(playerId)` - Get all matches for a player
- `getAllTeamMatchIds()` - Get match IDs grouped by team

#### Data Loading Methods

These methods FETCH data from APIs:

- `loadHeroes()` - Fetch from `/api/heroes`, populate heroes map
- `loadItems()` - Fetch from `/api/items`, populate items map
- `loadLeagues()` - Fetch from `/api/leagues`, populate leagues map
- `loadTeam(teamId, leagueId)` - Fetch team/league in parallel, set as active after success
- `loadMatch(matchId)` - Fetch from `/api/matches/[id]`, add to matches map
- `loadPlayer(playerId)` - Fetch from `/api/players/[id]`, add to players map

Each loading method handles:

- Setting loading states
- Making fetch requests
- Handling errors
- Calling `notify()` to update UI

#### Persistence Methods

- `loadFromStorage()` - Hydrate teams from localStorage (team + league metadata, match/player summaries, selected team), ensure the global team exists, then kick off background refresh (active team first, remaining teams in parallel).
- `saveToStorage()` - Persist team metadata required for instant hydration (team + league info, match + player summaries, manual/hidden flags, selected team).

### **Data Persistence Strategy**

**Persisted to localStorage (for app hydration):**

- Team identity (team & league IDs, names, time added)
- Match metadata per team (result, opponent, side, duration, date, pick order, hero IDs, manual/hidden flags)
- Player metadata per team (name, rank, basic stats, top heroes, manual/hidden flags)
- Selected team ID
- User preferences

**Not persisted (fetched fresh on demand after hydration begins):**

- Full match payloads (draft, events, stats)
- Full player payloads (OpenDota responses, computed statistics)
- Hero/item/league reference data (loaded once per session)

This approach keeps enough data locally to render the UI immediately while deferring heavy API payloads to background refreshes.

### **Supporting Contexts**

The AppData context is supported by infrastructure contexts:

1. **`ThemeProvider`** - Theme management (next-themes)
2. **`ConstantsDataFetchingProvider`** - Constants data fetching orchestration
3. **`ShareProvider`** - Share mode functionality and URL state
4. **`ConfigProvider`** - Configuration and localStorage abstraction
5. **`ConstantsProvider`** - Static reference data (heroes, items, leagues)

### **Usage Pattern**

```typescript
function MyComponent() {
  const { selectedTeam, getTeamMatches, loadTeam, isLoading } = useAppData();

  // All data and operations available in one hook
}
```

### **Key Benefits**

- **Simplicity**: 3 files total instead of 20+ hook files
- **No Circular Dependencies**: Clean, simple data flow
- **Easy to Find**: Everything in one place
- **Performance**: Pre-computed data, efficient updates
- **Maintainability**: Easy to debug, test, and extend

## Data Flow

1. **App Hydration**: On load, `AppData` calls `loadFromStorage()` to restore stored team, match, and player metadata before triggering background refreshes
2. **Data Loading**: Components call `loadTeam()`, `loadMatch()`, etc. to fetch fresh data
3. **State Updates**: `AppData` methods update internal state and call `notify()`
4. **UI Updates**: React context propagates changes to subscribed components
5. **Persistence**: After mutations, `saveToStorage()` saves minimal state to localStorage

> **📋 For detailed data flow scenarios**: See `docs/data-flow-analysis.md` for comprehensive analysis of all 21 data flow scenarios including app hydration, team management, match/player operations, and error handling patterns.

## Backend (`src/app/api/`)

### Responsibilities

- Single entry point for all external API calls
- Validate inputs only (Zod schemas in `src/types/api-zod/`)
- Apply rate limiting per `src/types/rate-limit.ts`
- Coordinate caching via `src/lib/cache-service.ts` and `src/lib/cache-backends/*`
- Return pass-through data from external APIs; avoid business calculations

### Conventions

- One route group per family: `teams`, `players`, `matches`, `constants`
- Error handling maps to consistent JSON error shapes
- Keep route handlers thin; move reusable logic to `src/lib/`

### Backend Types & Data Handling

- **Data Flow Principle**: Routes should get data and return it without modifying it
- **Type Naming Convention**: Types for each service should be named `[Service][Type]`
  - Example: A list of Steam matches would be `SteamMatches`
  - Example: A single Steam match would be `SteamMatch`
- **Validation Requirements**: All routes must include Zod validation for inputs only (since outputs are pass-through data from external APIs)
- **Mock Data Strategy**:
  - `mock-data/cached-data/` - Used to mock Redis cache responses
  - `mock-data/external-data/` - Used to mock data coming from external services
  - Mock data should mirror the structure and format of real external API responses

## Pages

### Dashboard (`src/app/dashboard/page.tsx`)

**Container**: `DashboardPageContainer`

**Responsibilities**:

- Add a team by team ID and league ID
- List teams with status (active, loading, error) and stats
- Edit team and set active team
- Refresh and remove teams

**Primary actions**:

- `loadTeam(teamId, leagueId)`, `removeTeam(teamId, leagueId)`, `setSelectedTeam(teamId)`

**Key components**:

- `AddTeamForm` - Validated inputs, duplicate prevention
- `TeamList` → `TeamCard` - Active badge, actions
- `EditTeamSheet` - Edit team IDs

### Match History (`src/app/match-history/page.tsx`)

**Container**: `MatchHistoryPageContainer`

**Responsibilities**:

- Browse matches for active team
- Filter/search matches
- View match details (Draft/Players/Events)
- Add/hide/unhide matches

**Primary actions**:

- `loadMatch(matchId)`, `removeMatch(matchId)`, `addMatch()`

**Key components**:

- `ResizableMatchLayout` - Split panel layout
- `MatchesList` - Match list/cards with filters
- `MatchDetailsPanel` - Draft, Players, Events views
- `AddMatchForm` - Add match by ID

### Player Stats (`src/app/player-stats/page.tsx`)

**Container**: `PlayerStatsPageContainer`

**Responsibilities**:

- View players for active team
- Filter/sort players
- View player details (Summary/Details/Team)
- Add/hide/unhide players

**Primary actions**:

- `loadPlayer(playerId)`, `removePlayer(playerId)`, `addPlayer()`

**Key components**:

- `ResizablePlayerLayout` - Split panel layout
- `PlayerListView` - Player list/cards
- `PlayerDetailsPanel` - Summary, Details, Team views
- `AddPlayerSheet` - Add player by ID

## Types & Validation

- **Types**: Domain/view types colocated under `src/types/**`
- **Validation**: Zod schemas in `src/types/api-zod/`
- Validate at backend boundaries only (inputs)
- API clients pass through responses without validation

## Caching

- Centralized in `src/lib/cache-service.ts`
- Backends: `src/lib/cache-backends/` (Redis, Memory, File)
- Family TTLs: players 24h, teams 24h, matches indefinite
- Cache keys: `family:resource:params:v{CACHE_VERSION}`

## Error Handling & Logging

- Use helpers in `src/utils/error-handling.ts`
- Provide meaningful error messages
- No silent failures
- Surface errors via context error fields

## Security & Configuration

- Never store secrets in plaintext
- Do not modify `.env` via code
- Frontend uses `ConfigProvider` for localStorage abstraction
- Enforce server-only modules via ESLint

## Testing

- Tests mirror source layout under `src/tests/`
- Use `pnpm` for all scripts
- Zero warnings policy: `pnpm lint`, `pnpm type-check`, `pnpm test`

## Build & CI

- Commands: `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm dev`
- PR gates: all checks must pass
- No dynamic imports
- Import boundaries respected

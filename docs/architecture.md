## Architecture

### Overview & Principles

- **Separation of concerns**: Frontend UI lives in `src/frontend/`; backend API routes live in `src/app/api/`. They interact only via HTTP.
- **Shared contracts**: Cross-cutting types and schemas live in `src/types/`; shared utilities in `src/lib/`. Client code does not import server-only modules.
- **Accessibility**: UI adheres to WCAG 2.1, semantic HTML, ARIA where appropriate, keyboard and screen reader support.
- **Code quality**: Zero lint warnings, strict typing (no `any`), no dynamic imports; imports at file top; camelCase.
- **No backend guessing**: API routes retrieve and organize data only; no inferred calculations beyond shaping responses.

### Directory Structure (high level)

- **Backend**: `src/app/api/`
- **Frontend**: `src/frontend/`
- **Frontend libs**: `src/frontend/lib/api-client/`, `src/frontend/lib/cache/`
- **Shared libraries**: `src/lib/`
- **Types & validation**: `src/types/` and `src/types/api-zod/`
- **Mock fixtures**: `mock-data/`
- **Tests**: `src/tests/`

### Data Flow

1. **Single Data Context**: `AppDataProvider` is the single source of truth for all team/match/player data
2. **Generic State Management**: Uses `EntityStateManager<T, K>` instances for teams, matches, and players
3. **Entity Managers**: Each `EntityStateManager` coordinates `LoadingStateManager`, `DataFetchingManager`, and `ErrorManager`
4. **API Layer**: `DataFetchingManager` calls frontend API client, which calls backend routes under `src/app/api/*`
5. **Backend Processing**: Backend routes call external APIs and/or cache, validate inputs, then return pass-through data
6. **Constants Management**: Heroes/items/leagues fetched via `ConstantsProvider` and used for ID translation
7. **Persistence**: Essential data persisted to localStorage for app hydration (teams list, global matches/players, selection state, user preferences)

> **📋 For detailed data flow scenarios**: See `docs/data-flow-analysis.md` for comprehensive analysis of all 21 data flow scenarios including app hydration, team management, match/player operations, and error handling patterns.

### Context Architecture

The application uses a **single data context architecture** with supporting contexts:

#### Main Data Context

- **`AppDataProvider`** - **Single source of truth** for all team/match/player data
  - Manages teams, matches, and players using generic state management
  - Handles selection state (selected team/match/player)
  - Pre-computes team-scoped data for UI consumption
  - Provides all CRUD operations for entities
  - Manages localStorage persistence

#### Supporting Contexts

1. **`ThemeProvider`** - Theme management (next-themes)
2. **`ConstantsDataFetchingProvider`** - Constants data fetching orchestration
3. **`ShareProvider`** - Share mode functionality and URL state
4. **`ConfigProvider`** - Configuration and localStorage abstraction
5. **`ConstantsProvider`** - Static reference data (heroes, items, leagues)

#### Architecture Principle

**All UI data flows through `AppDataProvider`** - components should use `useAppData()` to access any team/match/player data needed for display. The supporting contexts handle infrastructure concerns (theming, constants, configuration) but do not contain application data.

#### AppDataProvider Interface

The `AppDataProvider` exposes a comprehensive interface through `useAppData()`:

**Data Access:**

- `selectedTeam`, `selectedTeamId` - Currently selected team
- `teams` - All teams array
- `teamMatches`, `teamPlayers` - Pre-computed team-scoped data
- `allMatches`, `allPlayers` - All matches/players for global views
- `selectedMatch`, `selectedPlayer` - Currently selected match/player

**Operations:**

- `addTeam()`, `refreshTeam()`, `removeTeam()` - Team management
- `addMatch()`, `refreshMatch()`, `removeMatch()` - Match management
- `addPlayer()`, `refreshPlayer()`, `removePlayer()` - Player management
- `setSelectedTeam()`, `setSelectedMatch()`, `setSelectedPlayer()` - Selection

**State:**

- `isLoading` - Global loading state
- `error` - Global error state
- `highPerformingHeroes` - Pre-computed hero performance data

**Usage Pattern:**

```typescript
function MyComponent() {
  const { selectedTeam, teamMatches, addTeam, isLoading } = useAppData();

  // All data and operations available in one hook
}
```

### Single Context Implementation

The `AppDataProvider` implements a single context architecture that serves as the single source of truth for all application data:

#### Data Persistence Strategy

**Persisted to localStorage (for app hydration):**

- Teams list and configurations
- Match/player IDs and basic metadata (for app state tracking)
- Selected team/match/player IDs
- User preferences and settings
- Any manual matches/players added by user

**Not persisted (fetched fresh on demand):**

- Full match details (large datasets, fetched from API with caching)
- Full player details (large datasets, fetched from API with caching)
- League data (cached by backend, fetched fresh)
- Constants data (heroes, items - cached by backend)
- External API data that can be re-fetched

This approach balances performance with storage efficiency, ensuring fast app startup while avoiding localStorage bloat. Only essential state (IDs, selections, user data) is persisted; detailed data is fetched on demand with backend caching.

#### Generic State Management

The `AppDataProvider` uses a fully generic state management system that eliminates all violations of the single source of truth principle:

#### Core Infrastructure (`src/lib/state/core/`)

- **LoadingStateManager**: Centralized loading state management with subscription system
- **DataFetchingManager**: Centralized data fetching with caching, deduplication, and retry logic
- **ErrorManager**: Centralized error state management with subscription system
- **EntityStateManager<T, K>**: Generic state manager for any entity type with configuration-driven approach

#### State Manager Factory (`src/lib/state/core/state-manager-factory.ts`)

- **StateManagerFactory**: Factory pattern for creating configured entity managers
- **TeamStateManager**: Configured for team entities using EntityStateManager<TeamData, string>
- **MatchStateManager**: Configured for match entities using EntityStateManager<Match, number>
- **PlayerStateManager**: Configured for player entities using EntityStateManager<Player, number>

#### AppDataProvider Integration

- **Single Context**: `AppDataProvider` integrates all three entity managers (teams, matches, players)
- **Unified API**: Components use `useAppData()` hook to access all data and operations
- **Pre-computed Data**: Team-scoped matches and players calculated automatically
- **Selection State**: Centralized management of selected team/match/player
- **Persistence**: Automatic localStorage save/restore for essential data (teams list, global matches/players, selection state, user preferences)

#### Benefits Achieved

- **Single Source of Truth**: All team/match/player data managed in one context
- **Simplified Component Logic**: Components use single `useAppData()` hook instead of multiple contexts
- **Pre-computed Data**: Team-scoped matches/players calculated automatically, no manual filtering
- **Unified API**: Consistent interface for all entity operations across teams, matches, and players
- **Selective Persistence**: Essential data (teams list, global matches/players, selection state) automatically saved to and restored from localStorage
- **Type Safety**: Generic types ensure compile-time safety with configuration-driven behavior
- **Performance**: Centralized caching, deduplication, and optimized re-renders
- **Maintainability**: Single context to debug, test, and maintain instead of multiple contexts

### Backend (`src/app/api/`)

- **Responsibilities**
  - Single entry point for all external API calls.
  - Validate inputs only (Zod schemas in `src/types/api-zod/`).
  - Apply rate limiting per `src/types/rate-limit.ts` as configured.
  - Coordinate caching via `src/lib/cache-service.ts` and `src/lib/cache-backends/*` when applicable.
  - Return pass-through data from external APIs; avoid business calculations.
- **Conventions**
  - One route group per family: `teams`, `players`, `matches`, `constants`.
  - Error handling maps to consistent JSON error shapes; no thrown errors swallowed silently.
  - Keep route handlers thin; move reusable logic to `src/lib/`.

#### Backend Types & Data Handling

- **Data Flow Principle**: Routes should get data and return it without modifying it
- **Type Naming Convention**: Types for each service should be named `[Service][Type]`
  - Example: A list of Steam matches would be `SteamMatches`
  - Example: A single Steam match would be `SteamMatch`
- **Validation Requirements**: All routes must include Zod validation for inputs only (since outputs are pass-through data from external APIs)
- **Mock Data Strategy**:
  - `mock-data/cached-data/` - Used to mock Redis cache responses
  - `mock-data/external-data/` - Used to mock data coming from external services
  - Mock data should mirror the structure and format of real external API responses

### Frontend (`src/frontend/`)

- **Single Data Context Architecture**
  - **AppDataProvider**: Single source of truth for all team/match/player data
  - **Components**: Use `useAppData()` hook to access all data and operations
  - **Pre-computed Data**: Team-scoped matches/players calculated automatically
  - **Stateful pages**: Page-level orchestration and ephemeral view state (filters, dialogs, layout)
  - **Stateless components**: Presentational only; props-in, no internal state
- **Import boundaries**
  - Stateless components: Cannot import contexts or API directly
  - Stateful pages: Import `useAppData()` and supporting contexts only
  - AppDataProvider: Integrates with generic state managers and API clients
  - API clients: Own low-level `fetch`, headers, errors, and Zod validation
  - Only API clients talk to backend routes
- **Accessibility & UI**
  - Use shadcn components and Tailwind theme tokens; ensure keyboard/screen reader support

### Families

#### Teams

- **Location**: `src/frontend/teams/`
- **Rules**: Manage roster aggregate and team-specific performance across matches; we do not track when a player was on the team, only that they were and which matches they played.
- **Permanence heuristic (optional, frontend-derived; not implemented yet)**:
  - Evaluate permanence once there are at least `minMatchesForPermanenceEvaluation` matches (default: 10).
  - A player is considered permanent if their participation share ≥ `permanenceShareThreshold` (default: 0.6).
  - Expose derived sets: `permanentPlayerIds`, `rotatingPlayerIds`, and per-player `participationShare`.
  - Thresholds are configurable via `config-context` so users can tune behavior.

#### Matches

- **Location**: `src/frontend/matches/`
- **Rules**: Each match is 5v5; contains per-player stats and hero selections. Supports team participation metadata (side and pick order).

#### Players

- **Location**: `src/frontend/players/`
- **Rules**: Player views aggregate per-player statistics within the active team context.

#### Constants

- **Location**: `src/frontend/constants/`
- **Rules**: Hero and item metadata retrieved via backend, cached, and used to translate IDs to names.

- Domain types used by UI (from `src/types/contexts/constants-context-value.ts`)
  - `Hero`:
    - `id: string`, `name: string`, `localizedName: string`
    - `primaryAttribute: 'str' | 'agi' | 'int'`, `attackType: 'melee' | 'ranged'`
    - `roles: string[]`, `legs: number`
  - `Item`:
    - `id: string`, `name: string`, `localizedName: string`
    - `cost: number`, `secretShop: boolean`, `sideShop: boolean`, `recipe: boolean`
  - `League`:
    - `id: number`, `name: string`, `description?: string`
    - `url?: string`, `startDate?: string`, `endDate?: string`

- Derived data the state context must provide
  - `heroes: Map<string, Hero>` (key: hero ID)
  - `items: Map<string, Item>` (key: item ID)
  - `leagues: Map<number, League>` (key: league ID)
  - `getHero(id: string): Hero | undefined`
  - `getItem(id: string): Item | undefined`
  - `getLeague(id: number): League | undefined`

### Types & Validation

- **Types**: Swagger/OpenAPI-generated types live in `src/types/api.ts` (or split modules under `src/types/` if expanded). Domain/view types are colocated under `src/types/**`.
- **Validation**: Zod schemas in `src/types/api-zod/`. Validate at backend boundaries only (inputs); API clients pass through responses without validation.

### Caching

- Centralized in `src/lib/cache-service.ts` with backends in `src/lib/cache-backends/`.
- Family TTLs (current policy): players 24h; teams 24h; matches indefinite (manual refresh invalidation).
- Cache keys follow `family:resource:params:v{CACHE_VERSION}`.

### Error Handling & Logging

- Use helpers in `src/utils/error-handling.ts`. Provide meaningful error messages; no silent failures.
- Distinguish user-facing errors from developer logs; surface errors via context error fields for the UI.

### Security & Configuration

- Never store secrets in plaintext. Do not modify `.env` via code.
- Frontend contexts do not call `localStorage` directly; use `src/frontend/contexts/config-context.tsx` abstraction.
- Enforce server-only modules not importable by client via ESLint rules.

### Testing

- Tests mirror source layout under `src/tests/` with one-to-one mapping.
- Use `pnpm` for all scripts; run lint, type-check, and tests with zero warnings policy.

### Build & CI

- Commands: `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm dev`.
- PR gates: all checks must pass; no dynamic imports; import boundaries respected.

### Pages

#### Dashboard (`src/app/dashboard/page.tsx` → `DashboardPageContainer`)

- **Responsibilities**
  - Add a team by team ID and league ID (validated inputs; ARIA attributes; duplicate prevention).
  - List teams with status (active, loading, error) and high-level stats (total matches, win rate).
  - Edit team (sheet) and set active team; refresh and remove teams.
- **Primary actions**
  - `addTeam(teamId, leagueId)`, `removeTeam(teamId, leagueId)`, `refreshTeam(teamId, leagueId)`, `setSelectedTeamId(teamId, leagueId)`, `editTeam(oldT, oldL, newT, newL)`.
- **Key components**
  - `AddTeamForm` (validated inputs; button disable on duplicate/invalid; Reset).
  - `TeamList` → `TeamCard` (Active badge; Refresh/Edit/Delete actions; accessible keyboard/select behavior).
  - `EditTeamSheet` (controlled inputs; Enter-to-submit; disabled state management).

#### Match History (`src/app/match-history/page.tsx` → `MatchHistoryPageContainer`)

- **Responsibilities**
  - Browse matches for the active team; filter/search; toggle list/card views.
  - Select a match and view details (Draft/Players/Events) with resizable layout.
  - Hide/unhide matches; add a match by ID and side; refresh match data.
- **Primary actions/state**
  - Filters: `dateRange`, `result`, `opponent`, `teamSide`, `pickOrder`, `heroesPlayed`, `highPerformersOnly`.
  - Views: `viewMode: 'list'|'card'`, `matchDetailsViewMode: 'draft'|'players'|'events'`.
  - Hidden matches: maintain hidden set, show modal, unhide.
  - Add match: validate ID, ensure not duplicate, add to Matches, associate to Team with side, then scroll/select.
- **Key components**
  - `ResizableMatchLayout`: panels for Filters, Matches list, and Match details; forwards `scrollToMatch`.
  - `MatchesList`: selectable list or cards; hidden count; view toggles; smooth scroll to item.
  - `MatchDetailsPanel`: header + subviews (Draft, Players, Events); consumes `teamMatches`, `allMatches` for context.
  - `AddMatchForm` (sheet; ID + side; validation; disabled states; duplicate guard).
  - `HiddenMatchesModal` (accessible dialog; summary per hidden match; Unhide action).

#### Player Stats (`src/app/player-stats/page.tsx` → `PlayerStatsPageContainer`)

- **Responsibilities**
  - View player data for the active team; filter/sort; select players; toggle list/card views.
  - Show player details (Summary, Details, Team context) with resizable layout.
  - Hide/unhide players (modal), add player by ID, edit/remove manual players; refresh player data.
- **Primary actions/state**
  - Views: `viewMode: 'list'|'card'`, `playerDetailsViewMode: 'summary'|'details'|'team'`.
  - Hidden players management; `selectedPlayerId`; `manualPlayerIds` derived from Team.
  - Uses hero/item constants and preferred external site from config.
- **Key components**
  - `ResizablePlayerLayout`: panels for Players list and Player details; forwards `scrollToPlayer`.
  - `PlayerListView`: renders players with top heroes, win rate; supports manual edit/remove; external site link.
  - `PlayerDetailsPanel`: header + subviews (Summary, Details, Team). Team view computes team-scoped stats via `processPlayerDetailedStats` and shows roles/heroes tables.
  - `AddPlayerSheet` and `EditPlayerSheet`: sheets for adding/editing manual players with validation and disabled states.

#### Home (`src/app/page.tsx`)

- Redirects to `/dashboard`.

### Appendix: Data Map (UI inputs)

This appendix enumerates data required by presentational components so contexts can reproduce all inputs without changing the UI.

#### Teams family

- Domain types used by UI
  - `TeamData` (from `src/types/contexts/team-context-value.ts`):
    - `team: { id: number; name: string }`
    - `league: { id: number; name: string }`
    - `timeAdded: string`
    - `matches: Record<number, TeamMatchParticipation>`
    - `manualMatches: Record<number, { side: 'radiant' | 'dire' }>`
    - `manualPlayers: number[]`
    - `players: TeamPlayer[]` (aggregated, team-scoped stats)
    - `performance: TeamPerformance`
    - `error?: string`
    - `isLoading?: boolean`
  - `TeamMatchParticipation` (extends Dotabuff match summary):
    - `side: 'radiant' | 'dire' | null`
    - `pickOrder: 'first' | 'second' | null`
  - `TeamPerformance` contains: totals, winRate, `heroUsage`, `draftStats`, streaks, averages.
  - Contexts must also supply: `highPerformingHeroes: Set<string>` (used cross-views).

- Stateless components and their props
  - `dashboard/AddTeamForm`
    - `teamId: string`, `leagueId: string`
    - `onTeamIdChange(value)`, `onLeagueIdChange(value)`
    - `onAddTeam(teamId, leagueId) Promise<void>`
    - `teamExists(teamId, leagueId) boolean`
    - `isSubmitting?: boolean`, `onReset?: () => void`
  - `dashboard/TeamList`
    - `teamDataList: TeamData[]`
    - `activeTeam: { teamId: number; leagueId: number } | null`
    - `onRemoveTeam(teamId, leagueId) Promise<void>`
    - `onRefreshTeam(teamId, leagueId) Promise<void>`
    - `onSetActiveTeam(teamId, leagueId) void`
    - `onEditTeam(teamId, leagueId) void`
  - `dashboard/TeamCard`
    - `teamData: TeamData`, `isActive: boolean`
    - callbacks: same as `TeamList`
    - Renders `teamData.performance.totalMatches`, `performance.overallWinRate` when no error
  - `dashboard/EditTeamSheet` (sheet)
    - `isOpen`, `onClose()`, `currentTeamId`, `currentLeagueId`
    - `onSave(oldTeamId, oldLeagueId, newTeamId, newLeagueId) Promise<void>`
    - `teamExists(teamId, leagueId) boolean`

- Derived data the state context must provide
  - `teams: Map<string, TeamData>` (key: `${teamId}-${leagueId}`)
  - `selectedTeamId: { teamId: number; leagueId: number } | null`
  - `getAllTeams(): TeamData[]` sorted (most recent first)
  - Computed `highPerformingHeroes: Set<string>` (precomputed for performance)

#### Matches family

- Domain types used by UI (from `src/types/contexts/match-context-value.ts`)
  - `Match`:
    - `id: number`, `date: string`, `duration: number`
    - `radiant: { id?: number; name?: string }`, `dire: { id?: number; name?: string }`
    - `draft: { radiantPicks: HeroPick[]; direPicks: HeroPick[]; radiantBans: string[]; direBans: string[] }`
    - `players: { radiant: PlayerMatchData[]; dire: PlayerMatchData[] }`
    - `statistics`: scores and timeseries (gold/experience advantages)
    - `events: MatchEvent[]`
    - `result: 'radiant' | 'dire'`
    - `pickOrder?: { radiant: 'first' | 'second' | null; dire: 'first' | 'second' | null }`
    - Processed data for UI:
      - `processedDraft?: DraftPhase[]`
      - `processedEvents?: GameEvent[]`
      - `processedStatistics?: ProcessedMatchStatistics`

- Stateless components and their props
  - `matches/AddMatchForm` (sheet)
    - `isOpen: boolean`, `onClose: () => void`
    - `matchId: string`, `teamSide: 'radiant' | 'dire' | ''`
    - `onMatchIdChange(value)`, `onTeamSideChange(value)`
    - `onSubmit: () => Promise<void> | void`
    - `matchExists(matchId: string) boolean`
    - `isSubmitting?: boolean`, `error?: string`, `validationError?: string`, `isValid: boolean`
  - `matches/HiddenMatchesModal` (dialog)
    - `hiddenMatches: Match[]`, `onUnhide(matchId: number) void`, `onClose: () => void`
    - `teamMatches?: Record<number, TeamMatchParticipation>`
  - `matches/ResizableMatchLayout` (layout)
    - `filters: MatchFilters`, `onFiltersChange(filters) void`
    - `activeTeamMatches: Match[]`, `teamMatches: Record<number, TeamMatchParticipation>`
    - `visibleMatches: Match[]`, `filteredMatches: Match[]`, `unhiddenMatches: Match[]`
    - `onHideMatch(id: number) void`, `onRefreshMatch(id: number) void`
    - `viewMode: 'list'|'card'`, `setViewMode(mode) void`
    - `selectedMatchId: number | null`, `onSelectMatch(id: number) void`
    - `hiddenMatchesCount: number`, `onShowHiddenMatches() void`
    - `hiddenMatchIds: Set<number>`, `selectedMatch: Match | null`
    - `matchDetailsViewMode: 'draft'|'players'|'events'`, `setMatchDetailsViewMode(mode) void`
    - `onScrollToMatch(id: number) void`, `onAddMatch() void`

- Derived data the state context must provide
  - `matches: Map<number, Match>` (key: match ID)
  - `selectedMatchId: number | null`
  - `getMatch(id: number): Match | undefined`
  - `addMatch(id: number): Promise<Match | null>`
  - `refreshMatch(id: number): Promise<void>`
  - `removeMatch(id: number): void`

#### Players family

- Domain types used by UI (from `src/types/contexts/player-context-value.ts`)
  - `Player`:
    - `id: number`, `name: string`, `accountId: number`
    - `teamContext?: TeamPlayerContext` (team-scoped stats)
    - `overallStats?: PlayerOverallStats` (global stats)
    - `heroStats: Record<string, PlayerHeroStats>` (per-hero performance)
    - `recentMatches: PlayerMatchData[]` (recent match history)
    - `preferredRoles: string[]` (most played roles)
    - `isManual?: boolean` (manually added player)

- Stateless components and their props
  - `players/AddPlayerSheet` (sheet)
    - `isOpen: boolean`, `onClose: () => void`
    - `playerId: string`, `onPlayerIdChange(value: string) void`
    - `onSubmit: () => Promise<void> | void`
    - `playerExists(playerId: string) boolean`
    - `isSubmitting?: boolean`, `error?: string`, `validationError?: string`, `isValid: boolean`
  - `players/EditPlayerSheet` (sheet)
    - `isOpen: boolean`, `onClose: () => void`
    - `playerId: number`, `currentName: string`
    - `onNameChange(value: string) void`
    - `onSave: (playerId: number, newName: string) Promise<void>`
    - `onRemove: (playerId: number) Promise<void>`
    - `isSubmitting?: boolean`, `error?: string`

- Derived data the state context must provide
  - `players: Map<number, Player>` (key: player ID)
  - `selectedPlayerId: number | null`
  - `getPlayer(id: number): Player | undefined`
  - `addPlayer(id: number): Promise<Player | null>`
  - `refreshPlayer(id: number): Promise<void>`
  - `removePlayer(id: number): void`
  - `updatePlayerName(id: number, name: string): Promise<void>`

## Frontend Refactor Plan and Data Map

This document captures all decisions, structure, guardrails, cache policies, validation strategy, and a component-by-component data map so the refactor can proceed without re-deciding anything. It includes checklists to track progress.

### Decisions (locked-in)

- **Backend/Frontend separation**: Frontend interacts with backend exclusively via API routes; it imports shared types only.
- **Layering (frontend)**:
  - Families: `teams`, `matches`, `players` under `src/frontend/`.
  - One stateful container per page.
  - Stateless components receive data strictly via props.
  - Only state contexts call fetching contexts.
  - Only fetching contexts call API clients.
  - No standalone data coordinator layer.
  - Contexts do not call `localStorage` directly; use a storage/config abstraction.
- **Types/validation**:
  - Keep Swagger typegen to `src/types/api/`.
  - Generate Zod schemas from Swagger to `src/types/api-zod/` (validate all API responses at the client boundary).
- **Caching**:
  - Players TTL: 1 day
  - Teams TTL: 1 day
  - Matches TTL: none (indefinite). Invalidate via manual Refresh or cache version bump.
- **Testing**: Mirror source structure under `src/tests/...` (e.g., `src/app/a/b/c` → `src/tests/app/a/b/c`).
- **Ignore**: Draft Suggestions page for now.

### Target directory structure

- Backend
  - `src/backend/**` (server logic)
  - `src/app/api/**` (API routes)
- Shared
  - `src/types/api/` (Swagger-generated TS types)
  - `src/types/api-zod/` (Swagger-generated Zod schemas)
- Frontend
  - `src/frontend/{teams|matches|players}/`
    - `api/` (typed API clients; Zod-validated; no UI logic)
    - `contexts/fetching/` (only layer that calls `api/`)
    - `contexts/state/` (owns UI-facing state; the only layer that calls fetching)
    - `components/containers/` (one per page; the only stateful UI component per page)
    - `components/stateless/` (pure UI; props-only)
    - `hooks/` (feature-specific; no IO)
    - `types/` (feature-view types derived from shared API types)
  - Frontend libs
    - `src/frontend/lib/api-client/` (fetch wrapper; base URL; error normalization; Zod validation)
    - `src/frontend/lib/cache/` (localStorage-backed cache; TTL + versioning)
    - `src/frontend/contexts/config-context.tsx` (storage/config abstraction; the only place that hits localStorage)
- Pages (unchanged paths)
  - `src/app/{dashboard|match-history|player-stats}/page.tsx` import the family container from `src/frontend/.../components/containers/`

### Import boundaries (must enforce)

- `components/stateless` cannot import contexts or API.
- `components/containers` can import state contexts only.
- `contexts/state` can import fetching contexts only.
- `contexts/fetching` can import API clients only.
- Only `api/` talks to backend routes.
- No dynamic imports; imports at file top.

### Cache conventions

- Key format: `family:resource:params:v{CACHE_VERSION}` (version bump invalidates all keys).
- TTLs: players 24h, teams 24h, matches indefinite.
- Store optional ETag/Last-Modified if backend provides them (optimizations only).
- Manual Refresh controls on pages bust relevant keys.

### Zod validation (from Swagger)

- Continue generating TS types to `src/types/api/`.
- Generate Zod schemas to `src/types/api-zod/`.
- API client pattern: execute fetch → parse JSON → validate with Zod → return typed data.

## Data map (what UI needs and where it comes from)

This section enumerates data required by presentational components so contexts can reproduce all inputs without changing the UI.

### Teams family

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
  - `dashboard/EditTeamModal` (sheet)
    - `isOpen`, `onClose()`, `currentTeamId`, `currentLeagueId`
    - `onSave(oldTeamId, oldLeagueId, newTeamId, newLeagueId) Promise<void>`
    - `teamExists(teamId, leagueId) boolean`

- Derived data the state context must provide
  - `teams: Map<string, TeamData>` (key: `${teamId}-${leagueId}`)
  - `selectedTeamId: { teamId: number; leagueId: number } | null`
  - `getAllTeams(): TeamData[]` sorted (most recent first)
  - Computed `highPerformingHeroes: Set<string>` (precomputed for performance)

### Matches family

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
      - `teamFightStats?: TeamFightStats`
    - `error?: string`, `isLoading?: boolean`
  - `TeamMatchParticipation` (see Teams section)

- Stateless components and their props
  - `match-history/ResizableMatchLayout`
    - Filters: `filters`, `onFiltersChange`
    - Lists: `activeTeamMatches`, `visibleMatches`, `filteredMatches`, `unhiddenMatches`
    - Actions: `onHideMatch`, `onRefreshMatch`, `onSelectMatch`, `onAddMatch`
    - View: `viewMode`, `setViewMode`, `selectedMatchId`, counts/hidden sets
    - Details: `selectedMatch`, `matchDetailsViewMode`, `setMatchDetailsViewMode`
  - `match-history/list/MatchesList`
    - `matches`, `selectedMatchId?`, `onSelectMatch?`
    - `onHideMatch`, `onRefreshMatch`, `viewMode`, `setViewMode`
    - `teamMatches?`, `hiddenMatchIds?`, `allMatches?`, `onScrollToMatch?`, `onAddMatch?`
  - `match-history/list/MatchListView` (delegates to list/card variants) and subviews
  - `match-history/details/MatchDetailsPanel`
    - `match`, `teamMatch`, `viewMode`, `onViewModeChange`
    - `allMatches?`, `teamMatches?`, `hiddenMatchIds?`

- Derived data the state context must provide
  - `matches: Map<number, Match>`
  - `selectedMatchId: number | null`
  - Efficient selectors: `getMatch(id)`, `getMatches(ids)`
  - For the page container: `activeTeamMatches: Match[]`, `teamMatches: Record<number, TeamMatchParticipation>`

### Players family

- Domain types used by UI (from `src/types/contexts/player-context-value.ts`)
  - `Player = OpenDotaPlayerComprehensive & { error?: string; isLoading?: boolean }`

- Stateless components and their props
  - `player-stats/ResizablePlayerLayout`
    - Lists: `players`, `visiblePlayers`, `filteredPlayers`
    - Actions: `onHidePlayer`, `onRefreshPlayer`, `onSelectPlayer`, `onAddPlayer`
    - View: `viewMode`, `setViewMode`, `selectedPlayerId`, counts/hidden sets, manual player IDs
    - Details: `selectedPlayer`, `playerDetailsViewMode`, `setPlayerDetailsViewMode`
    - Manual edits: `onEditPlayer`, `onRemovePlayer`
  - `player-stats/list/PlayerListView`
    - `players`, `selectedPlayerId?`, `onSelectPlayer?`, `onRefreshPlayer?`, `viewMode`
    - `manualPlayerIds?`, `onEditPlayer?`, `onRemovePlayer?`
    - Note: rank/top-heroes are derived in the component from hero constants; contexts need not supply them.

- Derived data the state context must provide
  - `players: Map<number, Player>`
  - `selectedPlayerId: number | null`
  - Selectors: `getPlayer(id)`, `getPlayers(ids)`

### Constants and configuration

- `constants-context` supplies hero/item constants consumed by match/player UIs.
- `config-context` provides localStorage-backed user prefs and persistent team data updates; contexts use this abstraction, not localStorage directly.

## Execution plan (checklists)

Use these checklists to track progress. Keep docs updated as tasks complete.

### 1) Directory setup and guardrails

- [ ] Create `src/frontend/{teams|matches|players}/` with subfolders: `api/`, `contexts/fetching/`, `contexts/state/`, `components/{containers,stateless}/`, `hooks/`, `types/`.
- [ ] Add `src/frontend/lib/api-client/` and `src/frontend/lib/cache/`.
- [ ] Move `src/contexts/config-context.tsx` → `src/frontend/contexts/config-context.tsx` (update imports).
- [ ] Add ESLint import-boundary rules to enforce layer constraints.
- [ ] Ensure no dynamic imports; all imports at top.

### 2) API clients and validation

- [ ] Keep Swagger TS typegen to `src/types/api/`.
- [ ] Add Swagger→Zod generation to `src/types/api-zod/`.
- [ ] Implement base API client (fetch wrapper) with Zod validation in `src/frontend/lib/api-client/`.
- [ ] Implement family API modules `src/frontend/{family}/api/*` using the base client and Zod schemas.

### 3) Cache and storage

- [ ] Implement `src/frontend/lib/cache/` with get/set, TTL, versioning, and optional ETag.
- [ ] Define `CACHE_VERSION` and keying convention `family:resource:params:v{VERSION}`.
- [ ] Wire contexts to use the cache lib; ensure matches cache is indefinite until Refresh.
- [ ] Ensure contexts persist via `config-context` only.

### 4) Refactor Teams (reference implementation)

- [ ] Move/implement `teams` fetching context under `contexts/fetching/` (calls `teams/api/`).
- [ ] Move/implement `teams` state context under `contexts/state/` (calls fetching; exposes UI-facing state/selectors/actions).
- [ ] Move presentational components to `components/stateless/` (unchanged props/ARIA/layout).
- [ ] Create `components/containers/DashboardPageContainer.tsx` (the only stateful page component).
- [ ] Update `src/app/dashboard/page.tsx` to render the new container.
- [ ] Verify UI unchanged and interactions intact.
- [ ] Mirror/update tests under `src/tests/frontend/teams/...`.

### 5) Refactor Matches

- [ ] Repeat fetching/state/context pattern for `matches`.
- [ ] Move presentational components to `components/stateless/`.
- [ ] Create `components/containers/MatchHistoryPageContainer.tsx`.
- [ ] Update `src/app/match-history/page.tsx` to render the new container.
- [ ] Verify UI unchanged.
- [ ] Mirror/update tests under `src/tests/frontend/matches/...`.

### 6) Refactor Players

- [ ] Repeat fetching/state/context pattern for `players`.
- [ ] Move presentational components to `components/stateless/`.
- [ ] Create `components/containers/PlayerStatsPageContainer.tsx`.
- [ ] Update `src/app/player-stats/page.tsx` to render the new container.
- [ ] Verify UI unchanged.
- [ ] Mirror/update tests under `src/tests/frontend/players/...`.

### 7) Cleanup and verification

- [ ] Remove unused legacy folders under `src/components/**` and `src/contexts/**` after migration.
- [ ] Ensure zero lint warnings and type errors.
- [ ] Ensure all tests pass and are mirrored under `src/tests/...`.
- [ ] Double-check keyboard accessibility, ARIA labels, and focus management.
- [ ] Confirm no frontend code imports backend modules.

## Acceptance criteria

- Strict backend/frontend separation; frontend uses API calls only.
- Layer constraints enforced by linter; no violations.
- One stateful container component per page; all other components stateless.
- Fetching contexts call only API clients; state contexts call only fetching contexts.
- Zod validation at the API boundary; shared types generated from Swagger.
- Caches follow configured TTLs; matches cache is indefinite until Refresh or version bump.
- LocalStorage only accessed via `config-context`.
- UI unchanged: props, layout, ARIA, and behavior match current implementation.
- Tests pass and mirror source structure.

## Notes and clarifications

- Rank and top-heroes in player list views are derived in the presentational layer using constants; contexts do not need to compute them.
- If we later decide to precompute some heavy derivations, we can do so in state contexts as memoized selectors without changing the stateless component props.

---

### Progress log (optional)

- Use the checklists above to track completion. Add brief notes here as tasks complete.



## Architecture

### Overview & Principles

- **Separation of concerns**: Frontend UI lives in `src/frontend/`; backend API routes live in `src/app/api/`. They interact only via HTTP.
- **Shared contracts**: Cross-cutting types and schemas live in `src/types/`; shared utilities in `src/lib/`. Client code does not import server-only modules.
- **Accessibility**: UI adheres to WCAG 2.1, semantic HTML, ARIA where appropriate, keyboard and screen reader support.
- **Code quality**: Zero lint warnings, strict typing (no `any`/`unknown`), no dynamic imports; imports at file top; camelCase.
- **No backend guessing**: API routes retrieve and organize data only; no inferred calculations beyond shaping responses.

### Directory Structure (high level)

- **Backend**: `src/app/api/`
- **Frontend**: `src/frontend/`
- **Frontend libs**: `src/frontend/lib/api-client/`, `src/frontend/lib/cache/`
- **Shared libraries**: `src/lib/`
- **Types & validation**: `src/types/` and `src/types/api-zod/`
- **Mock/real fixtures**: `mock-data/`, `real-data/`
- **Tests**: `src/tests/`

### Data Flow

1. Frontend stateful pages consume state management contexts per family (Teams, Matches, Players, Constants).
2. State contexts call their corresponding data fetching contexts to retrieve data.
3. Fetching contexts call the frontend API client, which calls backend routes under `src/app/api/*`.
4. Backend routes call external APIs and/or cache, validate/shape, then return JSON.
5. Constants (heroes/items) are fetched via backend and cached; frontend uses them to translate IDs to names.

### Backend (`src/app/api/`)

- **Responsibilities**
  - Single entry point for all external API calls.
  - Validate inputs/outputs (Zod schemas in `src/types/api-zod/`).
  - Apply rate limiting per `src/types/rate-limit.ts` as configured.
  - Coordinate caching via `src/lib/cache-service.ts` and `src/lib/cache-backends/*` when applicable.
  - Return normalized, typed responses; avoid business calculations.
- **Conventions**
  - One route group per family: `teams`, `players`, `matches`, `constants`.
  - Error handling maps to consistent JSON error shapes; no thrown errors swallowed silently.
  - Keep route handlers thin; move reusable logic to `src/lib/`.

### Frontend (`src/frontend/`)

- **Layering per family (Teams, Matches, Players, Constants)**
  - Data fetching context: orchestrates calls to the typed API client; never calls `fetch` or external APIs directly.
  - State management context: feature-scoped source of truth (derived data, selections, caches); calls the fetching context and exposes UI-ready state.
  - Stateful page component: page-level orchestration and ephemeral view state only (filters, dialogs, layout); consumes the state context and passes props.
  - Stateless components: presentational only; props-in, no internal state.
- **Import boundaries**
  - Stateless components cannot import contexts or API.
  - Stateful pages import state contexts only.
  - State contexts import fetching contexts only.
  - Fetching contexts import typed API clients only (API client owns low-level `fetch`, headers, errors, and Zod validation).
  - Only API clients talk to backend routes.
- **Accessibility & UI**
  - Use shadcn components and Tailwind theme tokens; ensure keyboard/screen reader support.

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

### Types & Validation

- **Types**: Swagger/OpenAPI-generated types live in `src/types/api.ts` (or split modules under `src/types/` if expanded). Domain/view types are colocated under `src/types/**`.
- **Validation**: Zod schemas in `src/types/api-zod/`. Validate at backend boundaries; API clients validate responses before exposing to contexts.

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
  - `dashboard/EditTeamModal` (sheet)
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
      - `

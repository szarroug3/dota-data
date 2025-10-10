### Implementation Plan: Frontend Architecture Refactor (No UI/Behavior Changes)

This document outlines a code-structure refactor to improve maintainability and clarity without altering UI or runtime behavior. Absolutely no visual or functional changes will be introduced.

- **Non-goal**: No changes to how the dashboard looks or behaves.
- **Goal**: Enforce clear boundaries between data fetching, state management, stateful containers, and stateless components, with centralized config persistence.

### Guiding Principles

- **Data fetching contexts**: Call backend APIs only; handle caching and error mapping locally; expose typed fetch methods.
- **State management contexts**: Consume data fetching contexts only; own business logic, transformation, and in-memory state.
- **Stateful containers (pages)**: Compose contexts, derive view state, build handlers; pass strict props to presentational components.
- **Stateless presentational components**: Render-only, no context usage; accept props; remain reusable and testable.
- **Config context**: The single place for persistence to `localStorage` and app preferences.
- **No automatic refreshes**; all refresh actions are user-initiated.
- **No dynamic imports**; all imports at top-level.
- **Prefer small, composable functions; avoid complex, deeply nested logic.**

### Current Audit (Baseline)

- Data fetching contexts exist and are sound (frontend):
  - `src/frontend/contexts/team-data-fetching-context.tsx`
  - `src/frontend/contexts/match-data-fetching-context.tsx`
  - `src/frontend/contexts/player-data-fetching-context.tsx`
- State contexts exist and are cohesive (frontend):
  - `src/frontend/contexts/team-context.tsx` (teams state + operations + persistence via config)
  - `src/frontend/contexts/match-context.tsx` (matches state + processing + operations)
  - `src/frontend/contexts/player-context.tsx` (players state + operations)
- Config/persistence is centralized (frontend):
  - `src/frontend/contexts/config-context.tsx` with helpers in `src/frontend/utils/storage.ts`.
- Stateful page containers are in place (frontend):
  - `src/frontend/components/player-stats/PlayerStatsPage.tsx`
  - `src/frontend/components/match-history/MatchHistoryPage.tsx`
  - `src/frontend/components/dashboard/DashboardPage.tsx`
- Some presentational components still read contexts directly (e.g., `src/frontend/components/match-history/list/MatchListViewCard.tsx`).

### End-State Architecture

The finalized target structure is defined in “Phase 5 — Mechanical File Organization” below. It consolidates frontend code under `src/frontend/**`, backend under `src/backend/**`, and shared types under `src/shared/types/**`. See that section for the authoritative folder map and move list.

### Gaps To Close

- Ensure `team-context` depends only on data fetching contexts (not `match-context`/`player-context`) when fetching network data; continue using processing utilities for transformations.
- Stateless-ize any components that read contexts (prop drill from pages instead).
- Confirm no direct `localStorage` use outside `config-context`.

### Phased Plan (Safe, Zero-Behavior-Change)

#### Phase 1 — Boundaries and Docs
- Document dependency rules (this file) and add a short overview in `docs/architecture/frontend/`.
- Optional: Prepare ESLint import-boundary rules (apply later after refactor stabilizes).

Deliverables:
- This doc, plus a brief architecture note.

#### Phase 2 — State Context Alignment
- Team
  - In `use-team-operations.ts`, replace network-dependent calls that currently use `matchContext`/`playerContext` with calls from `useMatchDataFetching`/`usePlayerDataFetching`.
  - Keep all computation and data shaping in processing modules (`src/frontend/processing/*`).
  - Maintain `TeamData.error` semantics for failures and preserve persistence semantics.
- Match & Player
  - Already consume their respective data fetching contexts correctly; minimal/no changes expected.

Deliverables:
- Updated `use-team-operations.ts` to invoke fetching contexts for network data only, preserving all behavior.

#### Phase 3 — Pure Presentational Components
- Remove context usage from leaf components. Examples to update (non-exhaustive):
  - `components/match-history/list/MatchListViewCard.tsx`
  - `components/match-history/list/MatchListViewList.tsx`
  - `components/match-history/details/MatchDetailsPanelDraft.tsx`
  - `components/match-history/summary/HeroSummaryTable.tsx`
  - Any player/team subcomponents that currently read contexts
- Lift required data/handlers to page containers and pass via props:
  - `preferredExternalSite`
  - `isManualMatch`, `currentTeamSide`
  - `onRemoveManualMatch`, `onEditManualMatch`, `onRefresh*`, selections, etc.
- Add `types/props/*` if shared prop types improve clarity.

Deliverables:
- Leaf components receive only props; pages remain unchanged visually/behaviorally.

#### Phase 4 — Persistence Hardening
- Verify all persistence happens in `config-context`.
- Remove any stray direct `localStorage` interactions if found.

Deliverables:
- Centralized persistence via `config-context` only.

#### Phase 5 — Mechanical File Organization
– Adopt the new repo layout while preserving exports and behavior.

Target folder structure and moves:

```
src/
  app/                                 # Next.js pages/api (UNCHANGED)
  frontend/
    components/                        # All React UI components
      stateful/                        # Page containers, connectors
      stateless/                       # Leaf/presentational components
    contexts/                          # Frontend state contexts
    hooks/                             # Client/UI hooks
    processing/                        # UI-focused transforms
      match-processing.ts              # from src/lib/processing/match-processing.ts
      team-processing.ts               # from src/lib/processing/team-processing.ts
    utils/
      error-handling.ts                # from src/utils/error-handling.ts (migrated)
      loading-state.ts                 # from src/utils/loading-state.ts (migrated)
      team-helpers.ts                  # from src/utils/team-helpers.ts (migrated)
      match-helpers.ts                 # from src/utils/match-helpers.ts (migrated)
      player-helpers.ts                # from src/utils/player-helpers.ts (migrated)
      player-statistics.ts             # from src/utils/player-statistics.ts (migrated)
      storage.ts                       # from src/utils/storage.ts (migrated)
      validation.ts                    # from src/utils/validation.ts (migrated)
      image-url.ts                     # canonical image util (was under lib/utils)

  backend/
    api/                               # from src/lib/api/**
    cache/
      backends/                        # from src/lib/cache-backends/**
      cache-service.ts                 # from src/lib/cache-service.ts
    config/
      environment.ts                   # from src/lib/config/environment.ts
    utils/
      request.ts                       # from src/lib/utils/request.ts
      playwright.ts                    # from src/lib/utils/playwright.ts
    data-service.ts                    # from src/lib/data-service.ts

  shared/
    types/
      api.ts                           # from src/types/api.ts
      external-apis.ts                 # from src/types/external-apis.ts

  # Frontend-only types move under frontend
  frontend/types/
    contexts/**                        # from src/types/contexts/**
    components/**                      # from src/types/components/**
    hooks/**                           # from src/types/hooks/**

  # Backend-only types remain backend
  backend/types/
    cache.ts                           # from src/types/cache.ts
    rate-limit.ts                      # from src/types/rate-limit.ts
```

Imports to update accordingly (via `@/frontend/*`, `@/backend/*`, `@/shared/*`). Do not move `src/app/**`.

Deliverables:
- Files relocated; imports adjusted conservatively.

#### Phase 6 — Verification
- Run `pnpm lint`, `pnpm type-check`, `pnpm test`.
- Execute existing Playwright smoke to confirm no UI diffs.
- Address any boundary or import issues surfaced by the moves.

Deliverables:
- Green lint/types/tests and passing e2e smoke.

### File-Level Actions (Representative)

- Keep as-is:
  - `src/contexts/config-context.tsx`
  - `src/contexts/*-data-fetching-context.tsx` (move only)
- Team state alignment:
  - `src/hooks/use-team-operations.ts`: Switch network calls to use `useMatchDataFetching`/`usePlayerDataFetching`; keep transformations and persistence identical.
- Stateless-ize:
  - `components/match-history/list/MatchListViewCard.tsx` and similar: remove `useTeamContext` / `useConfigContext`; pass props from page containers.

### Architectural Guardrails

- Data fetching contexts do not contain business logic; they only fetch/cache/map errors.
- State contexts own domain logic and state; they talk to fetching contexts, config context, and processing modules (`src/frontend/processing/*`).
- No state context depends on another state context for network access; cross-context data access should be via fetching contexts or pure utilities.
- No dynamic imports; imports at top of files only.
- Keep functions small and readable; split complex logic.
- No automatic refreshes; keep user-initiated refresh controls.

### Rollout Checklist

- Define and agree on boundaries (this doc).
- Align `team-context` usage of fetching contexts.
- Stateless-ize identified components; ensure props cover all needs.
- Centralize any stray persistence into `config-context`.
- Relocate files into the target folder structure.
- Lint, type-check, and run tests; validate with smoke e2e.

### Test Organization and Commands

- Frontend tests split into three buckets (mirrors src/frontend layout):
  - `src/tests/frontend/contexts/**` → contexts and hooks using contexts
  - `src/tests/frontend/components/stateful/**` → page containers/connectors
  - `src/tests/frontend/components/stateless/**` → leaf/presentational components
- Backend tests (unchanged):
  - `src/tests/lib/**`, `src/tests/app/api/**`

Configured Jest projects (already in repository):
- **backend**: `src/tests/lib/**`, `src/tests/app/api/**`
- **frontend-context**: `src/tests/frontend/contexts/**`
- **frontend-stateful-components**: `src/tests/frontend/components/stateful/**`
- **frontend-stateless-components**: `src/tests/frontend/components/stateless/**`

Run commands:
```
pnpm exec jest --selectProjects backend
pnpm exec jest --selectProjects frontend-context
pnpm exec jest --selectProjects frontend-stateful-components
pnpm exec jest --selectProjects frontend-stateless-components
```

Migration of existing tests to new paths (no test content changes):
- Move `src/tests/contexts/**` → `src/tests/frontend/contexts/**`
- Move page/container tests under `src/tests/components/**` to `src/tests/frontend/components/stateful/**`
- Move leaf component tests under `src/tests/components/**` to `src/tests/frontend/components/stateless/**`
- Keep `src/tests/lib/**` and `src/tests/app/api/**` as backend.

### Type Ownership and Shared Modules

- **Shared (move to `src/shared/types/`)**
  - `src/types/api.ts`
  - `src/types/external-apis.ts`

- **Backend-only (move to `src/backend/types/`)**
  - `src/types/cache.ts`
  - `src/types/rate-limit.ts`

- **Frontend-only (move to `src/frontend/types/`)**
  - `src/types/contexts/**`
  - `src/types/components/**`
  - `src/types/hooks/**`

### Utilities and Duplicates to Resolve

- All former `src/utils/**` frontend utilities have been migrated to `src/frontend/utils/**` and old files removed.
- Image URL utility resides at `src/frontend/utils/image-url.ts` and is imported by `src/frontend/contexts/constants-context.tsx` via `@/frontend/utils/image-url`.

### Path Aliases and ESLint Boundaries

- TypeScript path aliases (tsconfig) are configured:
  - `@/frontend/*` → `src/frontend/*`
  - `@/backend/*` → `src/backend/*`
  - `@/shared/*` → `src/shared/*`
  - Convenience aliases:
    - `@/components/*` → `src/frontend/components/*`
    - `@/contexts/*` → `src/frontend/contexts/*`
    - `@/types/*` → `src/frontend/types/*` and `src/shared/types/*`
    - `@/lib/*` → `src/backend/*`
  - Guidance: Prefer `@/frontend/*`/`@/backend/*` in new code; convenience aliases remain supported during transition.

- Add ESLint import rules:
  - Disallow imports from `src/frontend/**` within `src/backend/**`
  - Disallow imports from backend within frontend
  - Allow both to import from `src/shared/**`

### Execution Steps (Detailed)

1) Create folders: `src/frontend/`, `src/backend/`, `src/shared/types/`.
2) Move processing files to `src/frontend/processing/` and update imports.
3) Move API/cache/config/server utils to `src/backend/**` and update imports in API routes/services.
4) Move shared types (`api.ts`, `external-apis.ts`) to `src/shared/types/` and update imports across FE/BE.
5) Move FE-only types under `src/frontend/types/**` and BE-only under `src/backend/types/**`.
6) Ensure `src/frontend/contexts/constants-context.tsx` imports image utils from `@/frontend/utils/image-url`.
7) Confirm legacy `src/utils/**` files are removed after migrations.
8) Migrate tests per the Test Organization section; do not change test logic.
9) Verify Jest buckets run independently using the commands above.
10) Run `pnpm lint`, `pnpm type-check`, `pnpm test`; fix any path/import issues.
11) Optional: add ESLint boundary rules; re-run lint.
12) Final pass to confirm `src/app/**` remains unchanged and pages compile.

### Acceptance Criteria

- No UI or behavior changes.
- `team-context` no longer calls other state contexts for network; uses fetching contexts instead.
- Leaf components do not import contexts; they receive all data via props.
- All persistence flows through `config-context`.
- Lint, type, and test suites pass.

### Notes & Risks

- Mechanical file moves can surface import path drift—prefer local alias/barrels to keep surfaces stable.
- Stateless-ization may widen props; keep props cohesive and typed (consider grouping into `...Props` types).
- If needed, add ESLint rules later to enforce import boundaries once the refactor is complete.

### Component Data Requirements and Context Selectors

Documenting the concrete data each component needs, and which context should produce it. Where a component currently derives data locally, we specify recommended selectors to move those derivations into appropriate contexts (or explicit page-level composition when it spans multiple contexts). UI/behavior must remain identical.

#### Pages (stateful containers)

1) DashboardPage (`components/dashboard/DashboardPage.tsx`)
- Requires
  - From Team State Context
    - `teams: Map<string, TeamData>`
    - `selectedTeamId: { teamId: number; leagueId: number } | null`
    - Actions: `addTeam`, `refreshTeam`, `removeTeam`, `editTeam`, `setSelectedTeamId`
    - Selectors: `getAllTeams()` (already present)
  - Local derivations (keep local):
    - `teamExists(teamId, leagueId)`: computed via `teams.has(key)`
- Presentational contracts
  - `AddTeamForm`: ids, change handlers, submit handler, `teamExists`, submitting state
  - `TeamList`: `teamDataList` (Array<TeamData>), `activeTeam`, handlers for refresh/remove/setActive/edit
  - `EditTeamSheet`: modal open/close, current ids, onSave, `teamExists`
- Recommended selectors to add (Team Context)
  - `getActiveTeamId(): { teamId: number; leagueId: number } | null` (alias to `selectedTeamId`)
  - `teamExists(teamId: number, leagueId: number): boolean` (optional convenience)

2) MatchHistoryPage (`components/match-history/MatchHistoryPage.tsx`)
- Requires
  - From Team State Context
    - `getAllTeams(): TeamData[]`
    - `teams: Map<string, TeamData>`
    - `selectedTeamId`
    - `addMatchToTeam(matchId, side)`
  - From Match State Context
    - `addMatch(matchId)`
    - `refreshMatch(matchId)`
    - `getMatch(matchId)`
  - From Config Context
    - `setTeams(updatedTeams)` (persistence for manual matches)
  - Local (page) state
    - Filters (dateRange, result, opponent, teamSide, pickOrder, heroesPlayed, highPerformersOnly)
    - View mode: list/grid (from hook backed by config)
    - `matchDetailsViewMode`
    - Hidden matches list/modal visibility
    - Add match form state (open, id, side, isSubmitting, error)
  - Local derivations (current)
    - `teamMatches` for active team (Record<number, TeamMatchParticipation>)
    - `activeTeamMatches: Match[]` (via mapping `teamMatches` keys through `getMatch`)
    - `filteredMatches` (via `useMatchFilters`)
    - `unhiddenMatches` (visible + previously hidden toggle)
    - `selectedMatch` from `selectedMatchId` + `getMatch`
    - `matchExists(matchId)` against active team
- Presentational contracts (examples)
  - `ResizableMatchLayout` requires: `filters`, `activeTeamMatches`, `teamMatches`, `visibleMatches`, `filteredMatches`, `unhiddenMatches`, hide/refresh handlers, selection, `hiddenMatchesCount`, `hiddenMatchIds`, `selectedMatch`, details view mode, scroll helper, `onAddMatch`
  - `HeroSummaryTable`: `matches`, `teamMatches`, `allMatches`
  - `AddMatchForm`: open/close, ids, side, submit handler, `matchExists`, submitting, error
- Recommended selectors to add
  - Team Context
    - `getActiveTeamKey(): string | null`
    - `getActiveTeamMatches(): Record<number, TeamMatchParticipation>`
    - `hasActiveTeamMatch(matchId: number): boolean`
  - Match Context
    - `getMatchesByIds(ids: number[]): Match[]`
    - `isMatchKnown(matchId: number): boolean`
  - Filtering remains a page-level composition since it combines team and match data and view filters.

3) PlayerStatsPage (`components/player-stats/PlayerStatsPage.tsx`)
- Requires
  - From Player State Context
    - `players: Map<number, Player>`
    - `isLoading`
    - Actions: `refreshPlayer`, `addPlayer`
  - From Team State Context
    - `selectedTeamId`
    - Actions: `addPlayerToTeam`, `removeManualPlayer`, `editManualPlayer`
    - Selector: `getSelectedTeam()`
  - From Config Context
    - `config.preferredPlayerlistView` and `updateConfig` for list/grid preference
  - Local (page) state
    - `selectedPlayerId`, `showHiddenModal`, `hiddenPlayers`, `viewMode`, `playerDetailsViewMode`, add/edit sheets
  - Local derivations (current)
    - `playersArray` from players map
    - `sortedPlayers` by `personaname`
    - `manualPlayerIds` from selected team
    - `selectedPlayer` by `selectedPlayerId`
- Presentational contracts (examples)
  - `ResizablePlayerLayout` requires: `players`, `visiblePlayers`, `filteredPlayers`, hide/refresh handlers, view mode, selection, hidden counts/ids, `selectedPlayer`, details view mode, scroll helpers, onAdd/onEdit/onRemove
  - Sheets and details panels require the obvious ids, arrays, and callbacks
- Recommended selectors to add
  - Player Context
    - `getPlayersArray(): Player[]` (array view of the map)
  - Team Context
    - `getManualPlayerIdsForSelected(): Set<number>`
  - Sorting can remain page-level or be offered as a pure helper for reuse.

#### Key Leaf Components (should be stateless)

1) MatchListViewCard (`components/match-history/list/MatchListViewCard.tsx`)
- Should accept props (no contexts inside):
  - `match: Match`
  - `selectedMatchId: number | null`
  - `onSelectMatch(matchId: number)`
  - `onHideMatch(matchId: number)`
  - `onRefreshMatch(matchId: number)`
  - `teamMatch?: TeamMatchParticipation`
  - `onScrollToMatch?(matchId: number)`
  - `preferredExternalSite: 'dotabuff' | 'opendota'`
  - `isManualMatch: boolean`
  - `currentTeamSide: 'radiant' | 'dire'`
  - `onEditManualMatch(newMatchId: number, teamSide: 'radiant' | 'dire')`
  - `onRemoveManualMatch(matchId: number)`
- Data producers
  - `preferredExternalSite` from Config Context (page pulls, passes down)
  - `isManualMatch` and `currentTeamSide` derived from Team Context for active team (page computes from `teamMatches`/`manualMatches`)

2) MatchListViewList (`components/match-history/list/MatchListViewList.tsx`)
- Should accept props: `matches: Match[]`, `teamMatches`, selection id, selection/hide/refresh callbacks, and scroll helper.

3) HeroSummaryTable (`components/match-history/summary/HeroSummaryTable.tsx`)
- Inputs: `matches: Match[]`, `teamMatches: Record<number, TeamMatchParticipation>`, `allMatches: Match[]`.
- Data producer: page derives from contexts; table remains pure.

4) ResizableMatchLayout (`components/match-history/ResizableMatchLayout.tsx`)
- Inputs already enumerated in the page render call; must remain props-only.

5) ResizablePlayerLayout (`components/player-stats/ResizablePlayerLayout.tsx`)
- Inputs already enumerated in the page render call; must remain props-only.

6) TeamList (`components/dashboard/TeamList.tsx`)
- Inputs: `teamDataList: TeamData[]`, `activeTeam`, and handlers for refresh/remove/setActive/edit.
- Data producer: page from Team Context selectors.

#### Selector Summary (to add or confirm)

- Team State Context
  - `getActiveTeamId()` or expose `selectedTeamId`
  - `getActiveTeamKey()`
  - `getActiveTeamMatches()`
  - `hasActiveTeamMatch(matchId: number)`
  - `getManualPlayerIdsForSelected()`
- Match State Context
  - `getMatchesByIds(ids: number[])`
  - `isMatchKnown(matchId: number)`
- Player State Context
  - `getPlayersArray()`
- Config Context
  - Existing getters/setters for preferences; page reads and passes down.

Notes
- Cross-context derivations (e.g., mapping team match IDs to full `Match` objects) should be composed in page containers to preserve the rule that state contexts do not depend on each other. Where helpful, provide small utility selectors in each context that operate only on their own state (IDs in, objects out), and compose them at the page level.



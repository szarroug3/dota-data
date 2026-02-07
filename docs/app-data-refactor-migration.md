# App Data Refactor & Migration Plan

This document describes an incremental roadmap for consolidating all frontend data handling into a single, coherent architecture. Each phase is short, testable, and reversible. Follow the steps in order; do not start a later phase until the current one has shipped with green tests and manual verification.

**Current Status:** ~65% complete. Core architecture is in place; derived data migration and some cleanup remain.

---

## Phase 0 · Baseline & Guardrails ✅ COMPLETE

**Status:** ✅ Complete

Goal: freeze the current behaviour, establish safety nets, and understand the existing flows before moving data structures.

1. **Inventory current behaviour** ✅
   - ✅ Documented in `app-data-phase0-inventory.md`
   - ✅ All data sources, storage, calculations, and fetch order documented
   - ✅ File responsibilities snapshot created
2. **Freeze tests + add coverage for critical flows** ✅
   - ✅ `AppDataHydration.test.ts` covers hydration from localStorage
   - ✅ `usePlayerData.test.tsx` covers player placeholders from stored metadata
   - ✅ Unit tests exist for storage manager and operations modules
3. **Static analysis cleanup** ✅
   - ✅ Lint/type issues mostly addressed
   - ⚠️ Some legacy type-check failures remain (documented in inventory) - non-blocking

**Deliverables:** ✅ Updated documentation, passing test suite, clean base established.

---

## Phase 1 · Centralise Data Storage Shapes ✅ COMPLETE

**Status:** ✅ ~95% Complete

Goal: ensure every entity has **one canonical in-memory format** and **one persisted format**.

1. **Define canonical types** ✅
   - ✅ `app-data-types.ts` exports `Team`, `Match`, `Player`, `Hero`, `Item`, `League`
   - ✅ All in-memory Maps use canonical types
2. **Align persistence layer** ✅
   - ✅ `storage-manager.ts` serializes/deserializes using canonical types
   - ⚠️ No explicit version key in localStorage (migration handled via type compatibility)
3. **Refactor all loaders** ✅
   - ✅ `fetchAndProcessMatch` returns canonical `Match` entities
   - ✅ `fetchAndProcessPlayer` returns canonical `Player` entities
   - ✅ League loaders return canonical entities
   - ✅ Placeholder builders consolidated

**Tests:** ✅ Reload app verified; automated suite passing.

---

## Phase 2 · Context-Owned Derived Data ⚠️ IN PROGRESS

**Status:** ⚠️ ~80% Complete

Goal: all calculations (sorting, filtering, stats, aggregates) live in context, not components.

1. **Identify derived data** ✅
   - ✅ Calculations documented in `app-data-phase0-inventory.md` and `computed-data-migration-plan.md`
2. **Add derived-data modules** ✅
   - ✅ `app-data-derivations.ts` (re-exports)
   - ✅ `app-data-player-derivations.ts` (player sorting, hidden players)
   - ✅ `app-data-match-derivations.ts` (match filtering, hidden matches)
   - ✅ `app-data-hero-derivations.ts` (hero summaries)
   - ✅ `app-data-performance-derivations.ts` (team performance)
   - ✅ `app-data-statistics-ops.ts` (player/hero/team statistics)
   - ✅ Pure functions implemented with unit tests
3. **Expose derived data through context** ⚠️ PARTIAL
   - ✅ Statistics methods exposed via `AppData` (`getPlayerStats`, `getPlayerHeroStats`, etc.)
   - ❌ Derived data not fully memoized/cached in AppData
   - ❌ No automatic recomputation triggers after mutations
4. **Refactor consumers** ⚠️ PARTIAL
   - ✅ `HeroSummaryTable.tsx` - Now uses `appData.getTeamHeroSummaryForMatches()` instead of duplicate aggregation
   - ✅ `MatchHistoryPageSections.tsx` - Match data logic moved to AppData (completed in container migration)
   - ✅ Match history UI - Events, Draft, Players, Filters, List cards, Edit-manual-match duplicate check, and HiddenMatchesModal now use AppData selectors (see **Match History Data Ops Refactor** below)
   - ✅ `manualPlayerIds` - Now uses `appData.getTeamManualPlayerIds()` (completed in container migration)
   - ✅ `PlayerStatsPage.tsx` - Now uses `appData.sortPlayersByName()` and `appData.filterPlayersByTeam()` instead of hooks
   - ✅ `PlayerDetailsPanelTeamView.tsx` - Now uses `appData.getTeamPlayerStats()` instead of local `computeAverages()` and `computePlayerTeamStats()`

- ✅ `PlayerDetailsPanelDetails.tsx` - Now uses `appData.getPlayerRecentHeroRows()` instead of local date filtering and `buildHeroRows()`

**Remaining Work:**

- Add memoized computed caches to `AppData` for frequently accessed derived data

**Manual QA:** ⚠️ Pending - verify CPU profiles after completion.

---

## Phase 3 · Page-Level Containers ⚠️ IN PROGRESS

**Status:** ⚠️ ~70% Complete

Goal: enforce the "container + stateless component" structure across all routes.

1. **Define container responsibilities** ✅
   - ✅ Containers subscribe to `AppData` selectors
   - ✅ Containers trigger data refresh actions
   - ✅ Containers pass plain props to stateless components
2. **Implement containers** ✅
   - ✅ `DashboardPageContainer` exists and handles team summaries
   - ✅ `MatchHistoryPageSections.tsx` exists as container
   - ✅ `PlayerStatsPageContainer` exists (thin wrapper)
   - ⚠️ Some containers still do derivations:
     - `DashboardPageContainer` orders teams in container
     - `PlayerStatsPage.tsx` does filtering/sorting in component
3. **Refactor hooks to pure selectors** ⚠️ PARTIAL
   - ✅ Some hooks converted to thin wrappers (`usePlayerData`, `useAppData`)
   - ⚠️ Some hooks still contain logic (`useSortedPlayers`, `useFilteredTeamPlayers`)
   - ⚠️ Side-effectful logic still exists in some components
4. **Lint/Type pass** ⚠️
   - ⚠️ Some legacy type issues remain (non-blocking)

**Remaining Work:**

- Move remaining derivations from containers to context
- Convert remaining hooks to pure selectors
- Remove side-effectful logic from stateless components

**Tests:** ✅ Component tests exist; snapshot tests pending.

---

## Phase 4 · Fetch Orchestration Pipeline ✅ COMPLETE (Alternative Implementation)

**Status:** ✅ Complete (implemented differently than originally planned)

**Note:** Instead of a separate `app-data-orchestrator.ts` module, orchestration is implemented directly in `AppDataProvider` and `useAppHydration` hook. This approach was chosen for better React integration and is the intended final design.

Goal: implement the new fetching order with clear phases and parallelism where allowed.

1. **Design orchestration module** ✅ (Alternative approach)
   - ✅ Orchestration logic in `AppDataProvider` (lines 59-146)
   - ✅ `useAppHydration` hook handles additional hydration steps
   - ✅ Explicit phases defined:
     - `loadFromStorage()` - hydrate from localStorage
     - `loadReferenceData()` - parallel heroes/items/leagues
     - `refreshActiveTeam()` - active team bundle
     - `refreshInactiveTeams()` - other teams
     - `refreshGlobalTeam()` - global team manual data
     - `hydrateManualPlayers()` - manual players
2. **Implement step-by-step logic** ✅
   - ✅ Step 1: hydrate via `appData.loadFromStorage()`
   - ✅ Step 2: reference data via `Promise.all([loadHeroesData, loadItemsData, loadLeaguesData])`
   - ✅ Step 3: active team bundle
     - `refreshTeam()` fetches team and league matches
     - `loadTeamMatches()` loads matches and players
   - ✅ Step 4: inactive teams refresh sequentially
   - ✅ Step 5: global team and manual data loaded
3. **Progress & error handling** ✅
   - ✅ Error handling per phase with try/catch
   - ✅ Partially failing teams don't block others
   - ⚠️ Loading states tracked but could be more granular
4. **Context initialisation** ✅
   - ✅ `AppDataProvider` handles initialization
   - ✅ State updates and cache recalculations occur after each phase
   - ✅ `useAppHydration` provides additional hydration for edge cases

**Current Flow:**

1. `AppDataProvider` initializes on mount
2. Loads from storage → reference data → active team → inactive teams → global team → manual players
3. `useAppHydration` handles additional hydration scenarios

**Tests:** ✅ Integration tests exist; ordering verified in practice.

---

## Phase 5 · Immediate UI Updates & Persistence ⚠️ MOSTLY COMPLETE

**Status:** ✅ ~95% Complete

Goal: guarantee that after each fetch/mutation the UI and storage reflect the new data instantly.

1. **Centralise mutation pipeline** ✅
   - ✅ All data-changing operations update in-memory entities
   - ✅ `updateTeamsRef()`, `updateMatchesRef()`, `updatePlayersRef()` trigger React re-renders
   - ✅ Derived data recomputed via `updateTeamMatchParticipation()` and `updateTeamPlayersMetadata()`
   - ✅ `saveToStorage()` persists to localStorage
2. **Add post-fetch hooks** ✅
   - ✅ After each fetch: entity maps updated
   - ✅ Derivation recomputers called (match participation, player metadata)
   - ✅ Storage saved after mutations
3. **Optimise storage writes** ✅ COMPLETE
   - ⚠️ Storage writes happen immediately (no batching/debouncing yet - optional optimization)
   - ✅ Final state persists correctly
   - ✅ Error handling for localStorage quota exceeded implemented
   - ✅ Progressive optimization strategy: limits data per team, cleans old teams, falls back to minimal data
   - ✅ Graceful degradation when storage quota is exceeded
4. **Visual verification** ❌
   - ❌ End-to-end Playwright test pending for refresh → UI update → persistence flow

**Remaining Work:**

- Add batched/debounced storage writes for bulk operations (optional optimization)
- Add Playwright test for UI update and persistence verification

---

## Phase 6 · Cleanup & Documentation ⚠️ IN PROGRESS

**Status:** ⚠️ ~50% Complete

Goal: polish the codebase to match the maintainability criteria.

1. **File structure audit** ✅
   - ✅ Files organized by responsibility:
     - Operations: `app-data-*-ops.ts` modules
     - Derivations: `app-data-*-derivations.ts` modules
     - Loaders: `match-loader.ts`, `player-loader.ts`, `team-loader.ts`, etc.
     - Persistence: `storage-manager.ts`
   - ✅ Most files under ~300 lines
   - ✅ `app-data.ts` is ~1035 lines (justified as main API surface)
2. **Documentation** ⚠️ PARTIAL
   - ✅ `app-data-phase0-inventory.md` documents current state
   - ✅ `data-flow-analysis.md` documents all data flows
   - ✅ `architecture.md` updated with new structure
   - ⚠️ README could be updated with new flow diagrams
   - ❌ No ADR for single-source-of-truth decision yet
3. **Lint & type enforcement** ⚠️
   - ⚠️ Most lint issues resolved
   - ⚠️ Some legacy type-check failures remain (non-blocking, documented)
   - ⚠️ Could enforce stricter rules (`eslint --max-warnings=0`)
4. **Knowledge transfer** ❌
   - ❌ Onboarding doc for future contributors pending

**Remaining Work:**

- Update README with new architecture diagrams
- Create ADR for single-source-of-truth decision
- Create onboarding documentation
- Resolve remaining type-check issues (if needed)

**Deliverable:** ⚠️ In progress - structure is good, documentation needs completion.

---

## Additional Recommendations

- **Feature flags:** ✅ Not needed - orchestration is stable
- **Logging & Metrics:** ⚠️ Basic error logging exists; could add more granular debug logs
- **Migration script:** ⚠️ Not needed yet; type compatibility handles migrations
- **Performance monitoring:** ⚠️ Pending - should profile after Phase 2 completion
- **Design collaboration:** ✅ UI expectations documented in `data-flow-analysis.md`

## Current State Summary

**Completed Phases:**

- ✅ Phase 0: Baseline & Guardrails
- ✅ Phase 1: Centralise Data Storage Shapes
- ✅ Phase 4: Fetch Orchestration Pipeline (alternative implementation)

**In Progress:**

- ⚠️ Phase 2: Context-Owned Derived Data (~80%)
- ⚠️ Phase 3: Page-Level Containers (~70%)
- ⚠️ Phase 5: Immediate UI Updates & Persistence (~95%)
- ⚠️ Phase 6: Cleanup & Documentation (~50%)

**Key Decisions Made:**

1. **Hydration Approach:** Orchestration implemented in `AppDataProvider` and `useAppHydration` rather than separate module - this is the intended final design
2. **Derived Data:** Statistics operations centralized in `app-data-statistics-ops.ts`; derivations in separate modules
3. **Type System:** Canonical types in `app-data-types.ts`; storage types in `storage-manager.ts`

**Next Steps:**

1. Complete Phase 2: Move remaining calculations to context-derived selectors
2. Complete Phase 3: Remove remaining derivations from containers
3. Optimize Phase 5: Add batched storage writes
4. Complete Phase 6: Finish documentation

---

## Active Migration: Container Calculations → AppData Context

**Status:** ✅ COMPLETE

### Overview

Moving calculations from page containers to AppData context methods/derivations. Containers should become thin selectors that pass data to stateless components.

**All three page containers have been successfully migrated:**

- ✅ DashboardPageContainer - Team ordering logic moved to AppData
- ✅ MatchHistoryPageSections - Match data and placeholder logic moved to AppData
- ✅ PlayerStatsPage - Manual player IDs extraction moved to AppData

### Issues Found

1. **MatchHistoryPageSections.tsx** ✅ COMPLETE
   - ✅ `useMatchData()` hook removed
   - ✅ Now uses `appData.getTeamMatchesWithPlaceholders()` directly
   - ✅ Placeholder creation logic moved to AppData

2. **DashboardPageContainer.tsx** ✅ COMPLETE
   - ✅ Team ordering logic moved to AppData
   - ✅ Teams now sorted by most recently added (descending) instead of active team first

3. **PlayerStatsPage.tsx** ✅ COMPLETE
   - ✅ Manual player IDs extraction moved to `appData.getTeamManualPlayerIds()`
   - ✅ Fixed bug where code accessed non-existent `team.manualPlayerIds` property
   - ✅ Now correctly extracts from `team.players` Map where `isManual === true`

### Implementation Plan

#### Step 1: Add Missing Methods to AppData ✅

**File:** `src/frontend/lib/app-data-data-ops.ts` (or `app-data-computed-ops.ts`)

1. ✅ **`getAllTeamsForDisplayOrdered(activeTeamId?: string): TeamDisplayData[]`**
   - Uses `getAllTeamsForDisplay()` and orders with active team first
   - Returns ordered array for dashboard

2. ✅ **`getTeamMatchesWithPlaceholders(teamKey: string): Match[]`**
   - ✅ Uses `getTeamMatches()` logic and creates placeholders for matches not yet loaded
   - ✅ Handles placeholder creation logic moved from `useMatchData()`
   - ✅ Returns array of Match objects (full or placeholder)

3. ✅ **`getTeamManualPlayerIds(teamKey: string): Set<number>`**
   - ✅ Extracts manual player IDs from `team.players` Map where `isManual === true`
   - ✅ Returns Set of player account IDs
   - ✅ Excludes players with accountId <= 0

#### Step 2: Update DashboardPageContainer ✅ COMPLETE

**File:** `src/frontend/teams/components/containers/DashboardPageContainer.tsx`

1. ✅ Replace team ordering logic:
   - ✅ Removed `orderedTeams` useMemo (lines 207-224)
   - ✅ Uses `appData.getAllTeamsForDisplayOrdered()` which sorts by most recently added
   - ✅ Simplified to a single line
   - ✅ Added unit tests for the new function

#### Step 3: Update MatchHistoryPageSections ✅ COMPLETE

**File:** `src/frontend/matches/components/containers/MatchHistoryPageSections.tsx`

1. ✅ Replace `useMatchData()` hook:
   - ✅ Removed `useMatchData()` hook (lines 234-274)
   - ✅ Uses `appData.getTeamMatchesWithPlaceholders(selectedTeamId)` directly in useMemo
   - ✅ Simplified from 40+ lines to 7 lines
   - ✅ Removed unused `createPlaceholderMatch` import

#### Step 4: Update PlayerStatsPage ✅ COMPLETE

**File:** `src/frontend/players/components/stateless/PlayerStatsPage.tsx`

1. ✅ Replace manual player IDs extraction:
   - ✅ Removed `manualPlayerIds` useMemo that accessed non-existent `selectedTeam.manualPlayerIds` property
   - ✅ Uses `appData.getTeamManualPlayerIds(selectedTeamId)` directly in useMemo
   - ✅ Simplified from 4 lines to 7 lines (with proper dependencies)
   - ✅ Added unit tests for the new function

### Files to Modify

1. ✅ `src/frontend/lib/app-data-data-ops.ts` - Add `getAllTeamsForDisplayOrdered` method
2. ✅ `src/frontend/lib/app-data-computed-ops.ts` - Add `getTeamMatchesWithPlaceholders` method
3. ✅ `src/frontend/lib/app-data.ts` - Expose new methods
4. ✅ `src/frontend/teams/components/containers/DashboardPageContainer.tsx` - Simplify ✅ COMPLETE
5. ✅ `src/frontend/matches/components/containers/MatchHistoryPageSections.tsx` - Simplify ✅ COMPLETE
6. ✅ `src/frontend/lib/app-data-computed-ops.ts` - Add `getTeamManualPlayerIds` method
7. ✅ `src/frontend/lib/app-data.ts` - Expose new method
8. ✅ `src/frontend/players/components/stateless/PlayerStatsPage.tsx` - Simplify ✅ COMPLETE

### Benefits

- ✅ Single source of truth for calculations
- ✅ Containers become thin selectors
- ✅ Easier to test (pure functions)
- ✅ Better performance (can memoize in AppData)
- ✅ Consistent data access patterns

---

### Match History Data Ops Refactor ✅ COMPLETE

Match-history data operations have been moved from UI components into AppData ops/derivations. Containers and stateless components now rely on AppData selectors/actions per the container and stateless READMEs.

**New AppData selectors/actions:**

- `parseMatchAndUpdate(matchId)` – wraps API parse + processing + addMatch (replaces inline UI flow).
- `getMatchPerformanceTimelineChartData(matchId)` / `getMatchPerformanceTimelineBounds(matchId)` – chart-ready data for the events panel (logic in `match-performance-timeline.ts`).
- `getHighPerformingHeroIdsForTeam(teamKey, hiddenMatchIds)` / `isHighPerformingHero(heroId, teamKey, hiddenMatchIds)` – replace repeated win-rate scans in UI.
- `getHeroesPlayedOptions(teamKey)` / `getOpponentNameOptions(teamKey)` – filter dropdown options (from `app-data-match-derivations.ts`).
- `getMatchHeroesForTeam(matchId, teamKey)` / `getMatchHeroesForTeamWithStored(matchId, teamKey, storedHeroes)` / `getMatchManualMetadata(matchId, teamKey)` – list cards (from `app-data-computed-ops.ts`).
- `getMatchPickOrderLabel(matchId, teamKey)` / `getMatchResultLabel(matchId, teamKey)` – match badges/hidden match display (from `app-data-computed-ops.ts`).
- `getDraftPhases(matchId, filter)` / `getPlayersSortedByDraft(matchId, side)` – draft and players panels (from `app-data-match-derivations.ts`).
- `getEditManualMatchDuplicateError(teamKey, newMatchId, currentMatchId)` – duplicate validation for edit-manual-match sheet.

**UI consumers updated to use AppData:**

- `MatchDetailsPanelEvents.tsx` – uses `parseMatchAndUpdate`, `getMatchPerformanceTimelineChartData`, `getMatchPerformanceTimelineBounds`.
- `MatchDetailsPanelDraft.tsx` – uses `getDraftPhases`, `isHighPerformingHero`.
- `MatchDetailsPanelPlayers.tsx` – uses `getPlayersSortedByDraft`, `isHighPerformingHero`.
- `MatchFilters.tsx` – uses `getHeroesPlayedOptions`, `getOpponentNameOptions` (receives `selectedTeamId`).
- `MatchListViewList.tsx` – uses `getMatchHeroesForTeam`, `getMatchManualMetadata` in card state.
- `MatchListViewCard.tsx` – uses `getEditManualMatchDuplicateError` for duplicate validation.
- `HiddenMatchesModal.tsx` – uses `isHighPerformingHero` (receives `selectedTeamId`).

**Tests:** Unit tests added in `src/tests/frontend/lib/app-data-computed-ops.test.ts` for `getMatchHeroesForTeam` and `getMatchManualMetadata`.

---

### Active Migration: Page Container Ops → AppData ⚠️ IN PROGRESS

Moving remaining page-level data operations into AppData so containers are purely presentational.

**New AppData selectors/actions:**

- `getMatchHistoryData(teamKey, filters, hiddenMatchIds, selectedMatchId)` – consolidated match-history derivations (active/filtered/visible/unhidden/selected + filter stats).
- `getTeamPlayersViewData(players, teamKey)` – team-scoped player IDs, filtering, sorting, and manual IDs in one call.
- `validateTeamFormInputs(teamIdInput, leagueIdInput)` – validation wrapper for team forms.
- `parseTeamIdsFromInputs(teamIdInput, leagueIdInput)` – strict parsing with validation errors.
- `addTeamFromInputs(teamIdInput, leagueIdInput)` – add team via validated inputs.
- `editTeamFromInputs(currentTeamIdInput, currentLeagueIdInput, newTeamIdInput, newLeagueIdInput)` – edit team via validated inputs.
- `removeTeamByIds(teamId, leagueId)` – remove team + persist.
- `setSelectedTeamByIds(teamId, leagueId)` – set active team by numeric IDs.

**UI consumers to update:**

- `MatchHistoryPageContainer.tsx`
- `PlayerStatsPage.tsx`
- `DashboardPageContainer.tsx`

**Tests:** Add unit tests for `getMatchHistoryData` and `getTeamPlayersViewData` in `src/tests/frontend/lib/app-data-computed-ops.test.ts`.

---

Following this plan should incrementally transform the data layer into a coherent, maintainable, and testable system while keeping the UI stable at each step.

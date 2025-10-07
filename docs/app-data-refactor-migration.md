# App Data Refactor & Migration Plan

This document describes an incremental roadmap for consolidating all frontend data handling into a single, coherent architecture. Each phase is short, testable, and reversible. Follow the steps in order; do not start a later phase until the current one has shipped with green tests and manual verification.

---

## Phase 0 · Baseline & Guardrails

Goal: freeze the current behaviour, establish safety nets, and understand the existing flows before moving data structures.

1. **Inventory current behaviour**
   - Document where matches, players, teams, heroes, items, and leagues are fetched, stored, and transformed (context, hooks, components).
   - Note every place that reads from localStorage directly.
   - Identify all ad-hoc calculations in components (sorting, filtering, aggregations).
2. **Freeze tests + add coverage for critical flows**
   - Extend component integration tests to cover:
     - Hydration from localStorage
     - Active team refresh (matches + players)
     - Global team manual data
   - Ensure unit tests exist for `storage-manager`, `app-data-player-metadata-ops`, and existing calculators.
3. **Static analysis cleanup**
   - Enforce `noImplicitAny`, `strictNullChecks`, and ESLint warnings on `any`/`unknown`.
   - Fix existing lint/type issues so later steps fail fast.

Deliverables: updated documentation (this inventory), passing test suite, lint/type clean base.

---

## Phase 1 · Centralise Data Storage Shapes

Goal: ensure every entity has **one canonical in-memory format** and **one persisted format**.

1. **Define canonical types**
   - Create a `types` module exporting `TeamEntity`, `MatchEntity`, `PlayerEntity`, etc.
   - Update in-memory Maps to use these types.
2. **Align persistence layer**
   - Update `storage-manager` to serialise/deserialise using the canonical types (possibly with DTOs for persistence).
   - Add migration logic if the storage shape changes (version key in localStorage).
3. **Refactor all loaders**
   - Ensure `fetchAndProcessMatch`, `fetchAndProcessPlayer`, and league loaders return canonical entities.
   - Remove duplicate placeholder builders; keep a single `createPlaceholder<Entity>` per type.

Tests: reload app to ensure localStorage migration is lossless; run automated suite.

---

## Phase 2 · Context-Owned Derived Data

Goal: all calculations (sorting, filtering, stats, aggregates) live in context, not components.

1. **Identify derived data**
   - List calculations currently done in hooks/components (player sorting, hidden-state counts, match formatting, statistics).
2. **Add derived-data modules**
   - Introduce `app-data-derivations` folder.
   - For each calculation:
     - Implement a pure function that takes canonical entities and returns computed representations (e.g. `computeTeamDisplayData(team, matches, players)`).
     - Write unit tests.
3. **Expose derived data through context**
   - Extend `AppData` with getters or computed caches (memoised) that rely on the new functions.
   - Trigger recomputation immediately after data mutations/fetches.
4. **Refactor consumers**
   - Update page containers/hooks to consume the precomputed data from context.
   - Remove leftover calculations from components.

Manual QA: verify CPU profiles stay reasonable (no runaway recomputation). Components should become “dumb” renderers.

---

## Phase 3 · Page-Level Containers

Goal: enforce the “container + stateless component” structure across all routes.

1. **Define container responsibilities**
   - Each container should:
     - Subscribe to `AppData` selectors.
     - Trigger data refresh actions (e.g. `refreshTeam`).
     - Pass plain props to stateless subcomponents.
2. **Implement containers**
   - Dashboard: `DashboardPageContainer` handles team summaries, metrics.
   - Match History: ensure `MatchHistoryPageContainer` exists (or create).
   - Player Stats: confirm existing container does no direct derivations.
3. **Refactor hooks to pure selectors**
   - Convert stateful hooks into thin wrappers over context selectors.
   - Remove side-effectful logic from stateless components.
4. **Lint/Type pass**
   - Ensure there are no lingering `any`s introduced during refactor.

Tests: snapshot & behaviour tests for each page verifying props passed to stateless components.

---

## Phase 4 · Fetch Orchestration Pipeline

Goal: implement the new fetching order with clear phases and parallelism where allowed.

1. **Design orchestration module**
   - Create `app-data-orchestrator.ts` responsible for sequencing phases.
   - Define explicit steps:
     - `hydrateFromStorage()`
     - `loadReferenceData()` (parallel heroes/items/leagues)
     - `refreshTeamBundle(teamKey, options)` handling leagues/matches/players.
2. **Implement step-by-step logic**
   - Step 1: hydrate (existing `loadFromStorage`).
   - Step 2: reference data via `Promise.all`.
   - Step 3: active team bundle
     - Kick off `refreshTeam` (leagues/[id]).
     - In parallel call `loadCachedMatchesAndPlayers`.
     - After leagues resolve, identify new matches -> fetch matches -> fetch players.
   - Step 4: replicate for other teams (parallel across teams, sequential per-team).
   - Step 5: global team (skip leagues call, reuse match/player logic).
3. **Progress & error handling**
   - Emit loading states per phase (for UI feedback/logging).
   - Gracefully handle partially failing teams without blocking others.
4. **Update context initialisation**
   - Replace current `useEffect` logic with orchestrator usage.
   - Ensure all state updates/cache recalcs occur after each phase.

Tests: integration tests mocking API responses to validate ordering (e.g., spies verifying call sequence).

---

## Phase 5 · Immediate UI Updates & Persistence

Goal: guarantee that after each fetch/mutation the UI and storage reflect the new data instantly.

1. **Centralise mutation pipeline**
   - Wrap all data-changing operations with:
     1. Update in-memory entities.
     2. Recompute derived data.
     3. Persist to storage (if mutation affects stored data).
2. **Add post-fetch hooks**
   - After each successful fetch (match/player/team):
     - Update entity maps.
     - Call derivation recomputers.
     - Save to storage (batched debounced save to avoid thrash).
3. **Optimise storage writes**
   - Implement a queue/debounce to prevent excessive writes during bulk fetches.
   - Ensure final state persists once all fetches settle.
4. **Visual verification**
   - Add end-to-end test (Playwright) verifying that refreshing a team updates the UI without reload and persists across reload.

---

## Phase 6 · Cleanup & Documentation

Goal: polish the codebase to match the maintainability criteria.

1. **File structure audit**
   - Group files by responsibility (fetchers, derivations, orchestrator, persistence).
   - Ensure no file exceeds ~300 lines unless justified.
2. **Documentation**
   - Update README/architecture docs with the new flow diagrams.
   - Add ADR summarising the single-source-of-truth decision.
3. **Lint & type enforcement**
   - Run strict lint rules (`eslint --max-warnings=0`).
   - Ensure TypeScript `strict` remains passing.
4. **Knowledge transfer**
   - Create onboarding doc for future contributors detailing the data flow.

Deliverable: clean, well-structured repository with updated docs and tooling.

---

## Additional Recommendations

- **Feature flags:** Consider gating major phases (especially orchestration changes) behind runtime flags or environment variables to revert quickly if issues arise.
- **Logging & Metrics:** Add debug logs or telemetry around fetch orchestration to diagnose sequence issues in production.
- **Migration script:** If storage shape changes significantly, provide a manual migration/reset tool.
- **Performance monitoring:** After Phase 5, profile on slower devices to ensure pre-computed derivations do not introduce noticeable delays.
- **Design collaboration:** Sync with design/UX to confirm UI expectations when data phases complete (loading indicators, stale data states).

Following this plan should incrementally transform the data layer into a coherent, maintainable, and testable system while keeping the UI stable at each step.


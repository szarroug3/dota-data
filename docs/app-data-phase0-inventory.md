# Phase 0 Inventory — Current Data Flow & Responsibilities

_Last updated: 2025-10-07_

This document captures the present-day behaviour before we begin the refactor. It will serve as the baseline for verifying that future phases preserve functionality.

---

## 1. Data Sources & Fetchers

| Data type | Fetch entry point | Notes |
| --------- | ---------------- | ----- |
| Teams / Leagues | `AppData.fetchTeamAndLeagueData` → `team-loader.ts` / `league-matches-loader.ts` | `refreshTeam` invokes `fetchTeamAndLeagueData`. League matches cached in `leagueMatchesCache`. |
| Matches | `AppData.loadMatch` / `InitializationOps.loadMatch` → `fetchAndProcessMatch` | Called from `loadTeamMatches`, `loadAllManualMatches`, manual-match operations. |
| Players | `AppData.loadPlayer` / `InitializationOps.loadPlayer` → `fetchAndProcessPlayer` | Invoked when loading manual players, refreshing matches, or manual player ops. |
| Reference data (heroes/items/leagues) | `AppData.loadHeroesData`, `.loadItemsData`, `.loadLeaguesData` | Triggered in `AppDataProvider` on mount. |

## 2. Storage & In-Memory State

- **Single source in memory:** `AppData` maintains `_teams`, `_matches`, `_players` Maps. React state mirrors (`_teamsRef`, etc.) for reactivity via `AppDataProvider`.
- **Persistence:** `storage-manager.ts` serialises teams (including match/player metadata) and active team id. Heroes/items/leagues are _not_ persisted.
- **Hydration:** `StorageOps.loadFromStorage` repopulates teams, builds placeholder matches/players, ensures global team.
- **LocalStorage access** outside AppData:
  - `ConfigContext`: stores UI preferences (`preferredPlayerlistView`, manual match/player ids).
  - Tests set up localStorage mocks.

## 3. Calculations & Derived Data

- **Centralised calculations:**
  - `app-data-player-metadata-ops`: aggregates player stats post-fetch.
  - `app-data-match-participation-ops`: determines match sides/results, high-performing heroes.
- **In-component / hook calculations (targets for refactor):**
  - `usePlayerStatsPage.ts`: sorts players, filters by team, manages hidden players, builds placeholder data.
  - `players` stateless components: still apply filtering/hiding logic passed from hook.
  - `teams` components may compute view models locally (needs deeper audit in later phases).
  - `MatchHistory` page: uses hooks to compute grouped views (to confirm in later phases).

## 4. Fetch Order (Current Behaviour)

Inside `AppDataProvider` initialisation effect:
1. Hydrate from storage (`appData.loadFromStorage`).
2. Immediately set `isInitialized`.
3. Load heroes/items/leagues in parallel.
4. Refresh active team (if any).
5. Load **all** manual matches and players (repeated for active team + global team path).
6. Refresh inactive teams sequentially (matches/players currently not forced).

Observed gaps vs desired order:
- Active team matches/players fetched via `loadAllManualMatches/Players`; league matches handled in `refreshTeam`, but extra match fetches not forced.
- Inactive/global teams do not refresh players after league data.

## 5. File Responsibilities Snapshot

| File | Responsibility | Notes |
| ---- | -------------- | ----- |
| `app-data.ts` | Core store, public API, delegates to ops modules | Large (900+ lines), mixes orchestration with CRUD. |
| `app-data-*-ops.ts` | Split logic (UI, data, player metadata, match participation, storage) | Reasonably focused but cross-dependencies exist. |
| `app-data-initialization-ops.ts` | Fetch orchestration (matches/players/teams) | Handles refresh flows and manual data loaders. |
| `storage-manager.ts` | Persistence format, validation, sanitisation | Already canonical for storage; placeholders built here. |
| Hooks (`usePlayerStatsPage`, etc.) | Compose store data for UI | Contain logic that should move into context-derived selectors. |

## 6. Testing Baseline

- Unit tests exist for storage manager sanitisation.
- Component tests around Match History view modes and localStorage integration.
- Gaps:
- No tests covering player list hydration/refresh.
- No integration test ensuring fetch order or persistence after refresh.
- Added baseline Jest test: `AppDataHydration.test.ts` ensures `loadFromStorage` still hydrates teams, matches, and players.
- Added hook-level coverage: `usePlayerData.test.tsx` verifies player placeholders derived from stored metadata.

## 7. Known Technical Debt

- `app-data.ts` size/complexity makes navigation hard.
- Multiple placeholder creators (hooks vs storage ops) diverge.
- Manual matches/players loading happens via global helpers (`loadAllManualMatches`), leading to duplicate API calls.
- Hooks rely directly on `appData` instance; limited memoisation of derived data.
- `ensurePlaceholderPlayers` mutates `_players` without deriving aggregated stats until later.

## 8. Tooling Status (Phase 0 Baseline)

- **Lint:** currently clean for touched files; global run reports an unused import (`createPlaceholderMatch`) which has been removed.
- **Type-check:** `tsc --noEmit` still fails; major buckets to address during later phases:
  - Legacy components expect `TeamMatchMetadata` structures that diverge from `StoredMatchData`, causing cross-type friction in match views.
  - Player stats UI references legacy `manualPlayerIds` fields that no longer exist on `Team`.
  - Historical match processing helpers (`draft.ts`, `events.ts`, `roles.ts`) construct objects that fall outside current type definitions (e.g., missing draft `order`, `"neutral"` side strings, `"Support"`/`"Roaming"` roles).
  - Older test fixtures (e.g., dashboard stats, OpenDota match parsing) omit required fields such as `radiant_score`/`dire_score`.
  - Hidden matches modal utilities instantiate plain objects where `Map` instances are expected.
- We fixed the missing `rank_tier` persistence for manual players and reintroduced a `sortMatchesByDateDesc` helper so player hydration continues to work; the remaining issues are earmarked for the broader refactor.

---

### Next Steps (Phase 0 continued)
1. Stabilise automated tests around hydration and refresh flows.
2. Tighten lint/type settings (no stray `any`, enforce strict mode).
3. Use this inventory as the reference when validating phases 1–6.

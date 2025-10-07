# Implementation Plan: Top-Down Migration to Simple Data Store

## Approach: Need-Driven Development

Instead of building all infrastructure first, we'll **migrate UI components and build what we need as we go**. This ensures we only build what's actually needed and discover requirements organically.

## Current State

### ✅ Phase 1: Mock Data - COMPLETED

- Mock data paths verified
- All API calls working with mock data

### ✅ Phase 2: Minimal Foundation - COMPLETED

**Files Created:**

- `src/frontend/lib/app-data.ts` (~565 lines) - Main data store
- `src/frontend/lib/app-data-types.ts` (~85 lines) - TypeScript interfaces
- `src/frontend/lib/team-loader.ts` (~60 lines) - Team data fetching with deduplication
- `src/frontend/lib/league-matches-loader.ts` (~172 lines) - League matches fetching/processing with deduplication
- `src/frontend/lib/reference-data-loader.ts` (~60 lines) - Heroes/items/leagues loading
- `src/frontend/lib/team-display-formatter.ts` (~85 lines) - Team data formatting for UI
- `src/frontend/lib/storage-manager.ts` (~211 lines) - localStorage persistence
- `src/frontend/lib/README.md` - Documentation

**What we built:**

- ✅ Minimal types (Team, Match, Player, Hero, Item, League)
- ✅ Core data maps (teams, matches, players, heroes, items, leagues)
- ✅ Global tracking (allMatchIds, allPlayerIds for deduplication)
- ✅ UI state (selectedTeamId, selectedLeagueId, isLoading, error)
- ✅ CRUD operations (add, remove, update, get for teams/matches/players)
- ✅ Selection operations (setSelectedTeam, setSelectedMatch, setSelectedPlayer)
- ✅ Context wrapper (`AppDataProvider`)
- ✅ Hook (`useAppData`)
- ✅ Data loading (loadTeam, refreshTeam, refreshAllTeams)
- ✅ Persistence (saveToStorage, loadFromStorage)
- ✅ Reference data loading (heroes, items, leagues)
- ✅ In-flight request deduplication (prevents duplicate API calls)
- ✅ Per-team loading states and error tracking

---

## ✅ Phase 3: Dashboard Migration - COMPLETED

**Files Updated:**

- `src/contexts/app-data-context.tsx` - Provider with app initialization
- `src/app/ClientRoot.tsx` - Wired in AppDataProvider
- `src/frontend/teams/components/containers/DashboardPageContainer.tsx` - Migrated to useAppData

**What we built:**

- ✅ Step 3.1: Context & Hook created and wired into app
- ✅ Step 3.2: Display team list (read-only) with formatting helpers
- ✅ Step 3.3: Add team loading with parallel API calls
- ✅ Step 3.4: Team persistence to localStorage
- ✅ Step 3.5: Team operations (remove, edit, refresh)
- ✅ Step 3.6: Backend 404 handling for non-existent teams/leagues
- ✅ Step 3.7: Per-team error tracking and display
- ✅ Step 3.8: App hydration with background refresh
- ✅ Step 3.9: Request deduplication to prevent duplicate API calls

**Key Features:**

- Teams load from localStorage on app start
- Background refresh fetches latest data for all teams
- Active team loads first (prioritized)
- In-flight request deduplication prevents duplicate API calls
- Per-team loading states and error messages
- Force refresh bypasses backend cache
- Clean, simple code with helper files

---

## Phase 4: Migrate Match History (Top-Down)

> **Strategy**: Migrate Match History page, discover what match-related functionality we need, build incrementally.

### Step 4.1: Analyze Match History Page

**Goal**: Understand what data the Match History page needs

**Files to review:**

- `src/app/match-history/page.tsx`
- `src/frontend/matches/components/containers/MatchHistoryPageContainer.tsx`

**Questions to answer:**

1. What match data does the UI display?
2. What operations are available (add manual match, remove match, refresh)?
3. What computed data is needed (hero stats, draft stats)?
4. How are matches filtered/sorted?

**🛑 PAUSE FOR USER ANALYSIS**

### Step 4.2: Display Matches (Read-Only)

**Goal**: Show matches for selected team using AppData

**What we'll discover:**

- How to get matches for a team
- What match data needs to be pre-computed vs. stored
- How to format match data for UI

**Add to AppData** (as needed):

- `getTeamMatches(teamKey: string): Match[]` - Get all matches for a team
- Match display formatting helper
- Any computed match statistics

**Update Match History Page**:

- Replace `useMatchContext()` with `useAppData()`
- Wire up match display to use `appData.getTeamMatches()`

**Test**:

1. Match History page loads
2. Matches display for selected team
3. Match details show correctly

**🛑 PAUSE FOR USER TESTING**

### Step 4.3: Add Match Operations

**Goal**: Support add manual match, remove match, refresh

**Add to AppData** (as needed):

- Match loading/fetching methods
- Match removal with cleanup
- Match refresh logic

**Update Match History Page**:

- Wire up Add Manual Match button
- Wire up Remove Match button
- Wire up Refresh button

**Test**:

1. Can add manual match
2. Can remove match
3. Can refresh matches
4. Data persists correctly

**🛑 PAUSE FOR USER TESTING**

---

## Phase 5: Migrate Player Stats (Top-Down)

> **Strategy**: Migrate Player Stats page, discover what player-related functionality we need, build incrementally.

### Step 5.1: Analyze Player Stats Page

**Goal**: Understand what data the Player Stats page needs

**Files to review:**

- `src/app/player-stats/page.tsx`
- `src/frontend/players/components/containers/PlayerStatsPageContainer.tsx`

**Questions to answer:**

1. What player data does the UI display?
2. What operations are available (add manual player, remove player, refresh)?
3. What computed data is needed (hero stats per player, performance metrics)?
4. How are players filtered/sorted?

**🛑 PAUSE FOR USER ANALYSIS**

### Step 5.2: Display Players (Read-Only)

**Goal**: Show players for selected team using AppData

**Add to AppData** (as needed):

- `getTeamPlayers(teamKey: string): Player[]` - Get all players for a team
- Player display formatting helper
- Any computed player statistics

**Update Player Stats Page**:

- Replace `usePlayerContext()` with `useAppData()`
- Wire up player display to use `appData.getTeamPlayers()`

**Test**:

1. Player Stats page loads
2. Players display for selected team
3. Player details show correctly

**🛑 PAUSE FOR USER TESTING**

### Step 5.3: Add Player Operations

**Goal**: Support add manual player, remove player, refresh

**Add to AppData** (as needed):

- Player loading/fetching methods
- Player removal with cleanup
- Player refresh logic

**Update Player Stats Page**:

- Wire up Add Manual Player button
- Wire up Remove Player button
- Wire up Refresh button

**Test**:

1. Can add manual player
2. Can remove player
3. Can refresh players
4. Data persists correctly

**🛑 PAUSE FOR USER TESTING**

---

## Phase 6: Cleanup and Optimization

### Step 6.1: Remove Old Contexts

**Goal**: Delete deprecated context files

**Files to remove:**

- `src/frontend/teams/contexts/` (all old team context files)
- `src/frontend/matches/contexts/` (all old match context files)
- `src/frontend/players/contexts/` (all old player context files)
- Old hook files in `src/hooks/` related to teams/matches/players

**Test**:

1. App still works without old contexts
2. No import errors
3. All pages functional

### Step 6.2: Final Testing

**Goal**: Comprehensive end-to-end testing

**Tests**:

1. All pages load correctly
2. All operations work (add, remove, edit, refresh)
3. Data persists across page refreshes
4. No console errors or warnings
5. Performance is acceptable
6. All lint and type checks pass

**✅ Migration Complete!**

---

## Testing Strategy

### After Each Step

1. **Load the page** - ensure it renders without errors
2. **Test operations** - add, remove, edit, refresh
3. **Check data persistence** - refresh page, verify data persists
4. **Check console** - no errors or warnings
5. **Run linter** - `pnpm lint` - fix any issues
6. **Run type-check** - `pnpm type-check` - fix any issues

### Specific Test Scenarios

**Dashboard:**

- Add team (9247354, league 18324)
- Remove team
- Edit team (change IDs)
- Refresh team
- Page reload (data persists)

**Match History:**

- View matches for selected team
- Add manual match
- Remove match
- Refresh matches
- Page reload (data persists)

**Player Stats:**

- View players for selected team
- Add manual player
- Remove player
- Refresh players
- Page reload (data persists)

---

## Rollback Plan

If any step causes issues:

1. **Immediate**: Revert the specific changes that caused the issue
2. **Investigation**: Identify the root cause
3. **Fix**: Implement a corrected version
4. **Testing**: Verify the fix works
5. **Continue**: Proceed with the next step

Each step is designed to be easily reversible - old contexts remain in place during migration.

---

## Key Principles

1. **YAGNI**: Only build what we need when we need it
2. **Small Steps**: Each step is small, testable, and reversible
3. **User Testing**: Pause after each functional change for testing
4. **Discover Requirements**: Let UI needs drive implementation
5. **No Speculation**: Don't guess what methods we'll need
6. **Run Tests**: After each change, run linter and type-check

---

## Success Criteria

The implementation is complete when:

1. ✅ **Single Data Store**: All data flows through `AppData` class
2. ✅ **Simple Contexts**: Components use single `useAppData()` hook
3. ✅ **Pre-computed Data**: Statistics calculated and stored, not computed in UI
4. ✅ **No Breaking Changes**: UI works exactly as before
5. ✅ **Code Quality**: Zero lint warnings, all tests pass
6. ✅ **Performance**: Equal or better performance than before
7. ✅ **Easy to Find**: Data management in centralized location
8. ✅ **No Circular Dependencies**: Clean, simple data flow

---

## Benefits of This Approach

- ✅ Faster initial progress
- ✅ Less waste (no unused code)
- ✅ Real requirements (not guessed)
- ✅ Incremental testing
- ✅ Easy to pivot if approach is wrong
- ✅ Smaller cognitive load per step
- ✅ Request deduplication prevents duplicate API calls
- ✅ Clean separation of concerns with helper files

---

# ✅ PHASE 7: FULL DATA MIGRATION - COMPLETED

**Status:** ✅ COMPLETED  
**Goal:** Move all data processing from old contexts into AppData, enabling full removal of Match/Player/Team contexts

## ✅ Migration Complete - Current State

### What AppData Now Handles:

- ✅ Team associations (which matches/players belong to which teams)
- ✅ Team CRUD operations (add, remove, edit, refresh)
- ✅ Manual match/player tracking per team
- ✅ League matches cache (match IDs by team)
- ✅ Data persistence to localStorage
- ✅ Active team selection state
- ✅ Reference data (heroes, items, leagues)
- ✅ **Full Match objects** with draft data, player stats, events
- ✅ **Full Player objects** with profile data and statistics
- ✅ **All data processing** and transformation
- ✅ **Match/Player/Team contexts deleted**

### ✅ Old Contexts Removed:

- ✅ **Match Context**: Deleted - all functionality moved to AppData
- ✅ **Player Context**: Deleted - all functionality moved to AppData
- ✅ **Team Context**: Deleted - all functionality moved to AppData
- ✅ **Constants Context**: Deleted - reference data moved to AppData

### ✅ Issues Fixed:

- ✅ Hero names/images now display correctly (consistent data structure)
- ✅ Single source of truth (no duplicate state management)
- ✅ Simplified data flow (AppData only)
- ✅ All tests updated to use AppData architecture

---

---

# PHASE 8: COMPUTED DATA MIGRATION

**Status:** ⏳ PENDING  
**Goal:** Extract all computed data calculations from UI components into AppData context for centralized logic and better performance

## Current State Analysis

After Phase 7 completion, we have a fully functional AppData architecture, but **computed data is still calculated on-demand in UI components**. This leads to:

- **Performance issues**: Complex calculations on every render
- **Code duplication**: Same calculations in multiple components
- **Maintenance burden**: Logic scattered across UI components
- **Inconsistent data**: Different components may calculate differently

## Identified Computed Data in UI Components

### 1. Player Statistics Calculations

**Location:** `src/frontend/players/components/stateless/details/PlayerDetailsPanelTeamView.tsx`

**Current calculations:**

- `computeAverages()` - KDA, GPM, XPM averages
- `computePlayerTeamStats()` - Win rate, total games, performance metrics
- `calculateKda()` - KDA ratio calculation
- `accumulateStats()` - Aggregating stats across matches

### 2. Hero Statistics Calculations

**Location:** `src/frontend/players/components/stateless/details/PlayerDetailsPanelDetails.tsx`

**Current calculations:**

- `buildHeroRows()` - Hero performance per player
- `filterMatchesByDateRange()` - Date-based filtering
- Hero win rates and game counts
- Match sorting and filtering

### 3. Match Summary Calculations

**Location:** `src/frontend/matches/components/summary/HeroSummaryTable.tsx`

**Current calculations:**

- `aggregateHeroes()` - Hero pick/ban statistics
- `aggregateBans()` - Ban frequency and win rates
- `getHeroPicksForSide()` - Team-specific hero data
- Win rate calculations per hero

### 4. Team Statistics Calculations

**Location:** Various team components

**Current calculations:**

- Team win rates and match counts
- Player performance within team context
- Team-specific hero statistics

## Migration Strategy

### Phase 8.1: Player Statistics Migration

**Goal:** Move all player-related calculations to AppData

### Phase 8.2: Match Statistics Migration

**Goal:** Move all match-related calculations to AppData

### Phase 8.3: Team Statistics Migration

**Goal:** Move all team-related calculations to AppData

### Phase 8.4: Filtering and Sorting Migration

**Goal:** Move all filtering/sorting logic to AppData

### Phase 8.5: Performance Optimization

**Goal:** Optimize computed data with caching and memoization

---

## Benefits After Phase 8 Completion

✅ **Centralized Logic** - All calculations in one place  
✅ **Better Performance** - Pre-computed data, no on-demand calculations  
✅ **Consistent Data** - Same calculations everywhere  
✅ **Easier Testing** - Test calculations independently  
✅ **Simpler UI** - Components just display pre-computed data  
✅ **Better Caching** - Computed data can be cached and invalidated  
✅ **Easier Debugging** - All logic in AppData context

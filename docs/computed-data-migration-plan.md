# Computed Data Migration Plan

## Overview

This document outlines the incremental migration of all computed data calculations from UI components into the AppData context. The goal is to centralize all logic, improve performance, and create a single source of truth for all derived data.

## Current State

After completing the old context migration (Phase 7), we have a fully functional AppData architecture, but **computed data is still calculated on-demand in UI components**. This leads to:

- **Performance issues**: Complex calculations on every render
- **Code duplication**: Same calculations in multiple components
- **Maintenance burden**: Logic scattered across UI components
- **Inconsistent data**: Different components may calculate differently

## Identified Computed Data

### 1. Player Statistics Calculations

**Files:** `PlayerDetailsPanelTeamView.tsx`, `PlayerDetailsPanelDetails.tsx`

**Current calculations:**

- `computeAverages()` - KDA, GPM, XPM averages across matches
- `computePlayerTeamStats()` - Win rate, total games, performance metrics
- `calculateKda()` - KDA ratio calculation
- `accumulateStats()` - Aggregating stats across matches
- `buildHeroRows()` - Hero performance per player
- `filterMatchesByDateRange()` - Date-based filtering
- Hero win rates and game counts
- Match sorting and filtering

### 2. Match Summary Calculations

**Files:** `HeroSummaryTable.tsx`, `MatchHistoryPageSections.tsx`

**Current calculations:**

- `aggregateHeroes()` - Hero pick/ban statistics
- `aggregateBans()` - Ban frequency and win rates
- `getHeroPicksForSide()` - Team-specific hero data
- Win rate calculations per hero
- Match filtering by various criteria

### 3. Team Statistics Calculations

**Files:** Various team components

**Current calculations:**

- Team win rates and match counts
- Player performance within team context
- Team-specific hero statistics

---

## Phase 8.1: Player Statistics Migration

**Goal:** Move all player-related calculations to AppData

### Step 8.1a: Create Player Statistics Calculator

**Create:** `src/frontend/lib/player-statistics-calculator.ts`

**Functions to implement:**

```typescript
/**
 * Calculate player performance statistics from matches
 */
export function calculatePlayerStats(
  playerId: number,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
): PlayerStats;

/**
 * Calculate hero-specific statistics for a player
 */
export function calculateHeroStats(
  playerId: number,
  matches: Match[],
  heroes: Map<number, Hero>,
): Map<number, HeroStats>;

/**
 * Calculate team-specific player statistics
 */
export function calculateTeamPlayerStats(
  playerId: number,
  teamKey: string,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
): TeamPlayerStats;

/**
 * Filter and sort player matches by date range
 */
export function filterPlayerMatches(
  matches: Match[],
  dateRange: DateRangeSelection,
  customRange?: { start: string | null; end: string | null },
): Match[];
```

**Implementation:**

1. Move `computeAverages()`, `computePlayerTeamStats()`, `calculateKda()` from UI
2. Move `buildHeroRows()` logic
3. Move `filterMatchesByDateRange()` logic
4. Add comprehensive type definitions

**⏸ PAUSE FOR USER TESTING:**

- Verify calculations match existing UI behavior
- Test with different date ranges and filters
- Check performance improvements

### Step 8.1b: Add Player Statistics to AppData

**Update:** `src/frontend/lib/app-data.ts`

**Add computed data properties:**

```typescript
export class AppData {
  // ... existing properties

  // Computed player statistics
  private playerStatsCache = new Map<number, PlayerStats>();
  private heroStatsCache = new Map<number, Map<number, HeroStats>>();
  private teamPlayerStatsCache = new Map<string, Map<number, TeamPlayerStats>>();

  /**
   * Get player statistics (cached)
   */
  getPlayerStats(playerId: number): PlayerStats;

  /**
   * Get hero statistics for a player (cached)
   */
  getPlayerHeroStats(playerId: number): Map<number, HeroStats>;

  /**
   * Get team-specific player statistics (cached)
   */
  getTeamPlayerStats(playerId: number, teamKey: string): TeamPlayerStats;

  /**
   * Invalidate player statistics cache
   */
  invalidatePlayerStats(playerId: number): void;

  /**
   * Recalculate all player statistics
   */
  recalculateAllPlayerStats(): void;
}
```

**Implementation:**

1. Add cache properties to AppData class
2. Implement getter methods with caching
3. Add invalidation methods
4. Update when matches/players change

**⏸ PAUSE FOR USER TESTING:**

- Verify statistics are calculated correctly
- Test cache invalidation works
- Check performance improvements

### Step 8.1c: Update Player UI Components

**Update:** `PlayerDetailsPanelTeamView.tsx`, `PlayerDetailsPanelDetails.tsx`

**Replace calculations with AppData calls:**

```typescript
// Before
const playerTeamStats = computePlayerTeamStats(selectedTeam, playerParticipatedMatches, accountId);
const teamStats = processPlayerDetailedStats(player, matchesArray, heroesData);

// After
const playerTeamStats = appData.getTeamPlayerStats(accountId, selectedTeam.key);
const teamStats = appData.getPlayerStats(accountId);
```

**Changes:**

1. Remove calculation functions from components
2. Replace with AppData method calls
3. Remove useMemo dependencies on calculations
4. Simplify component logic

**⏸ PAUSE FOR USER TESTING:**

- Verify player details display correctly
- Test team view statistics
- Check performance improvements
- Ensure data updates when matches change

---

## Phase 8.2: Match Statistics Migration

**Goal:** Move all match-related calculations to AppData

### Step 8.2a: Create Match Statistics Calculator

**Create:** `src/frontend/lib/match-statistics-calculator.ts`

**Functions to implement:**

```typescript
/**
 * Calculate hero pick/ban statistics for matches
 */
export function calculateHeroSummary(
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  isActiveTeam: boolean,
  heroes: Map<number, Hero>,
): HeroSummary[];

/**
 * Calculate ban statistics for matches
 */
export function calculateBanSummary(
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  isActiveTeam: boolean,
  heroes: Map<number, Hero>,
): HeroSummary[];

/**
 * Filter matches by various criteria
 */
export function filterMatches(
  matches: Match[],
  filters: MatchFilters,
  teamMatches: Map<number, TeamMatchParticipation>,
): Match[];

/**
 * Sort matches by various criteria
 */
export function sortMatches(matches: Match[], sortField: string, sortDirection: 'asc' | 'desc'): Match[];
```

**Implementation:**

1. Move `aggregateHeroes()`, `aggregateBans()` from UI
2. Move `getHeroPicksForSide()` logic
3. Move match filtering logic
4. Add comprehensive type definitions

**⏸ PAUSE FOR USER TESTING:**

- Verify calculations match existing UI behavior
- Test with different filters and sorting
- Check performance improvements

### Step 8.2b: Add Match Statistics to AppData

**Update:** `src/frontend/lib/app-data.ts`

**Add computed data properties:**

```typescript
export class AppData {
  // ... existing properties

  // Computed match statistics
  private heroSummaryCache = new Map<string, HeroSummary[]>();
  private banSummaryCache = new Map<string, HeroSummary[]>();
  private filteredMatchesCache = new Map<string, Match[]>();

  /**
   * Get hero summary for team matches (cached)
   */
  getHeroSummary(teamKey: string, isActiveTeam: boolean): HeroSummary[];

  /**
   * Get ban summary for team matches (cached)
   */
  getBanSummary(teamKey: string, isActiveTeam: boolean): HeroSummary[];

  /**
   * Get filtered matches for team (cached)
   */
  getFilteredMatches(teamKey: string, filters: MatchFilters): Match[];

  /**
   * Invalidate match statistics cache
   */
  invalidateMatchStats(teamKey: string): void;
}
```

**Implementation:**

1. Add cache properties to AppData class
2. Implement getter methods with caching
3. Add invalidation methods
4. Update when matches change

**⏸ PAUSE FOR USER TESTING:**

- Verify statistics are calculated correctly
- Test cache invalidation works
- Check performance improvements

### Step 8.2c: Update Match UI Components

**Update:** `HeroSummaryTable.tsx`, `MatchHistoryPageSections.tsx`

**Replace calculations with AppData calls:**

```typescript
// Before
const heroSummary = aggregateHeroes(matches, teamMatches, isActiveTeam, heroes);
const filteredMatches = filterMatches(matches, filters, teamMatches);

// After
const heroSummary = appData.getHeroSummary(teamKey, isActiveTeam);
const filteredMatches = appData.getFilteredMatches(teamKey, filters);
```

**Changes:**

1. Remove calculation functions from components
2. Replace with AppData method calls
3. Remove useMemo dependencies on calculations
4. Simplify component logic

**⏸ PAUSE FOR USER TESTING:**

- Verify match history displays correctly
- Test hero summary table
- Check filtering and sorting work
- Ensure data updates when matches change

---

## Phase 8.3: Team Statistics Migration

**Goal:** Move all team-related calculations to AppData

### Step 8.3a: Create Team Statistics Calculator

**Create:** `src/frontend/lib/team-statistics-calculator.ts`

**Functions to implement:**

```typescript
/**
 * Calculate team performance statistics
 */
export function calculateTeamStats(
  team: Team,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
): TeamStats;

/**
 * Calculate team win rate and match count
 */
export function calculateTeamWinRate(
  team: Team,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
): { winRate: number; totalMatches: number; wins: number };

/**
 * Calculate team hero statistics
 */
export function calculateTeamHeroStats(
  team: Team,
  matches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  heroes: Map<number, Hero>,
): Map<number, HeroStats>;
```

**Implementation:**

1. Move team calculation logic from UI components
2. Add comprehensive type definitions
3. Handle team-specific filtering

**⏸ PAUSE FOR USER TESTING:**

- Verify calculations match existing UI behavior
- Test with different teams
- Check performance improvements

### Step 8.3b: Add Team Statistics to AppData

**Update:** `src/frontend/lib/app-data.ts`

**Add computed data properties:**

```typescript
export class AppData {
  // ... existing properties

  // Computed team statistics
  private teamStatsCache = new Map<string, TeamStats>();
  private teamWinRateCache = new Map<string, { winRate: number; totalMatches: number; wins: number }>();

  /**
   * Get team statistics (cached)
   */
  getTeamStats(teamKey: string): TeamStats;

  /**
   * Get team win rate (cached)
   */
  getTeamWinRate(teamKey: string): { winRate: number; totalMatches: number; wins: number };

  /**
   * Invalidate team statistics cache
   */
  invalidateTeamStats(teamKey: string): void;
}
```

**Implementation:**

1. Add cache properties to AppData class
2. Implement getter methods with caching
3. Add invalidation methods
4. Update when matches change

**⏸ PAUSE FOR USER TESTING:**

- Verify statistics are calculated correctly
- Test cache invalidation works
- Check performance improvements

### Step 8.3c: Update Team UI Components

**Update:** Team-related components

**Replace calculations with AppData calls:**

```typescript
// Before
const teamStats = calculateTeamStats(team, matches, teamMatches);
const winRate = calculateTeamWinRate(team, matches, teamMatches);

// After
const teamStats = appData.getTeamStats(team.key);
const winRate = appData.getTeamWinRate(team.key);
```

**Changes:**

1. Remove calculation functions from components
2. Replace with AppData method calls
3. Remove useMemo dependencies on calculations
4. Simplify component logic

**⏸ PAUSE FOR USER TESTING:**

- Verify team cards display correctly
- Test team statistics
- Check performance improvements
- Ensure data updates when matches change

---

## Phase 8.4: Filtering and Sorting Migration

**Goal:** Move all filtering/sorting logic to AppData

### Step 8.4a: Create Filtering and Sorting Calculator

**Create:** `src/frontend/lib/filtering-calculator.ts`

**Functions to implement:**

```typescript
/**
 * Filter matches by date range
 */
export function filterByDateRange(
  matches: Match[],
  dateRange: DateRangeSelection,
  customRange?: { start: string | null; end: string | null },
): Match[];

/**
 * Filter matches by result
 */
export function filterByResult(
  matches: Match[],
  result: 'all' | 'won' | 'lost',
  teamMatches: Map<number, TeamMatchParticipation>,
): Match[];

/**
 * Filter matches by team side
 */
export function filterBySide(
  matches: Match[],
  side: 'all' | 'radiant' | 'dire',
  teamMatches: Map<number, TeamMatchParticipation>,
): Match[];

/**
 * Filter matches by heroes played
 */
export function filterByHeroes(
  matches: Match[],
  heroIds: number[],
  teamMatches: Map<number, TeamMatchParticipation>,
): Match[];

/**
 * Sort matches by various criteria
 */
export function sortMatches(matches: Match[], sortField: string, sortDirection: 'asc' | 'desc'): Match[];
```

**Implementation:**

1. Move all filtering logic from UI components
2. Move all sorting logic from UI components
3. Add comprehensive type definitions
4. Handle complex filter combinations

**⏸ PAUSE FOR USER TESTING:**

- Verify filtering works correctly
- Test sorting functionality
- Check performance improvements

### Step 8.4b: Add Filtering to AppData

**Update:** `src/frontend/lib/app-data.ts`

**Add computed data properties:**

```typescript
export class AppData {
  // ... existing properties

  // Computed filtering results
  private filteredMatchesCache = new Map<string, Match[]>();
  private sortedMatchesCache = new Map<string, Match[]>();

  /**
   * Get filtered matches for team (cached)
   */
  getFilteredMatches(teamKey: string, filters: MatchFilters): Match[];

  /**
   * Get sorted matches for team (cached)
   */
  getSortedMatches(teamKey: string, sortField: string, sortDirection: 'asc' | 'desc'): Match[];

  /**
   * Invalidate filtering cache
   */
  invalidateFilteringCache(teamKey: string): void;
}
```

**Implementation:**

1. Add cache properties to AppData class
2. Implement getter methods with caching
3. Add invalidation methods
4. Update when matches change

**⏸ PAUSE FOR USER TESTING:**

- Verify filtering works correctly
- Test sorting functionality
- Check performance improvements

### Step 8.4c: Update Filtering UI Components

**Update:** All components with filtering/sorting

**Replace calculations with AppData calls:**

```typescript
// Before
const filteredMatches = filterMatches(matches, filters, teamMatches);
const sortedMatches = sortMatches(filteredMatches, sortField, sortDirection);

// After
const filteredMatches = appData.getFilteredMatches(teamKey, filters);
const sortedMatches = appData.getSortedMatches(teamKey, sortField, sortDirection);
```

**Changes:**

1. Remove filtering/sorting functions from components
2. Replace with AppData method calls
3. Remove useMemo dependencies on calculations
4. Simplify component logic

**⏸ PAUSE FOR USER TESTING:**

- Verify all filtering works correctly
- Test all sorting functionality
- Check performance improvements
- Ensure data updates when filters change

---

## Phase 8.5: Performance Optimization

**Goal:** Optimize computed data with caching and memoization

### Step 8.5a: Implement Smart Caching

**Update:** All calculator files

**Add intelligent caching:**

```typescript
/**
 * Cache with dependency tracking
 */
class ComputedDataCache<T> {
  private cache = new Map<string, T>();
  private dependencies = new Map<string, Set<string>>();

  get(key: string, dependencies: string[]): T | undefined;
  set(key: string, value: T, dependencies: string[]): void;
  invalidate(dependency: string): void;
  clear(): void;
}
```

**Implementation:**

1. Add dependency tracking to all caches
2. Implement smart invalidation
3. Add cache size limits
4. Add cache hit/miss metrics

**⏸ PAUSE FOR USER TESTING:**

- Verify caching works correctly
- Test invalidation triggers
- Check memory usage
- Monitor performance improvements

### Step 8.5b: Add Background Calculation

**Update:** `src/frontend/lib/app-data.ts`

**Add background processing:**

```typescript
export class AppData {
  // ... existing properties

  private calculationQueue = new Set<string>();
  private isCalculating = false;

  /**
   * Queue calculation for background processing
   */
  private queueCalculation(calculation: string): void;

  /**
   * Process calculation queue in background
   */
  private processCalculationQueue(): void;

  /**
   * Pre-calculate all statistics
   */
  preCalculateAllStats(): void;
}
```

**Implementation:**

1. Add calculation queue system
2. Implement background processing
3. Add pre-calculation for common data
4. Add progress tracking

**⏸ PAUSE FOR USER TESTING:**

- Verify background calculation works
- Test pre-calculation
- Check performance improvements
- Monitor memory usage

### Step 8.5c: Add Performance Monitoring

**Create:** `src/frontend/lib/performance-monitor.ts`

**Add performance tracking:**

```typescript
/**
 * Monitor computation performance
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(operation: string): void;
  endTiming(operation: string): void;
  getAverageTime(operation: string): number;
  getMetrics(): Record<string, number>;
  reset(): void;
}
```

**Implementation:**

1. Add timing to all calculations
2. Track cache hit/miss rates
3. Monitor memory usage
4. Add performance alerts

**⏸ PAUSE FOR USER TESTING:**

- Verify monitoring works
- Check performance metrics
- Test with large datasets
- Optimize based on metrics

---

## Success Criteria

✅ **All calculations moved to AppData** - No calculations in UI components  
✅ **Centralized logic** - All logic in one place  
✅ **Better performance** - Pre-computed data, no on-demand calculations  
✅ **Consistent data** - Same calculations everywhere  
✅ **Easier testing** - Test calculations independently  
✅ **Simpler UI** - Components just display pre-computed data  
✅ **Better caching** - Computed data cached and invalidated properly  
✅ **Easier debugging** - All logic in AppData context  
✅ **Performance monitoring** - Track and optimize performance  
✅ **Memory efficient** - Smart caching with size limits

---

## Testing Strategy

### After Each Step

1. **Load the page** - ensure it renders without errors
2. **Test calculations** - verify data matches previous behavior
3. **Test performance** - check for improvements
4. **Test caching** - verify cache invalidation works
5. **Check console** - no errors or warnings
6. **Run linter** - `pnpm lint` - fix any issues
7. **Run type-check** - `pnpm type-check` - fix any issues

### Specific Test Scenarios

**Player Statistics:**

- View player details panel
- Test team view statistics
- Verify hero statistics
- Test date range filtering

**Match Statistics:**

- View match history
- Test hero summary table
- Verify filtering works
- Test sorting functionality

**Team Statistics:**

- View team cards
- Test team statistics
- Verify win rates
- Test match counts

**Performance:**

- Test with large datasets
- Monitor memory usage
- Check calculation times
- Verify cache efficiency

---

## Rollback Plan

If any step causes issues:

1. **Immediate**: Revert the specific changes that caused the issue
2. **Investigation**: Identify the root cause
3. **Fix**: Implement a corrected version
4. **Testing**: Verify the fix works
5. **Continue**: Proceed with the next step

Each step is designed to be easily reversible - old calculation logic remains in place during migration.

---

## Estimated Effort

**Phase 8.1 (Player Statistics):** 2-3 sessions  
**Phase 8.2 (Match Statistics):** 2-3 sessions  
**Phase 8.3 (Team Statistics):** 1-2 sessions  
**Phase 8.4 (Filtering/Sorting):** 2-3 sessions  
**Phase 8.5 (Performance Optimization):** 2-3 sessions

**Total:** ~9-14 sessions

---

## Benefits After Phase 8 Completion

✅ **Centralized Logic** - All calculations in one place  
✅ **Better Performance** - Pre-computed data, no on-demand calculations  
✅ **Consistent Data** - Same calculations everywhere  
✅ **Easier Testing** - Test calculations independently  
✅ **Simpler UI** - Components just display pre-computed data  
✅ **Better Caching** - Computed data cached and invalidated properly  
✅ **Easier Debugging** - All logic in AppData context  
✅ **Performance Monitoring** - Track and optimize performance  
✅ **Memory Efficient** - Smart caching with size limits  
✅ **Maintainable** - Single place to update calculation logic

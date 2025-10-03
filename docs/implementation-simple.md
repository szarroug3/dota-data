# Implementation Plan: Simple Data Store Architecture

## Current State Analysis

Based on the codebase analysis, here's what's currently implemented:

### ✅ **Already Implemented**

- **Backend API Routes**: Complete with validation, caching, and error handling
- **Supporting Contexts**: Theme, Config, Share, Constants, ConstantsDataFetching
- **Individual Entity Contexts**: Separate Team, Match, Player contexts with their own state management
- **Frontend Components**: All major UI components for teams, matches, and players
- **API Client Layer**: Complete with validation and error handling
- **Caching System**: Redis and memory backends with TTL management

### ❌ **Current Problems**

- **Complex Interdependencies**: 20+ hook files with circular dependencies
- **Hard to Find Things**: State management spread across many files
- **Circular Dependencies**: Team context depends on Match/Player contexts, which depend back on Team
- **Over-Engineering**: Complex state management for relatively simple data

## New Architecture: Simple Data Store

### **Core Principle**

- **Single Data Store**: All data in one place (`AppData` class)
- **Simple Contexts**: Just wrap the store, no complex state management
- **Computed Data**: Pre-calculated and stored, not computed in UI
- **Easy to Find**: Everything in 3 files total

### **File Structure**

```
src/
  lib/
    app-data.ts          // Single file with AppData class
  contexts/
    app-data-context.tsx // Single context file
  hooks/
    use-app-data.ts      // Single hook file
```

## Implementation Phases

### **Phase 1: Fix Mock Data Paths (30 minutes)**

#### Step 1.1: Verify Mock Data Structure

- **Purpose**: Ensure all mock data files are in the correct locations
- **Check**:
  - `mock-data/cached-data/` - Redis cache mock files
  - `mock-data/external-data/` - External API mock files
  - `mock-data/external-data/heroes.json` - Hero data
  - `mock-data/external-data/items.json` - Item data
  - `mock-data/external-data/leagues/` - League data
  - `mock-data/external-data/matches/` - Match data
  - `mock-data/external-data/players/` - Player data
  - `mock-data/external-data/teams/` - Team data
  - `mock-data/external-data/share/` - Share data

#### Step 1.2: Update Mock Data References

- **Files to check**:
  - `src/lib/api/opendota/heroes.ts` - Should reference `mock-data/external-data/heroes.json`
  - `src/lib/api/opendota/items.ts` - Should reference `mock-data/external-data/items.json`
  - `src/lib/cache-backends/file.ts` - Should reference `mock-data/cached-data`
  - `src/app/api/share/route.ts` - Should reference `mock-data/external-data/share`
  - `src/app/api/share/[key]/route.ts` - Should reference `mock-data/external-data/share`

#### Step 1.3: Test Mock Data Loading

- **Purpose**: Ensure all mock data loads correctly
- **Test**: Run the app and verify no mock data errors
- **Expected**: All API calls should work with mock data

### **Phase 2: Create Simple Data Store (1-2 hours)**

#### Step 2.1: Create AppData Class

- **File**: `src/lib/app-data.ts`
- **Purpose**: Single source of truth for all data
- **Content**:
  - Core data maps (teams, matches, players)
  - Computed data maps (playerHeroStats, teamMatchIds, etc.)
  - Simple CRUD operations
  - Data loading from APIs
  - Data persistence to localStorage

#### Step 2.2: Create AppData Context

- **File**: `src/contexts/app-data-context.tsx`
- **Purpose**: React context wrapper around AppData
- **Content**:
  - Provider component
  - Context creation
  - Error handling

#### Step 2.3: Create useAppData Hook

- **File**: `src/hooks/use-app-data.ts`
- **Purpose**: Simple hook to access AppData
- **Content**:
  - Context consumption
  - Error handling
  - Type safety

### **Phase 3: Migrate Dashboard Page (2-3 hours)**

#### Step 3.1: Update Dashboard Components

- **Files**: `src/frontend/teams/components/containers/DashboardPageContainer.tsx`
- **Changes**:
  - Replace `useTeamContext()` with `useAppData()`
  - Update data access patterns
  - Test team operations (add, remove, edit, refresh)

#### Step 3.2: Update Team Components

- **Files**: `src/frontend/teams/components/stateless/*.tsx`
- **Changes**:
  - Replace team context usage with AppData
  - Update prop interfaces
  - Test all team operations

#### Step 3.3: Remove Team Context Dependencies

- **Files**: `src/frontend/teams/contexts/*.tsx`
- **Changes**:
  - Keep files but mark as deprecated
  - Add migration comments
  - Test that dashboard still works

### **Phase 4: Migrate Match History Page (3-4 hours)**

#### Step 4.1: Update Match History Components

- **Files**: `src/frontend/matches/components/containers/MatchHistoryPageContainer.tsx`
- **Changes**:
  - Replace `useMatchContext()` with `useAppData()`
  - Update data access patterns
  - Test match operations (add, remove, refresh)

#### Step 4.2: Update Match Components

- **Files**: `src/frontend/matches/components/stateless/*.tsx`
- **Changes**:
  - Replace match context usage with AppData
  - Update prop interfaces
  - Test all match operations

#### Step 4.3: Remove Match Context Dependencies

- **Files**: `src/frontend/matches/contexts/*.tsx`
- **Changes**:
  - Keep files but mark as deprecated
  - Add migration comments
  - Test that match history still works

### **Phase 5: Migrate Player Stats Page (3-4 hours)**

#### Step 5.1: Update Player Stats Components

- **Files**: `src/frontend/players/components/containers/PlayerStatsPageContainer.tsx`
- **Changes**:
  - Replace `usePlayerContext()` with `useAppData()`
  - Update data access patterns
  - Test player operations (add, remove, refresh)

#### Step 5.2: Update Player Components

- **Files**: `src/frontend/players/components/stateless/*.tsx`
- **Changes**:
  - Replace player context usage with AppData
  - Update prop interfaces
  - Test all player operations

#### Step 5.3: Remove Player Context Dependencies

- **Files**: `src/frontend/players/contexts/*.tsx`
- **Changes**:
  - Keep files but mark as deprecated
  - Add migration comments
  - Test that player stats still works

### **Phase 6: Cleanup and Optimization (1-2 hours)**

#### Step 6.1: Remove Old Contexts

- **Files**: All old context files
- **Changes**:
  - Delete deprecated context files
  - Remove unused imports
  - Clean up dependencies

#### Step 6.2: Remove Old Hooks

- **Files**: All old hook files
- **Changes**:
  - Delete deprecated hook files
  - Remove unused imports
  - Clean up dependencies

#### Step 6.3: Final Testing

- **Purpose**: Ensure everything works
- **Tests**:
  - All pages load correctly
  - All operations work (add, remove, edit, refresh)
  - Data persists across page refreshes
  - No console errors

## Key Benefits of This Approach

### **Simplicity**

- **3 files total** instead of 20+
- **Single source of truth** for all data
- **No circular dependencies**
- **Easy to find things**

### **Performance**

- **Pre-computed data** (no UI calculations)
- **Efficient updates** (only update what changed)
- **Simple subscriptions** (just context updates)

### **Maintainability**

- **Easy to debug** (one place to look)
- **Easy to test** (simple class methods)
- **Easy to extend** (add new data types easily)

### **Migration Safety**

- **Keep existing code** during migration
- **Migrate one page at a time**
- **Easy to rollback** if issues arise
- **Test after each step**

## Data Structure

### **Core Data**

```typescript
class AppData {
  // Core entities
  teams = new Map<string, Team>();
  matches = new Map<number, Match>();
  players = new Map<number, Player>();

  // UI state
  selectedTeamId: string | null = null;
  selectedMatchId: number | null = null;
  selectedPlayerId: number | null = null;
}
```

### **Computed Data**

```typescript
class AppData {
  // Team relationships
  teamMatchIds = new Map<string, number[]>(); // teamId -> matchIds
  teamPlayerIds = new Map<string, number[]>(); // teamId -> playerIds

  // Player statistics
  playerHeroStats = new Map<number, Map<string, number>>(); // playerId -> heroId -> count
  playerMatchIds = new Map<number, number[]>(); // playerId -> matchIds

  // Match relationships
  matchTeamId = new Map<number, string>(); // matchId -> teamId
}
```

## Testing Strategy

### **After Each Step**

1. **Load the page** - ensure it renders
2. **Test operations** - add, remove, edit, refresh
3. **Check data persistence** - refresh page, data should persist
4. **Check console** - no errors or warnings

### **Rollback Plan**

- **Keep old contexts** until migration is complete
- **Use feature flags** to switch between old and new
- **Easy to revert** by changing imports

## Timeline

- **Phase 1**: 30 minutes (Fix mock data paths)
- **Phase 2**: 1-2 hours (Data store setup)
- **Phase 3**: 2-3 hours (Dashboard migration)
- **Phase 4**: 3-4 hours (Match history migration)
- **Phase 5**: 3-4 hours (Player stats migration)
- **Phase 6**: 1-2 hours (Cleanup)

**Total**: 10-15 hours over 1-2 weeks

## Testing Strategy

### **After Each Step**

1. **Load the page** - ensure it renders
2. **Test operations** - add, remove, edit, refresh
3. **Check data persistence** - refresh page, data should persist
4. **Check console** - no errors or warnings

### **Comprehensive Testing**

1. Test team addition, removal, and editing
2. Test match addition, removal, and viewing
3. Test player addition, removal, and viewing
4. Test data persistence and hydration
5. Test error handling and loading states
6. Test all UI interactions and navigation

### **Performance Testing**

1. Test with large datasets
2. Test memory usage
3. Test rendering performance
4. Test data fetching performance

### **Code Quality Validation**

1. Run linting: `pnpm lint`
2. Run type checking: `pnpm type-check`
3. Run tests: `pnpm test`
4. Check for any warnings or errors

## Rollback Plan

If any step causes issues:

1. **Immediate**: Revert the specific step that caused the issue
2. **Investigation**: Identify the root cause
3. **Fix**: Implement a corrected version
4. **Testing**: Verify the fix works
5. **Continue**: Proceed with the next step

Each step is designed to be easily reversible, and the app should continue working throughout the migration process.

## Success Criteria

The implementation is complete when:

1. ✅ **Single Data Store**: All data flows through `AppData` class
2. ✅ **Simple Contexts**: Components use single `useAppData()` hook
3. ✅ **Pre-computed Data**: Statistics calculated and stored, not computed in UI
4. ✅ **No Breaking Changes**: UI works exactly as before
5. ✅ **Code Quality**: Zero lint warnings, all tests pass
6. ✅ **Performance**: Equal or better performance than before
7. ✅ **Easy to Find**: Everything in 3 files total
8. ✅ **No Circular Dependencies**: Clean, simple data flow

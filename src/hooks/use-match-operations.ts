import { useCallback } from 'react';

import type { MatchDataFetchingContextValue } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import type { Match, MatchProcessing, MatchState } from '@/types/contexts/match-context-value';
import { createInitialMatchData, updateMatchError } from '@/utils/match-helpers';

// ============================================================================
// OPERATION TRACKING
// ============================================================================

/**
 * Track ongoing operations per match ID
 */
const ongoingMatchOperations = new Map<number, AbortController>();

/**
 * Get or create abort controller for a match operation
 */
function getMatchAbortController(matchId: number): AbortController {
  // Abort any existing operation for this match
  const existingController = ongoingMatchOperations.get(matchId);
  if (existingController) {
    existingController.abort();
  }
  
  // Create new abort controller
  const controller = new AbortController();
  ongoingMatchOperations.set(matchId, controller);
  return controller;
}

/**
 * Clean up abort controller for a match
 */
function cleanupMatchAbortController(matchId: number): void {
  const controller = ongoingMatchOperations.get(matchId);
  if (controller) {
    controller.abort();
    ongoingMatchOperations.delete(matchId);
  }
}

/**
 * Check if a match has ongoing operations
 */
function hasOngoingMatchOperation(matchId: number): boolean {
  return ongoingMatchOperations.has(matchId);
}

// ============================================================================
// HELPER FUNCTIONS FOR MATCH OPERATIONS
// ============================================================================

/**
 * Check if operation was aborted and handle silently
 */
function handleMatchAbortCheck(abortController: AbortController, fallbackMatch: Match | null): Match | null {
  if (abortController.signal.aborted) {
    // Silently handle abort - this is expected when operations are replaced
    return fallbackMatch;
  }
  return null;
}

/**
 * Handle error vs abort distinction for match operations
 */
function handleMatchOperationError(
  error: Error | string | object,
  abortController: AbortController,
  matchId: number,
  state: MatchState
): Match | null {
  // Only handle actual errors, not aborts
  if (!abortController.signal.aborted) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process match';
    updateMatchError(matchId, errorMessage, state);
  }
  // Return optimistic match for aborted operations
  return state.matches.get(matchId) || null;
}

/**
 * Create and add optimistic match to state
 */
function createAndAddOptimisticMatch(matchId: number, state: MatchState): Match {
  const optimisticMatch = createInitialMatchData(matchId);
  
  state.setMatches(prev => {
    const newMatches = new Map(prev);
    newMatches.set(matchId, optimisticMatch);
    return newMatches;
  });
  
  return optimisticMatch;
}

/**
 * Update state with processed match data
 */
function updateStateWithProcessedMatch(matchId: number, processedMatch: Match, state: MatchState): void {
  state.setMatches(prev => {
    const newMatches = new Map(prev);
    newMatches.set(matchId, processedMatch);
    return newMatches;
  });
}

/**
 * Fetch and process match data
 */
async function fetchAndProcessMatch(
  matchId: number,
  force: boolean,
  abortController: AbortController,
  optimisticMatch: Match,
  matchDataFetching: MatchDataFetchingContextValue,
  processing: MatchProcessing,
  state: MatchState
): Promise<Match | null> {
  // Fetch match data with force parameter
  const matchData = await matchDataFetching.fetchMatchData(matchId, force);
  
  // Check if operation was aborted during fetch
  const fetchAbortResult = handleMatchAbortCheck(abortController, optimisticMatch);
  if (fetchAbortResult) return fetchAbortResult;
  
  if ('error' in matchData) {
    updateMatchError(matchId, matchData.error, state);
    return null;
  }
  
  // Process match data
  const processedMatch = processing.processMatchData(matchData);
  
  // Update state with fetched data
  updateStateWithProcessedMatch(matchId, processedMatch, state);
  
  return processedMatch;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useMatchOperations(
  state: MatchState,
  processing: MatchProcessing,
  matchDataFetching: MatchDataFetchingContextValue
) {
  // Consolidated match operation with force parameter
  const processMatch = useCallback(async (matchId: number, force = false): Promise<Match | null> => {
    // Check if match already exists (skip if exists and not forcing)
    if (!force && state.matches.has(matchId)) {
      return state.matches.get(matchId) || null;
    }

    // Check if there's already an ongoing operation for this match
    if (hasOngoingMatchOperation(matchId)) {
      return state.matches.get(matchId) || null;
    }

    // Get abort controller for this operation
    const abortController = getMatchAbortController(matchId);

    try {
      state.setIsLoading(true);
      
      // Create optimistic match data and add to state
      const optimisticMatch = createAndAddOptimisticMatch(matchId, state);

      // Check if operation was aborted
      const abortResult = handleMatchAbortCheck(abortController, optimisticMatch);
      if (abortResult) {
        return abortResult;
      }
      
      // Fetch and process match data
      const result = await fetchAndProcessMatch(
        matchId,
        force,
        abortController,
        optimisticMatch,
        matchDataFetching,
        processing,
        state
      );
      
      // If the fetch failed (result is null), return the optimistic match instead
      if (result === null) {
        return optimisticMatch;
      }
      
      return result;
      
    } catch (err) {
      return handleMatchOperationError(err as Error | string | object, abortController, matchId, state);
    } finally {
      state.setIsLoading(false);
      // Clean up abort controller
      cleanupMatchAbortController(matchId);
    }
  }, [state, processing, matchDataFetching]);

  // Add match (force = false)
  const addMatch = useCallback(async (matchId: number): Promise<Match | null> => {
    return await processMatch(matchId, false);
  }, [processMatch]);

  // Refresh match (force = true)
  const refreshMatch = useCallback(async (matchId: number): Promise<Match | null> => {
    return await processMatch(matchId, true);
  }, [processMatch]);

  // Parse match
  const parseMatch = useCallback(async (matchId: number) => {
    // Check if there's already an ongoing operation for this match
    if (hasOngoingMatchOperation(matchId)) {
      return;
    }

    // Get abort controller for this operation
    const abortController = getMatchAbortController(matchId);

    try {
      state.setIsLoading(true);
      
      // Check if operation was aborted
      if (handleMatchAbortCheck(abortController, null)) {
        // Silently handle abort - this is expected when operations are replaced
        return;
      }
      
      // Parse match data - for now, just refresh the match
      const matchData = await matchDataFetching.fetchMatchData(matchId, true);
      
      // Check if operation was aborted during fetch
      if (handleMatchAbortCheck(abortController, null)) {
        // Silently handle abort - this is expected when operations are replaced
        return;
      }
      
      if ('error' in matchData) {
        updateMatchError(matchId, matchData.error, state);
        return;
      }
      
      // Process match data
      const processedMatch = processing.processMatchData(matchData);
      
      // Update state
      updateStateWithProcessedMatch(matchId, processedMatch, state);
      
    } catch (err) {
      // Only handle actual errors, not aborts
      if (!handleMatchAbortCheck(abortController, null)) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse match';
        updateMatchError(matchId, errorMessage, state);
      }
      // Silently handle abort - no need to throw or update error state
    } finally {
      state.setIsLoading(false);
      // Clean up abort controller
      cleanupMatchAbortController(matchId);
    }
  }, [state, processing, matchDataFetching]);

  // Remove match
  const removeMatch = useCallback((matchId: number) => {
    // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this match
    cleanupMatchAbortController(matchId);
    
    state.setMatches(prev => {
      const newMatches = new Map(prev);
      newMatches.delete(matchId);
      return newMatches;
    });
    
    // Clear selected match if it was the removed match
    if (state.selectedMatchId === matchId) {
      state.setSelectedMatchId(null);
    }
  }, [state]);

  // Select match
  const selectMatch = useCallback((matchId: number) => {
    state.setSelectedMatchId(matchId);
  }, [state]);

  return {
    addMatch,
    refreshMatch,
    parseMatch,
    removeMatch,
    selectMatch
  };
} 
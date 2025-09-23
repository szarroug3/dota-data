import { useCallback } from 'react';

import {
  useOptimisticOperations,
  type OptimisticOperationState,
  type OptimisticOperationConfig,
} from '@/frontend/lib/optimistic-operations';
import type { MatchDataFetchingContextValue } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import type { AbortControllerManager } from '@/hooks/use-abort-controller';
import type { Match, MatchProcessing, MatchState } from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';
import { createInitialMatchData } from '@/utils/match-helpers';

// ============================================================================
// HELPER FUNCTIONS FOR MATCH OPERATIONS
// ============================================================================

/**
 * Create operation key for match operations
 */
function createMatchOperationKey(matchId: number): string {
  return `match-${matchId}`;
}

/**
 * Abort ongoing match operations
 */
function abortMatchOperations(abortController: AbortControllerManager, matchId: number): void {
  // Use the abortOperationsByPrefix method from AbortControllerManager
  abortController.abortOperationsByPrefix(createMatchOperationKey(matchId));
}

/**
 * Check if match data has changed (for optimization)
 */
function hasMatchDataChanged(existing: Match, processed: Match): boolean {
  // For matches, we'll do a simple comparison - can be enhanced if needed
  return JSON.stringify(existing) !== JSON.stringify(processed);
}

export function useMatchOperations(
  state: MatchState,
  processing: MatchProcessing,
  matchDataFetching: MatchDataFetchingContextValue,
) {
  // Convert MatchState to OptimisticOperationState
  const optimisticState: OptimisticOperationState<Match> = {
    items: state.matches,
    setItems: state.setMatches,
    selectedId: state.selectedMatchId,
    setSelectedId: state.setSelectedMatchId,
    setIsLoading: state.setIsLoading,
  };

  // Create configuration for match operations
  const config: OptimisticOperationConfig<Match, OpenDotaMatch> = {
    createInitialData: createInitialMatchData,
    processData: processing.processMatchData,
    fetchData: matchDataFetching.fetchMatchData,
    createOperationKey: createMatchOperationKey,
    abortOperations: abortMatchOperations,
    hasDataChanged: hasMatchDataChanged,
  };

  // Use the generic optimistic operations hook
  const { addItem, refreshItem, removeItem } = useOptimisticOperations(optimisticState, config);

  // Additional match-specific operations
  const selectMatch = useCallback(
    (matchId: number) => {
      state.setSelectedMatchId(matchId);
    },
    [state],
  );

  const parseMatch = useCallback(
    async (matchId: number) => {
      // Parse match is essentially a refresh with force=true
      await refreshItem(matchId);
    },
    [refreshItem],
  );

  return {
    addMatch: addItem,
    refreshMatch: refreshItem,
    parseMatch,
    removeMatch: removeItem,
    selectMatch,
  };
}

import {
  useOptimisticOperations,
  type OptimisticOperationState,
  type OptimisticOperationConfig,
} from '@/frontend/lib/optimistic-operations';
import type { PlayerDataFetchingContextValue } from '@/frontend/players/contexts/fetching/player-data-fetching-context';
import { createPlayerOperationKey, type AbortControllerManager } from '@/hooks/use-abort-controller';
import type { Player, PlayerProcessing, PlayerState } from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';
import { createInitialPlayerData } from '@/utils/player-helpers';

// ============================================================================
// HELPER FUNCTIONS FOR PLAYER OPERATIONS
// ============================================================================

/**
 * Check if player data has changed (for optimization)
 */
function hasPlayerDataChanged(existing: Player, processed: Player): boolean {
  // Compare only the relevant fields to avoid unnecessary updates
  return (
    existing.profile.profile.personaname !== processed.profile.profile.personaname ||
    existing.profile.rank_tier !== processed.profile.rank_tier ||
    existing.profile.leaderboard_rank !== processed.profile.leaderboard_rank ||
    existing.wl.win !== processed.wl.win ||
    existing.wl.lose !== processed.wl.lose ||
    JSON.stringify(existing.heroes) !== JSON.stringify(processed.heroes) ||
    JSON.stringify(existing.recentMatches) !== JSON.stringify(processed.recentMatches)
  );
}

/**
 * Abort ongoing player operations
 */
function abortPlayerOperations(abortController: AbortControllerManager, playerId: number): void {
  // Use the abortOperationsByPrefix method from AbortControllerManager
  abortController.abortOperationsByPrefix(createPlayerOperationKey(playerId));
}

export function usePlayerOperations(
  state: PlayerState,
  processing: PlayerProcessing,
  playerDataFetching: PlayerDataFetchingContextValue,
) {
  // Convert PlayerState to OptimisticOperationState
  const optimisticState: OptimisticOperationState<Player> = {
    items: state.players,
    setItems: state.setPlayers,
    selectedId: state.selectedPlayerId,
    setSelectedId: state.setSelectedPlayerId,
    setIsLoading: state.setIsLoading,
  };

  // Create configuration for player operations
  const config: OptimisticOperationConfig<Player, OpenDotaPlayerComprehensive> = {
    createInitialData: createInitialPlayerData,
    processData: processing.processPlayerData,
    fetchData: playerDataFetching.fetchPlayerData,
    createOperationKey: createPlayerOperationKey,
    abortOperations: abortPlayerOperations,
    hasDataChanged: hasPlayerDataChanged,
  };

  // Use the generic optimistic operations hook
  const { addItem, refreshItem, removeItem } = useOptimisticOperations(optimisticState, config);

  return {
    addPlayer: addItem,
    refreshPlayer: refreshItem,
    removePlayer: removeItem,
  };
}

/**
 * Reusable abort controller hook
 * 
 * Provides centralized abort controller management for async operations.
 * Eliminates code duplication across different contexts and operations.
 * 
 * Uses prefixed operation keys to avoid conflicts between different types.
 */

import { useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AbortControllerManager {
  getAbortController: (operationKey: string) => AbortController;
  cleanupAbortController: (operationKey: string) => void;
  hasOngoingOperation: (operationKey: string) => boolean;
  abortOperationsByPrefix: (prefix: string) => void;
  getOngoingOperations: () => string[];
  getOngoingOperationsByPrefix: (prefix: string) => string[];
}

// ============================================================================
// OPERATION KEY HELPERS
// ============================================================================

/**
 * Create operation key for team/league operations
 */
export function createTeamLeagueOperationKey(teamId: number, leagueId: number): string {
  return `team-${teamId}-league-${leagueId}`;
}

/**
 * Create operation key for match operations within a team/league
 */
export function createTeamMatchOperationKey(teamId: number, leagueId: number, matchId: number): string {
  return `team-${teamId}-league-${leagueId}-match-${matchId}`;
}

/**
 * Create operation key for player operations within a team/league
 */
export function createTeamPlayerOperationKey(teamId: number, leagueId: number, playerId: number): string {
  return `team-${teamId}-league-${leagueId}-player-${playerId}`;
}

/**
 * Create operation key for match operations (independent of team/league)
 */
export function createMatchOperationKey(matchId: number): string {
  return `match-${matchId}`;
}

/**
 * Create operation key for player operations (independent of team/league)
 */
export function createPlayerOperationKey(playerId: number): string {
  return `player-${playerId}`;
}

// ============================================================================
// ABORT PATTERN HELPERS
// ============================================================================

/**
 * Abort all operations for a specific team/league combo
 */
export function abortTeamLeagueOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number
): void {
  const teamLeaguePrefix = createTeamLeagueOperationKey(teamId, leagueId);
  abortController.abortOperationsByPrefix(teamLeaguePrefix);
}

/**
 * Abort all operations for a specific match within a team/league
 */
export function abortTeamMatchOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number,
  matchId: number
): void {
  const matchPrefix = createTeamMatchOperationKey(teamId, leagueId, matchId);
  abortController.abortOperationsByPrefix(matchPrefix);
}

/**
 * Abort all operations for a specific player within a team/league
 */
export function abortTeamPlayerOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number,
  playerId: number
): void {
  const playerPrefix = createTeamPlayerOperationKey(teamId, leagueId, playerId);
  abortController.abortOperationsByPrefix(playerPrefix);
}

/**
 * Abort all operations for a specific match (independent of team/league)
 */
export function abortMatchOperations(
  abortController: AbortControllerManager,
  matchId: number
): void {
  const matchPrefix = createMatchOperationKey(matchId);
  abortController.abortOperationsByPrefix(matchPrefix);
}

/**
 * Abort all operations for a specific player (independent of team/league)
 */
export function abortPlayerOperations(
  abortController: AbortControllerManager,
  playerId: number
): void {
  const playerPrefix = createPlayerOperationKey(playerId);
  abortController.abortOperationsByPrefix(playerPrefix);
}

/**
 * Get all ongoing operations for a specific team/league combo
 */
export function getTeamLeagueOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number
): string[] {
  const teamLeaguePrefix = createTeamLeagueOperationKey(teamId, leagueId);
  return abortController.getOngoingOperationsByPrefix(teamLeaguePrefix);
}

/**
 * Get all ongoing operations for a specific match within a team/league
 */
export function getTeamMatchOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number,
  matchId: number
): string[] {
  const matchPrefix = createTeamMatchOperationKey(teamId, leagueId, matchId);
  return abortController.getOngoingOperationsByPrefix(matchPrefix);
}

/**
 * Get all ongoing operations for a specific player within a team/league
 */
export function getTeamPlayerOperations(
  abortController: AbortControllerManager,
  teamId: number,
  leagueId: number,
  playerId: number
): string[] {
  const playerPrefix = createTeamPlayerOperationKey(teamId, leagueId, playerId);
  return abortController.getOngoingOperationsByPrefix(playerPrefix);
}

/**
 * Get all ongoing operations for a specific match (independent of team/league)
 */
export function getMatchOperations(
  abortController: AbortControllerManager,
  matchId: number
): string[] {
  const matchPrefix = createMatchOperationKey(matchId);
  return abortController.getOngoingOperationsByPrefix(matchPrefix);
}

/**
 * Get all ongoing operations for a specific player (independent of team/league)
 */
export function getPlayerOperations(
  abortController: AbortControllerManager,
  playerId: number
): string[] {
  const playerPrefix = createPlayerOperationKey(playerId);
  return abortController.getOngoingOperationsByPrefix(playerPrefix);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing abort controllers for async operations
 */
export function useAbortController(): AbortControllerManager {
  const ongoingOperations = useRef<Map<string, AbortController>>(new Map());

  /**
   * Get or create abort controller for an operation
   */
  const getAbortController = useCallback((operationKey: string): AbortController => {
    // Abort any existing operation for this key
    const existingController = ongoingOperations.current.get(operationKey);
    if (existingController) {
      existingController.abort();
    }
    
    // Create new abort controller
    const controller = new AbortController();
    ongoingOperations.current.set(operationKey, controller);
    return controller;
  }, []);

  /**
   * Clean up abort controller for an operation
   */
  const cleanupAbortController = useCallback((operationKey: string): void => {
    const controller = ongoingOperations.current.get(operationKey);
    if (controller) {
      controller.abort();
      ongoingOperations.current.delete(operationKey);
    }
  }, []);

  /**
   * Check if an operation is ongoing
   */
  const hasOngoingOperation = useCallback((operationKey: string): boolean => {
    return ongoingOperations.current.has(operationKey);
  }, []);

  /**
   * Abort operations by prefix (e.g., all team operations)
   */
  const abortOperationsByPrefix = useCallback((prefix: string): void => {
    const operationsToAbort: string[] = [];
    
    ongoingOperations.current.forEach((controller, key) => {
      if (key.startsWith(prefix)) {
        controller.abort();
        operationsToAbort.push(key);
      }
    });
    
    // Remove aborted operations from the map
    operationsToAbort.forEach(key => {
      ongoingOperations.current.delete(key);
    });
  }, []);

  /**
   * Get list of ongoing operation keys
   */
  const getOngoingOperations = useCallback((): string[] => {
    return Array.from(ongoingOperations.current.keys());
  }, []);

  /**
   * Get list of ongoing operation keys by prefix
   */
  const getOngoingOperationsByPrefix = useCallback((prefix: string): string[] => {
    return Array.from(ongoingOperations.current.keys()).filter(key => 
      key.startsWith(prefix)
    );
  }, []);

  return {
    getAbortController,
    cleanupAbortController,
    hasOngoingOperation,
    abortOperationsByPrefix,
    getOngoingOperations,
    getOngoingOperationsByPrefix
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if operation was aborted and handle silently
 */
export function handleAbortCheck<T>(
  abortController: AbortController,
  fallbackValue: T
): T | null {
  if (abortController.signal.aborted) {
    // Silently handle abort - this is expected when operations are replaced
    return fallbackValue;
  }
  return null;
}

/**
 * Handle error vs abort distinction for operations
 */
export function handleOperationErrorWithAbort<T>(
  error: Error | string | object,
  abortController: AbortController,
  fallbackValue: T,
  errorHandler?: (error: Error | string | object) => void
): T | null {
  // Only handle actual errors, not aborts
  if (!abortController.signal.aborted) {
    if (errorHandler) {
      errorHandler(error);
    }
    return null;
  }
  // Return fallback value for aborted operations
  return fallbackValue;
}

/**
 * Create a safe async operation wrapper
 */
export function createSafeAsyncOperation<T>(
  operation: (abortController: AbortController) => Promise<T>,
  abortController: AbortController,
  fallbackValue: T
): Promise<T | null> {
  return operation(abortController)
    .then(result => {
      if (abortController.signal.aborted) {
        return fallbackValue;
      }
      return result;
    })
    .catch(error => {
      if (abortController.signal.aborted) {
        return fallbackValue;
      }
      throw error;
    });
} 
/**
 * Data Coordinator Workflows
 * 
 * Extracted workflow functions from data-coordinator-context.tsx
 * to reduce file size and improve maintainability.
 */

import React, { useCallback } from 'react';

import { useHeroContext } from '@/contexts/hero-context';
import { useMatchContext } from '@/contexts/match-context';
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { usePlayerContext } from '@/contexts/player-context';
import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import { useTeamContext } from '@/contexts/team-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { Match } from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';

import type {
    ErrorState,
    OperationState,
    OperationType
} from './data-coordinator-types';

// ============================================================================
// TYPES
// ============================================================================

// Remove duplicate type/interface definitions and any dead code or unused stubs.
// Add a file-level comment clarifying this file's responsibility.

// ============================================================================
// WORKFLOW FUNCTIONS
// ============================================================================

// Operation management hook
export function useOperationManagement(
  setOperationState: React.Dispatch<React.SetStateAction<OperationState>>,
  setErrorState: React.Dispatch<React.SetStateAction<ErrorState>>
) {
  const startOperation = useCallback((operationType: OperationType, totalSteps: number) => {
    setOperationState({
      isInProgress: true,
      currentStep: 0,
      totalSteps,
      operationType,
      progress: {
        teamFetch: false,
        matchFetch: false,
        playerFetch: false,
        heroFetch: false,
        dataTransformation: false
      }
    });
    setErrorState(prev => ({ ...prev, hasError: false, errorMessage: null, errorContext: null }));
  }, [setOperationState, setErrorState]);

  const updateProgress = useCallback((step: number, progress: Partial<OperationState['progress']>) => {
    setOperationState(prev => ({
      ...prev,
      currentStep: step,
      progress: { ...prev.progress, ...progress }
    }));
  }, [setOperationState]);

  const completeOperation = useCallback(() => {
    setOperationState(prev => ({
      ...prev,
      isInProgress: false,
      currentStep: 0,
      totalSteps: 0,
      operationType: null,
      progress: {
        teamFetch: false,
        matchFetch: false,
        playerFetch: false,
        heroFetch: false,
        dataTransformation: false
      }
    }));
  }, [setOperationState]);

  const handleOperationError = useCallback((error: Error, context: string) => {
    setErrorState({
      hasError: true,
      errorMessage: error.message,
      errorContext: context,
      retryCount: 0,
      maxRetries: 3
    });
    setOperationState(prev => ({
      ...prev,
      isInProgress: false,
      currentStep: 0,
      totalSteps: 0,
      operationType: null
    }));
  }, [setErrorState, setOperationState]);

  return {
    startOperation,
    updateProgress,
    completeOperation,
    handleOperationError
  };
}

// Team addition workflow hook
export function useTeamAdditionWorkflow(
  teamContext: ReturnType<typeof useTeamContext>,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  teamDataFetching: ReturnType<typeof useTeamDataFetching>,
  matchDataFetching: ReturnType<typeof useMatchDataFetching>,
  playerDataFetching: ReturnType<typeof usePlayerDataFetching>,
  operationManagement: ReturnType<typeof useOperationManagement>
) {
  const addTeamWithFullData = useCallback(async (teamId: string, leagueId: string) => {
    const { startOperation, updateProgress, completeOperation, handleOperationError } = operationManagement;
    try {
      // Step 1: Start operation
      startOperation('team-addition', 4);
      updateProgress(1, { teamFetch: true });
      // Step 2: Fetch team data with force=true to ensure fresh data
      const teamResult = await teamDataFetching.fetchTeamData(teamId, true);
      if ('error' in teamResult) {
        // Add team to context with error state instead of throwing
        await teamContext.addTeam(teamId, leagueId);
        // The team context will handle the error state internally
        completeOperation();
        return; // Exit early, don't proceed with match fetching
      }
      // Step 3: Add team to context
      await teamContext.addTeam(teamId, leagueId);
      updateProgress(2, { teamFetch: false, matchFetch: true });
      // Step 4: Fetch and process matches
      const leagueMatches = (teamResult.matches || []).filter((match: { leagueId: string }) => 
        match.leagueId === leagueId
      );
      // Step 5: Fetch and add matches one by one for real-time updates
      const internalMatches: Match[] = [];
      const matchDetailPromises = leagueMatches.map(match => 
        matchDataFetching.fetchMatchData(match.matchId)
          .then((matchData) => {
            if (matchData && !('error' in matchData)) {
              const internalMatch: Match = {
                id: matchData.match_id.toString(),
                teamId: teamId,
                leagueId: leagueId,
                opponent: matchData.radiant_name || matchData.dire_name || 'Unknown',
                result: matchData.radiant_win ? 'win' as const : 'loss' as const,
                date: new Date(matchData.start_time * 1000).toISOString(),
                duration: matchData.duration,
                teamSide: 'radiant' as const, // Default, will be updated with detailed data
                pickOrder: 'first' as const, // Default, will be updated with detailed data
                players: [], // Will be populated with detailed data
                heroes: [] // Will be populated with detailed data
              };
              internalMatches.push(internalMatch);
              matchContext.addMatches([internalMatch]);
              // Trigger detailed match data fetching for this match
              return matchDataFetching.fetchMatchData(internalMatch.id);
            }
            return null;
          })
          .catch((error) => {
            console.warn(`Failed to fetch match ${match.matchId}:`, error);
            return null;
          })
      );
      await Promise.allSettled(matchDetailPromises);
      updateProgress(3, { matchFetch: false, dataTransformation: true });
      // Step 6: Extract and aggregate players
      const playerData = internalMatches.flatMap(() => {
        return extractPlayersFromSide();
      });
      // Step 7: Add players to context
      for (const player of playerData) {
        await playerContext.addPlayer(player.accountId.toString());
      }
      updateProgress(4, { dataTransformation: false });
      completeOperation();
    } catch (error) {
      handleOperationError(error instanceof Error ? error : new Error('Unknown error'), 'team-addition');
      throw error;
    }
  }, [teamContext, teamDataFetching, matchDataFetching, playerContext, matchContext, operationManagement]);
  return { addTeamWithFullData };
}

// Match analysis workflow hook
export function useMatchAnalysisWorkflow(
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  matchDataFetching: ReturnType<typeof useMatchDataFetching>,
  playerDataFetching: ReturnType<typeof usePlayerDataFetching>,
  operationManagement: ReturnType<typeof useOperationManagement>
) {
  const analyzeMatchesForTeam = useCallback(async (teamId: string, leagueId: string) => {
    const { startOperation, updateProgress, completeOperation, handleOperationError } = operationManagement;
    try {
      // Step 1: Start operation
      startOperation('match-analysis', 3);
      updateProgress(1, { matchFetch: true });
      // Step 2: Get teams league-specific matches from match context
      const teamMatches = matchContext.matches.filter((match: { teamId: string; leagueId: string }) => 
        match.teamId === teamId && match.leagueId === leagueId
      );
      // Step 3: Fetch detailed match data for each match
      const matchPromises = teamMatches.map(async (match: { id: string }) => {
        return await matchDataFetching.fetchMatchData(match.id);
      });
      const matchResults = await Promise.allSettled(matchPromises);
      const successfulMatches = matchResults
        .filter((result): result is PromiseFulfilledResult<OpenDotaMatch> => result.status === 'fulfilled')
        .map((result: PromiseFulfilledResult<OpenDotaMatch>) => result.value)
        .filter(Boolean);
      updateProgress(2, { matchFetch: false, playerFetch: true });
      // Step 4: Extract player data from matches
      const playerData = successfulMatches.flatMap(() => {
        return extractPlayersFromSide();
      });
      // Step 5: Add players to context
      for (const player of playerData) {
        await playerContext.addPlayer(player.accountId.toString());
      }
      updateProgress(3, { playerFetch: false });
      completeOperation();
    } catch (error) {
      handleOperationError(error instanceof Error ? error : new Error('Unknown error'), 'match-analysis');
      throw error;
    }
  }, [matchContext, playerContext, matchDataFetching, operationManagement]);
  return { analyzeMatchesForTeam };
}

// Player aggregation workflow hook
export function usePlayerAggregationWorkflow(
  playerContext: ReturnType<typeof usePlayerContext>,
  playerDataFetching: ReturnType<typeof usePlayerDataFetching>,
  operationManagement: ReturnType<typeof useOperationManagement>
) {
  const aggregatePlayersForTeam = useCallback(async (teamId: string) => {
    const { startOperation, updateProgress, completeOperation, handleOperationError } = operationManagement;
    try {
      // Step 1: Start operation
      startOperation('player-aggregation', 2);
      updateProgress(1, { playerFetch: true });
      // Step 2: Get all players for the team from player context
      const teamPlayers = playerContext.players.filter((player: { teamId: string }) => 
        player.teamId === teamId
      );
      // Step 3: Fetch detailed player data for each player
      const playerPromises = teamPlayers.map(async (player: { id: string }) => {
        return await playerDataFetching.fetchPlayerData(player.id);
      });
      await Promise.allSettled(playerPromises);
      updateProgress(2, { playerFetch: false });
      completeOperation();
    } catch (error) {
      handleOperationError(error instanceof Error ? error : new Error('Unknown error'), 'player-aggregation');
      throw error;
    }
  }, [playerContext, playerDataFetching, operationManagement]);
  return { aggregatePlayersForTeam };
}

// Cross-context synchronization hook
export function useContextSynchronization(
  teamContext: ReturnType<typeof useTeamContext>,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  heroContext: ReturnType<typeof useHeroContext>
) {
  const synchronizeContexts = useCallback(async () => {
    // Ensure all contexts are in sync
    // This would typically involve checking for consistency between contexts
    // and resolving any conflicts
  }, []);
  const clearAllContexts = useCallback(() => {
    // Clear all contexts when switching teams
    // Use the actual methods available in the contexts
    teamContext.setActiveTeam(null);
    matchContext.selectMatch('');
    playerContext.setSelectedPlayer('');
    heroContext.setSelectedHero('');
  }, [teamContext, matchContext, playerContext, heroContext]);
  const refreshAllData = useCallback(async () => {
    // Refresh all data for current team (user-initiated)
    if (teamContext.activeTeam) {
      await teamContext.refreshTeam(teamContext.activeTeam.teamId, teamContext.activeTeam.leagueId);
    }
  }, [teamContext]);
  return {
    synchronizeContexts,
    clearAllContexts,
    refreshAllData
  };
}

// Error handling hook
export function useErrorHandling(
  setErrorState: React.Dispatch<React.SetStateAction<ErrorState>>,
  operationManagement: ReturnType<typeof useOperationManagement>
) {
  const handleContextError = useCallback((error: Error, context: string) => {
    operationManagement.handleOperationError(error, context);
  }, [operationManagement]);
  const retryOperation = useCallback(async () => {
    // This would need to track the last operation and its parameters
  }, []);
  const clearAllErrors = useCallback(() => {
    setErrorState({
      hasError: false,
      errorMessage: null,
      errorContext: null,
      retryCount: 0,
      maxRetries: 3
    });
  }, [setErrorState]);
  return {
    handleContextError,
    retryOperation,
    clearAllErrors
  };
}

// Context coordination hook
export function useContextCoordination() {
  const coordinateTeamContext = useCallback(() => {
    // Coordinate team context operations
  }, []);
  const coordinateMatchContext = useCallback(() => {
    // Coordinate match context operations
  }, []);
  const coordinatePlayerContext = useCallback(() => {
    // Coordinate player context operations
  }, []);
  const coordinateHeroContext = useCallback(() => {
    // Coordinate hero context operations
  }, []);
  return {
    coordinateTeamContext,
    coordinateMatchContext,
    coordinatePlayerContext,
    coordinateHeroContext
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractPlayersFromSide(): Array<{ accountId: number }> {
  // TODO: Implement actual extraction logic
  return [];
} 
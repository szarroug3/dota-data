/**
 * Data Coordinator Context
 * 
 * Orchestrates complex data operations across multiple contexts.
 * Handles multi-step processes like team addition, match analysis, and player aggregation.
 * Provides centralized coordination, progress tracking, and state synchronization.
 * All operations are user-initiated - no automatic refreshes or background operations.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useHeroContext } from '@/contexts/hero-context';
import { useMatchContext } from '@/contexts/match-context';
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { usePlayerContext } from '@/contexts/player-context';
import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import { useTeamContext } from '@/contexts/team-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { OpenDotaMatch } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

export type OperationType = 'team-addition' | 'match-analysis' | 'player-aggregation' | 'hero-analysis';

export interface OperationState {
  isInProgress: boolean;
  currentStep: number;
  totalSteps: number;
  operationType: OperationType | null;
  progress: {
    teamFetch: boolean;
    matchFetch: boolean;
    playerFetch: boolean;
    heroFetch: boolean;
    dataTransformation: boolean;
  };
}

export interface ErrorState {
  hasError: boolean;
  errorMessage: string | null;
  errorContext: string | null;
  retryCount: number;
  maxRetries: number;
}

export interface UIStatus {
  isLoading: boolean;
  operationInProgress: boolean;
  currentOperation: OperationType | null;
  progress: number; // 0-100
  error: string | null;
  canRetry: boolean;
}

export type UserAction = 
  | { type: 'add-team'; teamId: string; leagueId: string }
  | { type: 'analyze-matches'; teamId: string; leagueId: string }
  | { type: 'aggregate-players'; teamId: string; leagueId: string }
  | { type: 'clear-all'; }
  | { type: 'retry-operation'; };

export interface DataCoordinatorContextValue {
  // State
  activeTeam: { teamId: string; leagueId: string } | null;
  operationState: OperationState;
  errorState: ErrorState;
  
  // Actions
  selectTeam: (teamId: string, leagueId: string) => Promise<void>;
  addTeamWithFullData: (teamId: string, leagueId: string) => Promise<void>;
  analyzeMatchesForTeam: (teamId: string, leagueId: string) => Promise<void>;
  aggregatePlayersForTeam: (teamId: string) => Promise<void>;
  
  // Cross-context coordination
  synchronizeContexts: () => Promise<void>;
  clearAllContexts: () => void;
  refreshAllData: () => Promise<void>;
  
  // Error handling
  handleContextError: (error: Error, context: string) => void;
  retryOperation: () => Promise<void>;
  clearAllErrors: () => void;
  
  // UI integration
  getUIStatus: () => UIStatus;
  handleUserAction: (action: UserAction) => Promise<void>;
  
  // Context coordination
  coordinateTeamContext: () => void;
  coordinateMatchContext: () => void;
  coordinatePlayerContext: () => void;
  coordinateHeroContext: () => void;
}

interface DataCoordinatorProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const DataCoordinatorContext = createContext<DataCoordinatorContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

// State management hook
function useDataCoordinatorState() {
  const [activeTeam, setActiveTeam] = useState<{ teamId: string; leagueId: string } | null>(null);
  const [operationState, setOperationState] = useState<OperationState>({
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
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorMessage: null,
    errorContext: null,
    retryCount: 0,
    maxRetries: 3
  });

  return {
    activeTeam, setActiveTeam,
    operationState, setOperationState,
    errorState, setErrorState
  };
}

// Operation management hook
function useOperationManagement(
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
function useTeamAdditionWorkflow(
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
      
      // Step 2: Fetch team data
      const teamResult = await teamDataFetching.fetchTeamData(teamId);
      if ('error' in teamResult) {
        throw new Error(`Failed to fetch team data: ${teamResult.error}`);
      }
      
      // Step 3: Add team to context
      await teamContext.addTeam(teamId, leagueId);
      updateProgress(2, { teamFetch: false, matchFetch: true });
      
      // Step 4: Fetch and process matches
      const leagueMatches = (teamResult.matches || []).filter((match: { leagueId: string }) => 
        match.leagueId === leagueId
      );
      
      // Step 5: Fetch detailed match data for each match
      const matchPromises = leagueMatches.map(async (match: { matchId: string }) => {
        return await matchDataFetching.fetchMatchData(match.matchId);
      });
      
      const matchResults = await Promise.allSettled(matchPromises);
      const successfulMatches = matchResults
        .filter((result): result is PromiseFulfilledResult<OpenDotaMatch> => result.status === 'fulfilled')
        .map((result: PromiseFulfilledResult<OpenDotaMatch>) => result.value)
        .filter(Boolean);
      
      updateProgress(3, { matchFetch: false, dataTransformation: true });
      
      // Step 6: Extract and aggregate players
      const playerData = successfulMatches.flatMap(() => {
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
  }, [teamContext, teamDataFetching, matchDataFetching, playerContext, operationManagement]);

  return { addTeamWithFullData };
}

// Match analysis workflow hook
function useMatchAnalysisWorkflow(
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
      
      // Step 2: Get team's league-specific matches from match context
      // Note: This would need to be implemented in match context or fetched separately
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
function usePlayerAggregationWorkflow(
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
function useContextSynchronization(
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
function useErrorHandling(
  setErrorState: React.Dispatch<React.SetStateAction<ErrorState>>,
  operationManagement: ReturnType<typeof useOperationManagement>
) {
  const handleContextError = useCallback((error: Error, context: string) => {
    operationManagement.handleOperationError(error, context);
  }, [operationManagement]);

  const retryOperation = useCallback(async () => {
    // Retry the last failed operation
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

// UI integration hook
function useUIIntegration(
  operationState: OperationState,
  errorState: ErrorState,
  handleUserAction: (action: UserAction) => Promise<void>
) {
  const getUIStatus = useCallback((): UIStatus => {
    return {
      isLoading: operationState.isInProgress,
      operationInProgress: operationState.isInProgress,
      currentOperation: operationState.operationType,
      progress: operationState.totalSteps > 0 
        ? Math.round((operationState.currentStep / operationState.totalSteps) * 100)
        : 0,
      error: errorState.errorMessage,
      canRetry: errorState.hasError && errorState.retryCount < errorState.maxRetries
    };
  }, [operationState, errorState]);

  const handleUserActionWrapper = useCallback(async (action: UserAction) => {
    try {
      await handleUserAction(action);
    } catch (error) {
      console.error('Failed to handle user action:', error);
    }
  }, [handleUserAction]);

  return {
    getUIStatus,
    handleUserAction: handleUserActionWrapper
  };
}

// Context coordination hook
function useContextCoordination() {
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

// Main logic hook
function useDataCoordinatorLogic() {
  // State
  const state = useDataCoordinatorState();
  const operationManagement = useOperationManagement(state.setOperationState, state.setErrorState);
  
  // Contexts
  const teamContext = useTeamContext();
  const matchContext = useMatchContext();
  const playerContext = usePlayerContext();
  const heroContext = useHeroContext();
  
  // Data fetching contexts
  const teamDataFetching = useTeamDataFetching();
  const matchDataFetching = useMatchDataFetching();
  const playerDataFetching = usePlayerDataFetching();
  
  // Workflows
  const teamAdditionWorkflow = useTeamAdditionWorkflow(
    teamContext, matchContext, playerContext,
    teamDataFetching, matchDataFetching, playerDataFetching,
    operationManagement
  );
  
  const matchAnalysisWorkflow = useMatchAnalysisWorkflow(
    matchContext, playerContext,
    matchDataFetching, playerDataFetching, operationManagement
  );
  
  const playerAggregationWorkflow = usePlayerAggregationWorkflow(
    playerContext, playerDataFetching, operationManagement
  );
  
  // Cross-context coordination
  const contextSynchronization = useContextSynchronization(
    teamContext, matchContext, playerContext, heroContext
  );
  
  // Error handling
  const errorHandling = useErrorHandling(state.setErrorState, operationManagement);
  
  // Context coordination
  const contextCoordination = useContextCoordination();
  
  // Actions
  const selectTeam = useCallback(async (teamId: string, leagueId: string) => {
    state.setActiveTeam({ teamId, leagueId });
    await teamContext.setActiveTeam(teamId, leagueId);
  }, [state, teamContext]);
  
  const handleUserAction = useCallback(async (action: UserAction) => {
    switch (action.type) {
      case 'add-team':
        await teamAdditionWorkflow.addTeamWithFullData(action.teamId, action.leagueId);
        break;
      case 'analyze-matches':
        await matchAnalysisWorkflow.analyzeMatchesForTeam(action.teamId, action.leagueId);
        break;
      case 'aggregate-players':
        await playerAggregationWorkflow.aggregatePlayersForTeam(action.teamId);
        break;
      case 'clear-all':
        contextSynchronization.clearAllContexts();
        break;
      case 'retry-operation':
        await errorHandling.retryOperation();
        break;
    }
  }, [teamAdditionWorkflow, matchAnalysisWorkflow, playerAggregationWorkflow, contextSynchronization, errorHandling]);
  
  // UI integration
  const uiIntegration = useUIIntegration(state.operationState, state.errorState, handleUserAction);
  
  return {
    // State
    activeTeam: state.activeTeam,
    operationState: state.operationState,
    errorState: state.errorState,
    
    // Actions
    selectTeam,
    addTeamWithFullData: teamAdditionWorkflow.addTeamWithFullData,
    analyzeMatchesForTeam: matchAnalysisWorkflow.analyzeMatchesForTeam,
    aggregatePlayersForTeam: playerAggregationWorkflow.aggregatePlayersForTeam,
    
    // Cross-context coordination
    synchronizeContexts: contextSynchronization.synchronizeContexts,
    clearAllContexts: contextSynchronization.clearAllContexts,
    refreshAllData: contextSynchronization.refreshAllData,
    
    // Error handling
    handleContextError: errorHandling.handleContextError,
    retryOperation: errorHandling.retryOperation,
    clearAllErrors: errorHandling.clearAllErrors,
    
    // UI integration
    getUIStatus: uiIntegration.getUIStatus,
    handleUserAction: uiIntegration.handleUserAction,
    
    // Context coordination
    coordinateTeamContext: contextCoordination.coordinateTeamContext,
    coordinateMatchContext: contextCoordination.coordinateMatchContext,
    coordinatePlayerContext: contextCoordination.coordinatePlayerContext,
    coordinateHeroContext: contextCoordination.coordinateHeroContext
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractPlayersFromSide(): Array<{ accountId: number }> {
  return [];
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const DataCoordinatorProvider: React.FC<DataCoordinatorProviderProps> = ({ children }) => {
  const logic = useDataCoordinatorLogic();
  
  return (
    <DataCoordinatorContext.Provider value={logic}>
      {children}
    </DataCoordinatorContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useDataCoordinator = (): DataCoordinatorContextValue => {
  const context = useContext(DataCoordinatorContext);
  
  if (context === undefined) {
    throw new Error('useDataCoordinator must be used within a DataCoordinatorProvider');
  }
  
  return context;
}; 
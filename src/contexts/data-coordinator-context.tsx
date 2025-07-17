"use client";

/**
 * Data Coordinator Context
 * 
 * Coordinates data flow between different contexts and manages data dependencies.
 * Handles data synchronization, caching, and error management across contexts.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useHeroContext } from '@/contexts/hero-context';
import { useMatchContext } from '@/contexts/match-context';
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { usePlayerContext } from '@/contexts/player-context';
import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import { useTeamContext } from '@/contexts/team-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { Match } from '@/types/contexts/match-context-value';

import type {
  DataCoordinatorContextValue,
  DataCoordinatorProviderProps,
  ErrorState,
  OperationState,
  UIStatus,
  UserAction
} from './data-coordinator-types';
import {
  useContextCoordination,
  useContextSynchronization,
  useErrorHandling,
  useMatchAnalysisWorkflow,
  useOperationManagement,
  usePlayerAggregationWorkflow,
  useTeamAdditionWorkflow
} from './data-coordinator-workflows';

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
  const actions = useDataCoordinatorActions(
    state, teamContext, teamDataFetching, matchDataFetching, matchContext
  );
  
  const userActionHandler = useUserActionHandler(
    teamAdditionWorkflow, matchAnalysisWorkflow, playerAggregationWorkflow,
    contextSynchronization, errorHandling
  );
  
  // UI integration
  const uiIntegration = useUIIntegration(state.operationState, state.errorState, userActionHandler);
  
  return {
    // State
    activeTeam: state.activeTeam,
    operationState: state.operationState,
    errorState: state.errorState,
    
    // Actions
    selectTeam: actions.selectTeam,
    addTeamWithFullData: teamAdditionWorkflow.addTeamWithFullData,
    refreshTeamWithFullData: actions.refreshTeamWithFullData,
    analyzeMatchesForTeam: matchAnalysisWorkflow.analyzeMatchesForTeam,
    aggregatePlayersForTeam: playerAggregationWorkflow.aggregatePlayersForTeam,
    fetchMatchesForTeam: actions.fetchMatchesForTeam,
    
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

// Extracted actions logic
function useDataCoordinatorActions(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>,
  teamDataFetching: ReturnType<typeof useTeamDataFetching>,
  matchDataFetching: ReturnType<typeof useMatchDataFetching>,
  matchContext: ReturnType<typeof useMatchContext>
) {
  const selectTeam = useCallback(async (teamId: string, leagueId: string) => {
    state.setActiveTeam({ teamId, leagueId });
    await teamContext.setActiveTeam(teamId, leagueId);
  }, [state, teamContext]);
  
  const fetchMatchesForTeam = useCallback(async (teamId: string, leagueId: string) => {
    // Get existing matches from the match context
    const existingMatches = matchContext.matches.filter(match => 
      match.teamId === teamId && match.leagueId === leagueId
    );
    const existingMatchIds = new Set(existingMatches.map(match => match.id));
    
    // Fetch team data with force=true to get fresh data
    const teamResult = await teamDataFetching.fetchTeamData(teamId, true);
    if ('error' in teamResult) {
      console.warn('Failed to fetch team data for matches:', teamResult.error);
      return;
    }
    
    // Filter matches for the specific league
    const leagueMatches = (teamResult.matches || []).filter((match: { leagueId: string }) => 
      match.leagueId === leagueId
    );
    
    // Only fetch matches that don't already exist in the context
    const newMatches = leagueMatches.filter(match => !existingMatchIds.has(match.matchId));
    
    console.log('Fetching new matches for team:', teamId, 'league:', leagueId, 'new matches:', newMatches.length, 'total matches:', leagueMatches.length);
    
    if (newMatches.length === 0) {
      console.log('No new matches to fetch');
      return;
    }
    
    // Fetch and add matches one by one for real-time updates
    const internalMatches: Match[] = [];
    
    // Initiate all match detail requests simultaneously using .then() blocks
    const matchDetailPromises = newMatches.map(match => 
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
              players: [], // Will be populated with detailed data
              heroes: [] // Will be populated with detailed data
            };
            
            internalMatches.push(internalMatch);
            // Add match to context immediately as it comes in
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
    
    // Wait for all match detail requests to complete
    await Promise.allSettled(matchDetailPromises);
  }, [teamDataFetching, matchDataFetching, matchContext]);

  const refreshTeamWithFullData = useCallback(async (teamId: string, leagueId: string) => {
    try {
      // First refresh the team data in the team context
      await teamContext.refreshTeam(teamId, leagueId);
    } catch (error) {
      // Don't throw the error - handle it gracefully in the UI
      // The team context will have already updated the team with an error state
      console.warn('Team refresh failed, but error is handled gracefully:', error);
      return; // Exit early if team refresh failed
    }
    
    try {
      // Then fetch and add matches for the existing team
      await fetchMatchesForTeam(teamId, leagueId);
    } catch (error) {
      // Don't throw the error - handle it gracefully in the UI
      console.warn('Match fetching failed during refresh, but error is handled gracefully:', error);
    }
  }, [teamContext, fetchMatchesForTeam]);

  return {
    selectTeam,
    fetchMatchesForTeam,
    refreshTeamWithFullData
  };
}

// Extracted user action handler
function useUserActionHandler(
  teamAdditionWorkflow: ReturnType<typeof useTeamAdditionWorkflow>,
  matchAnalysisWorkflow: ReturnType<typeof useMatchAnalysisWorkflow>,
  playerAggregationWorkflow: ReturnType<typeof usePlayerAggregationWorkflow>,
  contextSynchronization: ReturnType<typeof useContextSynchronization>,
  errorHandling: ReturnType<typeof useErrorHandling>
) {
  return useCallback(async (action: UserAction) => {
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

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

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
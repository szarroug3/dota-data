"use client";

/**
 * Data Coordinator Context
 * 
 * Coordinates data flow between different contexts and manages data dependencies.
 * Handles data synchronization, caching, and error management across contexts.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useConstantsContext } from '@/contexts/constants-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import type {
  DataCoordinatorContextValue,
  DataCoordinatorProviderProps,
  ErrorState,
  OperationState,
  UIStatus,
  UserAction
} from '@/types/contexts/data-coordinator-types';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const DataCoordinatorContext = createContext<DataCoordinatorContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useDataCoordinatorState() {
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
    operationState, setOperationState,
    errorState, setErrorState
  };
}

function useHydrationState() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  return {
    hasHydrated, setHasHydrated,
    isHydrating, setIsHydrating,
    hydrationError, setHydrationError
  };
}

function useTeamAddOperation(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>
) {
  return useCallback(async (teamId: string, leagueId: string) => {
    state.setOperationState(prev => ({
      ...prev,
      isInProgress: true,
      currentStep: 0,
      totalSteps: 2,
      operationType: 'team-addition',
      progress: {
        teamFetch: false,
        matchFetch: false,
        playerFetch: false,
        heroFetch: false,
        dataTransformation: false
      }
    }));
    state.setErrorState(prev => ({ ...prev, hasError: false, errorMessage: null, errorContext: null }));

    try {
      // Step 1: Add team (this will also fetch match data internally)
      state.setOperationState(prev => ({
        ...prev,
        currentStep: 1,
        progress: { ...prev.progress, teamFetch: true }
      }));
      await teamContext.addTeam(teamId, leagueId);

      // Step 2: Process players (TODO: when we have player data from matches)
      state.setOperationState(prev => ({
        ...prev,
        currentStep: 2,
        progress: { ...prev.progress, playerFetch: true }
      }));
      
      // TODO: Process players when we have player data from match processing
      // This will be implemented when we have player data from match processing

      // Set active team in team context
      teamContext.setActiveTeam(teamId, leagueId);
      state.setOperationState(prev => ({
        ...prev,
        isInProgress: false,
        currentStep: 0,
        totalSteps: 0,
        operationType: null
      }));

    } catch (err) {
      state.setErrorState({
        hasError: true,
        errorMessage: err instanceof Error ? err.message : 'Failed to add team',
        errorContext: 'team-addition',
        retryCount: 0,
        maxRetries: 3
      });
      state.setOperationState(prev => ({
        ...prev,
        isInProgress: false,
        currentStep: 0,
        totalSteps: 0,
        operationType: null
      }));
    }
  }, [state, teamContext]);
}

function useTeamRefreshOperation(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>
) {
  return useCallback(async (teamId: string, leagueId: string) => {
    state.setOperationState(prev => ({
      ...prev,
      isInProgress: true,
      currentStep: 0,
      totalSteps: 2,
      operationType: 'team-addition',
      progress: {
        teamFetch: false,
        matchFetch: false,
        playerFetch: false,
        heroFetch: false,
        dataTransformation: false
      }
    }));
    state.setErrorState(prev => ({ ...prev, hasError: false, errorMessage: null, errorContext: null }));

    try {
      // Step 1: Refresh team (this will also fetch match data internally)
      state.setOperationState(prev => ({
        ...prev,
        currentStep: 1,
        progress: { ...prev.progress, teamFetch: true }
      }));
      await teamContext.refreshTeam(teamId, leagueId);

      // Step 2: Process players (TODO: when we have player data from matches)
      state.setOperationState(prev => ({
        ...prev,
        currentStep: 2,
        progress: { ...prev.progress, playerFetch: true }
      }));
      
      // TODO: Process players when we have player data from match processing

      state.setOperationState(prev => ({
        ...prev,
        isInProgress: false,
        currentStep: 0,
        totalSteps: 0,
        operationType: null
      }));

    } catch (err) {
      state.setErrorState({
        hasError: true,
        errorMessage: err instanceof Error ? err.message : 'Failed to refresh team',
        errorContext: 'team-refresh',
        retryCount: 0,
        maxRetries: 3
      });
      state.setOperationState(prev => ({
        ...prev,
        isInProgress: false,
        currentStep: 0,
        totalSteps: 0,
        operationType: null
      }));
    }
  }, [state, teamContext]);
}

function useTeamOperations(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>
) {
  const addTeam = useTeamAddOperation(state, teamContext);
  const refreshTeam = useTeamRefreshOperation(state, teamContext);

  return {
    addTeam,
    refreshTeam
  };
}

function useMatchOperations(
  matchContext: ReturnType<typeof useMatchContext>
) {
  // Refresh match
  const refreshMatch = useCallback(async (matchId: string) => {
    await matchContext.refreshMatch(matchId);
  }, [matchContext]);

  // Parse match
  const parseMatch = useCallback(async (matchId: string) => {
    await matchContext.parseMatch(matchId);
  }, [matchContext]);

  return {
    refreshMatch,
    parseMatch
  };
}

function useActiveTeamOperations(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>
) {
  // Add match to active team
  const addMatchToActiveTeam = useCallback(async (matchId: string, teamSide: 'radiant' | 'dire') => {
    if (!teamContext.activeTeam) {
      state.setErrorState({
        hasError: true,
        errorMessage: 'No active team selected',
        errorContext: 'active-team-operation',
        retryCount: 0,
        maxRetries: 3
      });
      return;
    }

    try {
      // Delegate to team context to handle the business logic
      await teamContext.addMatchToTeam(matchId, teamSide);
      // Clear any previous errors
      state.setErrorState(prev => ({ ...prev, hasError: false, errorMessage: null, errorContext: null }));
    } catch (err) {
      state.setErrorState({
        hasError: true,
        errorMessage: err instanceof Error ? err.message : 'Failed to add match to team',
        errorContext: 'active-team-operation',
        retryCount: 0,
        maxRetries: 3
      });
    }
  }, [teamContext, state]);

  // Add player to active team
  const addPlayerToActiveTeam = useCallback(async (playerId: string) => {
    if (!teamContext.activeTeam) {
      state.setErrorState({
        hasError: true,
        errorMessage: 'No active team selected',
        errorContext: 'active-team-operation',
        retryCount: 0,
        maxRetries: 3
      });
      return;
    }

    try {
      // Delegate to team context to handle the business logic
      await teamContext.addPlayerToTeam(playerId);
      // Clear any previous errors
      state.setErrorState(prev => ({ ...prev, hasError: false, errorMessage: null, errorContext: null }));
    } catch (err) {
      state.setErrorState({
        hasError: true,
        errorMessage: err instanceof Error ? err.message : 'Failed to add player to team',
        errorContext: 'active-team-operation',
        retryCount: 0,
        maxRetries: 3
      });
    }
  }, [teamContext, state]);

  return {
    addMatchToActiveTeam,
    addPlayerToActiveTeam
  };
}

function useVisibilityOperations(
  teamContext: ReturnType<typeof useTeamContext>
) {
  // Hide/show match for team
  const hideMatch = useCallback((teamId: string, leagueId: string, matchId: string) => {
    teamContext.hideMatch(teamId, leagueId, matchId);
  }, [teamContext]);

  const showMatch = useCallback((teamId: string, leagueId: string, matchId: string) => {
    teamContext.showMatch(teamId, leagueId, matchId);
  }, [teamContext]);

  // Hide/show player for team
  const hidePlayer = useCallback((teamId: string, leagueId: string, playerId: string) => {
    teamContext.hidePlayer(teamId, leagueId, playerId);
  }, [teamContext]);

  const showPlayer = useCallback((teamId: string, leagueId: string, playerId: string) => {
    teamContext.showPlayer(teamId, leagueId, playerId);
  }, [teamContext]);

  return {
    hideMatch,
    showMatch,
    hidePlayer,
    showPlayer
  };
}

function useUtilityOperations(
  state: ReturnType<typeof useDataCoordinatorState>,
  addTeam: ReturnType<typeof useTeamOperations>['addTeam']
) {
  const getUIStatus = useCallback((): UIStatus => {
    return {
      isLoading: state.operationState.isInProgress,
      operationInProgress: state.operationState.isInProgress,
      currentOperation: state.operationState.operationType,
      progress: state.operationState.totalSteps > 0 
        ? (state.operationState.currentStep / state.operationState.totalSteps) * 100 
        : 0,
      error: state.errorState.errorMessage,
      canRetry: state.errorState.hasError && state.errorState.retryCount < state.errorState.maxRetries
    };
  }, [state.operationState, state.errorState]);

  const handleUserAction = useCallback(async (action: UserAction) => {
    switch (action.type) {
      case 'add-team':
        await addTeam(action.teamId, action.leagueId);
        break;
      default:
        console.warn('Unknown user action:', action);
    }
  }, [addTeam]);

  return {
    getUIStatus,
    handleUserAction
  };
}

function useHydration(
  hydrationState: ReturnType<typeof useHydrationState>,
  configContext: ReturnType<typeof useConfigContext>,
  constantsContext: ReturnType<typeof useConstantsContext>,
  teamContext: ReturnType<typeof useTeamContext>
) {
  return useCallback(async () => {
    // Prevent multiple runs
    if (hydrationState.hasHydrated || hydrationState.isHydrating) return;
    
    hydrationState.setIsHydrating(true);
    hydrationState.setHydrationError(null);

    try {
      // Step 1: Fetch heroes and items in parallel (immediate, independent)
      await Promise.all([
        constantsContext.fetchHeroes(),
        constantsContext.fetchItems()
      ]);

      // Step 2: Load team summaries from localStorage (if any teams exist)
      const { teamList } = configContext;
      if (teamList && teamList.length > 0) {
        // Delegate to team context to handle loading teams from config
        await teamContext.loadTeamsFromConfig(teamList);
      }

      // Step 3: Hydrate full team data if active team exists
      // This will naturally wait for both config (activeTeam) and constants (heroes/items)
      const { activeTeam } = configContext;
      if (activeTeam) {
        await teamContext.addTeam(activeTeam.teamId, activeTeam.leagueId);
      }

      hydrationState.setHasHydrated(true);
    } catch (error) {
      hydrationState.setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
    } finally {
      hydrationState.setIsHydrating(false);
    }
  }, [hydrationState, configContext, constantsContext, teamContext]);
}

function useDataCoordinatorActions(
  state: ReturnType<typeof useDataCoordinatorState>,
  teamContext: ReturnType<typeof useTeamContext>,
  matchContext: ReturnType<typeof useMatchContext>
) {
  const teamOperations = useTeamOperations(state, teamContext);
  const matchOperations = useMatchOperations(matchContext);
  const activeTeamOperations = useActiveTeamOperations(state, teamContext);
  const visibilityOperations = useVisibilityOperations(teamContext);
  const utilityOperations = useUtilityOperations(state, teamOperations.addTeam);

  return {
    ...teamOperations,
    ...matchOperations,
    ...activeTeamOperations,
    ...visibilityOperations,
    ...utilityOperations
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const DataCoordinatorProvider: React.FC<DataCoordinatorProviderProps> = ({ children }) => {
  const state = useDataCoordinatorState();
  const hydrationState = useHydrationState();
  const teamContext = useTeamContext();
  const matchContext = useMatchContext();
  const configContext = useConfigContext();
  const constantsContext = useConstantsContext();

  const actions = useDataCoordinatorActions(state, teamContext, matchContext);
  const hydrate = useHydration(hydrationState, configContext, constantsContext, teamContext);

  // Trigger hydration once on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const contextValue: DataCoordinatorContextValue = {
    // State
    operationState: state.operationState,
    errorState: state.errorState,
    
    // Hydration state
    hasHydrated: hydrationState.hasHydrated,
    isHydrating: hydrationState.isHydrating,
    hydrationError: hydrationState.hydrationError,
    
    // Core actions
    addTeam: actions.addTeam,
    refreshTeam: actions.refreshTeam,
    refreshMatch: actions.refreshMatch,
    parseMatch: actions.parseMatch,
    
    // Active team operations
    addMatchToActiveTeam: actions.addMatchToActiveTeam,
    addPlayerToActiveTeam: actions.addPlayerToActiveTeam,
    
    // Visibility controls
    hideMatch: actions.hideMatch,
    showMatch: actions.showMatch,
    hidePlayer: actions.hidePlayer,
    showPlayer: actions.showPlayer,
    
    // UI integration
    getUIStatus: actions.getUIStatus,
    handleUserAction: actions.handleUserAction
  };

  return (
    <DataCoordinatorContext.Provider value={contextValue}>
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
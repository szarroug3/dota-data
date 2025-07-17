// ============================================================================
// useDataCoordinator: UI-Focused Data Coordinator Hook
//
// Provides a high-level, UI-friendly interface for orchestration actions and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useCallback } from 'react';

import { useDataCoordinator as useDataCoordinatorContext } from '@/contexts/data-coordinator-context';
import type { DataCoordinatorContextValue, UIStatus, UserAction } from '@/contexts/data-coordinator-types';

// ============================================================================
// Internal: Data Coordinator Selectors
// ============================================================================
function useCoordinatorSelectors(context: DataCoordinatorContextValue) {
  const {
    operationState,
    errorState,
    activeTeam,
    getUIStatus,
    ...rest
  } = context;
  const uiStatus: UIStatus = getUIStatus();
  return {
    operationState,
    errorState,
    activeTeam,
    uiStatus,
    ...rest
  };
}

// ============================================================================
// Internal: Data Coordinator Actions
// ============================================================================
function useCoordinatorActions(context: DataCoordinatorContextValue) {
  const {
    addTeamWithFullData,
    clearAllContexts,
    clearAllErrors,
    handleUserAction,
    ...rest
  } = context;

  const addTeamWithFullDataHandler = useCallback(async (teamId: string, leagueId: string) => {
    await addTeamWithFullData(teamId, leagueId);
  }, [addTeamWithFullData]);

  const clearAllContextsHandler = useCallback(() => {
    clearAllContexts();
  }, [clearAllContexts]);

  const clearAllErrorsHandler = useCallback(() => {
    clearAllErrors();
  }, [clearAllErrors]);

  const handleUserActionHandler = useCallback(async (action: UserAction) => {
    await handleUserAction(action);
  }, [handleUserAction]);

  return {
    addTeamWithFullData: addTeamWithFullDataHandler,
    clearAllContexts: clearAllContextsHandler,
    clearAllErrors: clearAllErrorsHandler,
    handleUserAction: handleUserActionHandler,
    ...rest
  };
}

// ============================================================================
// Exported Hook: useDataCoordinator
// ============================================================================

export function useDataCoordinator(): ReturnType<typeof useCoordinatorSelectors> & ReturnType<typeof useCoordinatorActions> {
  const context = useDataCoordinatorContext();
  const selectors = useCoordinatorSelectors(context);
  const actions = useCoordinatorActions(context);
  return {
    ...selectors,
    ...actions
  };
} 
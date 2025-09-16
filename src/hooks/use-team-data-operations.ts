/**
 * Team Data Operations Hook
 *
 * Handles adding and refreshing team data operations.
 * Extracted from use-team-operations.ts for better organization.
 */

import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import { createInitialTeamData, generateTeamKey } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';
import { handleOperationError } from '@/utils/error-handling';
import { clearMapItemLoading, setMapItemLoading } from '@/utils/loading-state';
import { updateTeamError } from '@/utils/team-helpers';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function addNewTeamToState(
  teamKey: string,
  newTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
) {
  state.setTeams((prev) => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, newTeamData);
    return newTeams;
  });
}

function updateTeamInState(
  teamKey: string,
  updatedTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
) {
  state.setTeams((prev) => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, updatedTeamData);
    return newTeams;
  });
}

function persistTeamData(
  teamKey: string,
  teamData: TeamData,
  state: Map<string, TeamData>,
  configContext: ConfigContextValue,
): void {
  try {
    const updatedTeams = new Map(state);
    updatedTeams.set(teamKey, teamData);
    configContext.setTeams(updatedTeams);
  } catch (error) {
    console.warn('Failed to persist team data:', error);
  }
}

function handleTeamOperationError(
  error: Error | string | object,
  abortController: AbortController,
  teamId: number,
  leagueId: number,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: ConfigContextValue,
): TeamData {
  const fallbackData = state.teams.get(generateTeamKey(teamId, leagueId)) || createInitialTeamData(teamId, leagueId);

  const errorMessage = handleOperationError(error, abortController, 'Team data operation failed');
  if (errorMessage) {
    updateTeamError(teamId, leagueId, errorMessage, state, configContext);
  }

  return fallbackData;
}

function checkForOngoingOperation(
  abortController: ReturnType<typeof useAbortController>,
  operationKey: string,
): boolean {
  if (abortController.hasOngoingOperation(operationKey)) {
    return true;
  }
  return false;
}

function handleApiErrors(
  teamResult: DotabuffTeam | { error: string },
  leagueResult: DotabuffLeague | { error: string },
  controller: AbortController,
  teamId: number,
  leagueId: number,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: ConfigContextValue,
): boolean {
  if ('error' in teamResult || 'error' in leagueResult) {
    const teamError = 'error' in teamResult ? teamResult.error : null;
    const leagueError = 'error' in leagueResult ? leagueResult.error : null;
    const error = teamError || leagueError || 'Failed to fetch team data';

    const errorMessage = handleOperationError(error, controller, 'Failed to fetch team data');
    if (errorMessage) {
      updateTeamError(teamId, leagueId, errorMessage, state, configContext);
    }

    return true;
  }
  return false;
}

function processSuccessfulResults(
  teamResult: DotabuffTeam,
  leagueResult: DotabuffLeague,
  initialTeamData: TeamData,
  teamKey: string,
  state: { setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: ConfigContextValue,
): void {
  const processedTeamData: TeamData = {
    ...initialTeamData,
    team: {
      id: parseInt(teamResult.id),
      name: teamResult.name,
    },
    league: {
      id: parseInt(leagueResult.id),
      name: leagueResult.name,
    },
    timeAdded: new Date().toISOString(),
  };

  updateTeamInState(teamKey, processedTeamData, state);
  persistTeamData(teamKey, processedTeamData, new Map(), configContext);
}

// ============================================================================
// HOOKS
// ============================================================================

export function useProcessTeamData(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue,
) {
  const abortController = useAbortController();

  return useCallback(
    async (teamId: number, leagueId: number, force: boolean = false): Promise<void> => {
      const teamKey = generateTeamKey(teamId, leagueId);
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);

      // Check for ongoing operations
      if (checkForOngoingOperation(abortController, operationKey)) {
        return;
      }

      const controller = abortController.getAbortController(operationKey);

      try {
        // Create initial team data with loading state
        const initialTeamData = createInitialTeamData(teamId, leagueId);
        addNewTeamToState(teamKey, initialTeamData, state);

        // Set loading state using Map utility
        setMapItemLoading(state.setTeams, teamKey);

        // Fetch team and league data
        const [teamResult, leagueResult] = await Promise.all([
          teamDataFetching.fetchTeamData(teamId, force),
          teamDataFetching.fetchLeagueData(leagueId, force),
        ]);

        // Check if operation was aborted
        if (controller.signal.aborted) {
          return;
        }

        // Handle errors
        if (handleApiErrors(teamResult, leagueResult, controller, teamId, leagueId, state, configContext)) {
          return;
        }

        // Process successful results - at this point we know both results are successful
        const successfulTeamResult = teamResult as DotabuffTeam;
        const successfulLeagueResult = leagueResult as DotabuffLeague;
        processSuccessfulResults(
          successfulTeamResult,
          successfulLeagueResult,
          initialTeamData,
          teamKey,
          state,
          configContext,
        );
      } catch (error) {
        const fallbackData = handleTeamOperationError(
          error as Error | string | object,
          controller,
          teamId,
          leagueId,
          state,
          configContext,
        );
        updateTeamInState(teamKey, fallbackData, state);
      } finally {
        // Clear loading state using Map utility
        clearMapItemLoading(state.setTeams, teamKey);

        abortController.cleanupAbortController(operationKey);
      }
    },
    [state, teamDataFetching, configContext, abortController],
  );
}

export function useTeamDataOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue,
) {
  const processTeamData = useProcessTeamData(state, teamDataFetching, configContext);

  return {
    processTeamData,
  };
}

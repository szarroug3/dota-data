/**
 * Team Summary Operations Hook
 *
 * Handles refreshing team summary data operations.
 * Extracted from use-team-operations.ts for better organization.
 */

import { useCallback } from 'react';

import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import { generateTeamKey } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { handleOperationError } from '@/utils/error-handling';
import { createInitialTeamData, updateTeamError } from '@/utils/team-helpers';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function updateTeamInStateAndPersist(
  teamKey: string,
  updatedTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: ConfigContextValue,
) {
  state.setTeams((prev) => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, updatedTeamData);
    try {
      configContext.setTeams(newTeams);
    } catch (error) {
      console.warn('Failed to persist updated team summary:', error);
    }
    return newTeams;
  });
}

// Removed separate persist function to avoid persisting stale state

function handleSummaryOperationError(
  error: Error | string | object,
  abortController: AbortController,
  teamId: number,
  leagueId: number,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: ConfigContextValue,
): TeamData {
  const fallbackData = state.teams.get(generateTeamKey(teamId, leagueId)) || createInitialTeamData(teamId, leagueId);

  const errorMessage = handleOperationError(error, abortController, 'Team summary operation failed');
  if (errorMessage) {
    updateTeamError(teamId, leagueId, errorMessage, state, configContext);
  }

  return fallbackData;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useRefreshTeamSummary(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: ConfigContextValue,
) {
  const abortController = useAbortController();

  return useCallback(
    async (teamId: number, leagueId: number): Promise<void> => {
      const teamKey = generateTeamKey(teamId, leagueId);
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);

      // Check if there's already an ongoing operation for this team
      if (abortController.hasOngoingOperation(operationKey)) {
        return;
      }

      const controller = abortController.getAbortController(operationKey);

      try {
        // Get existing team data
        const existingTeam = state.teams.get(teamKey);
        if (!existingTeam) {
          // Set error on team data instead of throwing
          const errorMessage = `Team ${teamId} in league ${leagueId} not found`;
          updateTeamError(teamId, leagueId, errorMessage, state, configContext);
          return;
        }

        if (controller.signal.aborted) return;
        updateTeamInStateAndPersist(teamKey, existingTeam, state, configContext);
      } catch (error) {
        const fallbackData = handleSummaryOperationError(
          error as Error | string | object,
          controller,
          teamId,
          leagueId,
          state,
          configContext,
        );
        updateTeamInStateAndPersist(teamKey, fallbackData, state, configContext);
      } finally {
        abortController.cleanupAbortController(operationKey);
      }
    },
    [state, configContext, abortController],
  );
}

export function useTeamSummaryOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: ConfigContextValue,
  addTeam: (teamId: number, leagueId: number, force?: boolean) => Promise<void>,
  refreshTeam: (teamId: number, leagueId: number) => Promise<void>,
) {
  const refreshTeamSummary = useRefreshTeamSummary(state, configContext);

  const refreshAllTeamSummaries = useCallback(async (): Promise<void> => {
    const teamKeys = Array.from(state.teams.keys());
    const activeTeam = configContext.activeTeam;
    const activeTeamKey = activeTeam ? generateTeamKey(activeTeam.teamId, activeTeam.leagueId) : null;

    // Create promises for all teams
    const refreshPromises = teamKeys.map(async (teamKey) => {
      const teamData = state.teams.get(teamKey);
      if (!teamData) {
        console.warn(`Team data not found for key: ${teamKey}`);
        return;
      }

      const teamId = teamData.team.id;
      const leagueId = teamData.league.id;

      try {
        // For active team, use addTeam (full data processing)
        // For non-active teams, use refreshTeam (summary only)
        if (teamKey === activeTeamKey) {
          await addTeam(teamId, leagueId, true); // Force=true for hydration
        } else {
          await refreshTeam(teamId, leagueId);
        }
      } catch (error) {
        console.error(`Failed to refresh team ${teamId} in league ${leagueId}:`, error);
      }
    });

    // Execute all refreshes in parallel
    await Promise.all(refreshPromises);
  }, [state.teams, configContext.activeTeam, addTeam, refreshTeam]);

  return {
    refreshTeamSummary,
    refreshAllTeamSummaries,
  };
}

/**
 * Team State Operations Hook
 *
 * Handles team state management operations like remove and edit.
 * Extracted from use-team-operations.ts for better organization.
 */

import { useCallback } from 'react';

import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import { generateTeamKey } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import type { FetchTeamAndLeagueDataFunction } from '@/types/hooks/use-team-operations';
import { cleanupUnusedData, editTeamData, updateTeamError } from '@/utils/team-helpers';

// ============================================================================
// EXPORTED OPERATIONS
// ============================================================================

export function useTeamStateOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
    selectedTeamId: { teamId: number; leagueId: number } | null;
    setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => void;
    clearSelectedTeamId: () => void;
  },
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue,
  fetchTeamAndLeagueData: FetchTeamAndLeagueDataFunction,
) {
  const abortController = useAbortController();

  /**
   * Persist teams to localStorage after state update
   */
  const persistTeams = useCallback(
    (teams: Map<string, TeamData> | ((prev: Map<string, TeamData>) => Map<string, TeamData>)) => {
      // Use functional update to ensure we calculate and persist from the latest state
      state.setTeams((prev) => {
        const updatedTeams = typeof teams === 'function' ? teams(prev) : teams;
        // Persist to localStorage with the calculated updated teams
        try {
          configContext.setTeams(updatedTeams);
        } catch (error) {
          console.warn('Failed to persist team data:', error);
        }
        return updatedTeams;
      });
    },
    [state, configContext],
  );

  // Remove team
  const removeTeam = useCallback(
    async (teamId: number, leagueId: number): Promise<void> => {
      const key = generateTeamKey(teamId, leagueId);
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
      const teamToRemove = state.teams.get(key);

      // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this team
      abortController.cleanupAbortController(operationKey);

      // Calculate the updated teams first
      const updatedTeams = new Map(state.teams);
      updatedTeams.delete(key);

      // Update local state
      state.setTeams((prev) => {
        const newTeams = new Map(prev);
        newTeams.delete(key);
        return newTeams;
      });

      // PERSIST: Persist the updated state with the calculated teams
      try {
        configContext.setTeams(updatedTeams);
      } catch (error) {
        console.warn('Failed to persist team removal:', error);
      }

      // Clear selected team if it was the removed team
      if (
        state.selectedTeamId &&
        state.selectedTeamId.teamId === teamId &&
        state.selectedTeamId.leagueId === leagueId
      ) {
        state.clearSelectedTeamId();
        configContext.setActiveTeam(null);
      }

      // Perform cleanup of matches and players if the team had data
      if (teamToRemove) {
        const remainingTeams = Array.from(state.teams.values());
        cleanupUnusedData(teamToRemove, remainingTeams, matchContext, playerContext);
      }
    },
    [state, matchContext, playerContext, configContext, abortController],
  );

  // Edit team (update team ID and league ID)
  const editTeam = useCallback(
    async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number): Promise<void> => {
      const currentKey = generateTeamKey(currentTeamId, currentLeagueId);
      const operationKey = createTeamLeagueOperationKey(currentTeamId, currentLeagueId);
      const existingTeam = state.teams.get(currentKey);

      // ABORT ONGOING OPERATIONS: Abort any ongoing operations for the old team
      abortController.cleanupAbortController(operationKey);

      try {
        await editTeamData(
          currentTeamId,
          currentLeagueId,
          newTeamId,
          newLeagueId,
          existingTeam,
          fetchTeamAndLeagueData,
          state,
          configContext,
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to edit team';
        updateTeamError(newTeamId, newLeagueId, errorMessage, state, configContext);
      }
    },
    [state, configContext, fetchTeamAndLeagueData, abortController],
  );

  return { removeTeam, editTeam, persistTeams };
}

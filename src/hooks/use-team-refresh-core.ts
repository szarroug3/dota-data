import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import {
  processTeamMatchesAndUpdateTeam,
  seedOptimisticMatchesInMatchContext,
  seedOptimisticTeamMatchesInTeamsMap,
} from '@/hooks/team-operations-helpers';
import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { generateTeamKey } from '@/utils/team-helpers';

// Track which teams are currently being refreshed to prevent watcher interference
export const refreshingTeams = new Set<string>();

// Helper functions for loading state management
function setTeamLoadingState(
  setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamKey: string,
  isLoading: boolean,
): void {
  setTeamsForLoading((prev) => {
    const newTeams = new Map(prev);
    const existingTeam = newTeams.get(teamKey);
    if (existingTeam) {
      newTeams.set(teamKey, { ...existingTeam, isLoading });
    }
    return newTeams;
  });
}

async function processTeamMatchesAndRefreshErrors(
  teamMatches: Array<{ matchId: number; side: 'radiant' | 'dire' | null }>,
  teamKey: string,
  existing: TeamData | undefined,
  teamId: number,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): Promise<void> {
  // Clear match errors before processing
  teamMatches.forEach((tm) => {
    const match = matchContext.getMatch(tm.matchId);
    if (match?.error) {
      matchContext.setMatches((prev) => {
        const newMatches = new Map(prev);
        const existingMatch = prev.get(tm.matchId);
        if (existingMatch) {
          newMatches.set(tm.matchId, { ...existingMatch, error: undefined, isLoading: false });
        }
        return newMatches;
      });
    }
  });

  // Use the existing team processing logic - this will naturally handle refreshing errored matches
  seedOptimisticTeamMatchesInTeamsMap(setTeams, teamKey, teamMatches, existing, teamId);
  seedOptimisticMatchesInMatchContext(matchContext, teamMatches);
  await processTeamMatchesAndUpdateTeam(setTeams, teamKey, teamMatches, existing, teamId, matchContext, playerContext);
}

export function useRefreshTeamCore(
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  handleTeamSummaryOperation: (
    teamId: number,
    leagueId: number,
    force: boolean,
    operationKey: string,
    abortController: ReturnType<typeof useAbortController>,
    teamDataFetching: TeamDataFetchingContextValue,
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  ) => Promise<TeamData | null>,
) {
  const abortController = useAbortController();

  return useCallback(
    async (teamId: number, leagueId: number): Promise<void> => {
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
      const teamKey = generateTeamKey(teamId, leagueId);

      // Mark team as refreshing to prevent watcher interference
      refreshingTeams.add(teamKey);

      // Ensure team exists with loading state before starting refresh
      setTeamLoadingState(setTeamsForLoading, teamKey, true);

      // Also set loading state on main teams state so handleTeamSummaryOperation preserves it
      setTeams((prev) => {
        const newTeams = new Map(prev);
        const existingTeam = newTeams.get(teamKey);
        if (existingTeam) {
          newTeams.set(teamKey, { ...existingTeam, isLoading: true });
        }
        return newTeams;
      });

      try {
        const transformedTeam = await handleTeamSummaryOperation(
          teamId,
          leagueId,
          true,
          operationKey,
          abortController,
          teamDataFetching,
          setTeams,
        );

        if (transformedTeam && !transformedTeam.error) {
          const teamMatches = teamDataFetching.findTeamMatchesInLeague(leagueId, teamId);
          const existing = teams.get(teamKey);

          await processTeamMatchesAndRefreshErrors(
            teamMatches,
            teamKey,
            existing,
            teamId,
            setTeams,
            matchContext,
            playerContext,
          );

          // Clear loading state after all operations are complete
          setTeamLoadingState(setTeamsForLoading, teamKey, false);
        } else {
          setTeamLoadingState(setTeamsForLoading, teamKey, false);
        }
      } catch (e) {
        setTeamLoadingState(setTeamsForLoading, teamKey, false);
        throw e;
      } finally {
        // Remove team from refreshing set after a delay to ensure state updates are fully applied
        setTimeout(() => {
          refreshingTeams.delete(teamKey);
        }, 200);
      }
    },
    [
      teams,
      setTeams,
      setTeamsForLoading,
      teamDataFetching,
      matchContext,
      playerContext,
      abortController,
      handleTeamSummaryOperation,
    ],
  );
}

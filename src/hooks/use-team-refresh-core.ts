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
import { clearMapItemLoading, setMapItemLoading } from '@/utils/loading-state';
import { generateTeamKey } from '@/utils/team-helpers';

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
      setMapItemLoading(setTeamsForLoading, teamKey);
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
          seedOptimisticTeamMatchesInTeamsMap(setTeams, teamKey, teamMatches, existing, leagueId);
          seedOptimisticMatchesInMatchContext(matchContext, teamMatches);
          await processTeamMatchesAndUpdateTeam(
            setTeams,
            teamKey,
            teamMatches,
            existing,
            teamId,
            matchContext,
            playerContext,
          );
        }
      } finally {
        clearMapItemLoading(setTeamsForLoading, teamKey);
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

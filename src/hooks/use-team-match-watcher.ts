import { useEffect } from 'react';

import { processTeamMatchesAndUpdateTeam } from '@/hooks/team-operations-helpers';
import { refreshingTeams } from '@/hooks/use-team-refresh-core';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';

interface UseTeamMatchWatcherProps {
  teams: Map<string, TeamData>;
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  matchContext: MatchContextValue;
  playerContext: PlayerContextValue;
}

export function useTeamMatchWatcher({ teams, setTeams, matchContext, playerContext }: UseTeamMatchWatcherProps): void {
  useEffect(() => {
    // Find teams that are still loading and have matches that might be ready now
    const teamsToRetry = Array.from(teams.entries()).filter(([teamKey, teamData]) => {
      if (!teamData.isLoading) return false; // Team is not loading, skip

      // Skip teams that are currently being refreshed
      if (refreshingTeams.has(teamKey)) {
        return false;
      }

      const matchIds = Object.keys(teamData.matches || {}).map((id) => Number(id));
      if (matchIds.length === 0) return false; // No matches to process

      // Check if any matches are still loading
      const hasLoadingMatches = matchIds.some((matchId) => {
        const match = matchContext.getMatch(matchId);
        return match?.isLoading === true;
      });

      return !hasLoadingMatches; // Retry if no matches are loading
    });

    if (teamsToRetry.length === 0) return;

    // Retry processing for each team
    teamsToRetry.forEach(async ([teamKey, teamData]) => {
      const teamId = teamData.team.id;
      const teamMatches = Object.entries(teamData.matches || {}).map(([matchId, matchData]) => ({
        matchId: Number(matchId),
        side: matchData.side as 'radiant' | 'dire' | null,
      }));

      try {
        await processTeamMatchesAndUpdateTeam(
          setTeams,
          teamKey,
          teamMatches,
          teamData,
          teamId,
          matchContext,
          playerContext,
        );
      } catch (error) {
        console.error(`[Team Match Watcher] Error retrying team ${teamId}:`, error);
      }
    });
  }, [teams, matchContext.matches, playerContext.players, setTeams, matchContext, playerContext]);
}

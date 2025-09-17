import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import { generateTeamKey } from '@/utils/team-helpers';

export function createCollectManualMatches(teams: Map<string, TeamData>) {
  return () => {
    const collected: { teamKey: string; matchId: number; side: 'radiant' | 'dire' | null }[] = [];
    teams.forEach((teamData, teamKey) => {
      if (!teamData.manualMatches) return;
      Object.entries(teamData.manualMatches).forEach(([matchId, manualMatch]) => {
        collected.push({ teamKey, matchId: parseInt(matchId, 10), side: manualMatch.side });
      });
    });
    return collected;
  };
}

export function createEnsureOptimisticMatches(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
) {
  return (entries: { teamKey: string; matchId: number; side: 'radiant' | 'dire' | null }[]) => {
    setTeams((prev) => {
      const newTeams = new Map(prev);
      entries.forEach(({ teamKey, matchId, side }) => {
        const team = newTeams.get(teamKey);
        if (!team) return;
        if (!team.matches[matchId]) {
          const optimisticMatch: TeamMatchParticipation = {
            matchId,
            result: 'lost',
            duration: 0,
            opponentName: 'Loading...',
            leagueId: team.league.id.toString(),
            startTime: Date.now(),
            side: side as 'radiant' | 'dire' | null,
            pickOrder: null,
          };
          const nextMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
          nextMatches[matchId] = optimisticMatch;
          newTeams.set(teamKey, { ...team, matches: nextMatches });
        }
      });
      return newTeams;
    });
  };
}

export function createAddAllManualMatches(matchContext: MatchContextValue) {
  return async (entries: { teamKey: string; matchId: number; side: 'radiant' | 'dire' | null }[]) => {
    for (const entry of entries) {
      await matchContext.addMatch(entry.matchId);
    }
  };
}

export function createRemoveManualMatch(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
) {
  return (matchId: number) => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    setTeams((prev) => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      if (team) {
        const nextManual = { ...(team.manualMatches || {}) };
        delete nextManual[matchId];
        const nextMatches = { ...(team.matches || {}) } as Record<number, TeamMatchParticipation>;
        delete nextMatches[matchId];
        newTeams.set(teamKey, { ...team, manualMatches: nextManual, matches: nextMatches });
      }
      return newTeams;
    });
  };
}

export function createEditManualMatch(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
) {
  return async (oldMatchId: number, newMatchId: number, teamSide: 'radiant' | 'dire') => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    if (!team) return;
    if (oldMatchId !== newMatchId) {
      if (team.manualMatches && newMatchId in team.manualMatches) {
        throw new Error(`Match ${newMatchId} is already added as a manual match`);
      }
      if (team.matches && newMatchId in team.matches) {
        throw new Error(`Match ${newMatchId} is already in the team's match history`);
      }
    }
    setTeams((prev) => {
      const newTeams = new Map(prev);
      const cur = newTeams.get(teamKey);
      if (cur) {
        const nextManual = { ...(cur.manualMatches || {}) };
        delete nextManual[oldMatchId];
        nextManual[newMatchId] = { side: teamSide };
        const nextMatches: Record<number, TeamMatchParticipation> = { ...(cur.matches || {}) };
        delete nextMatches[oldMatchId];
        nextMatches[newMatchId] = {
          matchId: newMatchId,
          result: 'lost',
          duration: 0,
          opponentName: 'Loading...',
          leagueId: cur.league.id.toString(),
          startTime: Date.now(),
          side: teamSide,
          pickOrder: null,
        };
        newTeams.set(teamKey, { ...cur, manualMatches: nextManual, matches: nextMatches });
      }
      return newTeams;
    });
    if (oldMatchId !== newMatchId) {
      matchContext.removeMatch(oldMatchId);
    }
  };
}



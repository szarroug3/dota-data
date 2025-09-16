import React from 'react';

import {
  buildOptimisticTeamMatch,
  buildTeamMatchFromReal,
  coerceManualPlayersToArray,
  getUpdatedMatchFields,
  mergePlayersUniqueByAccountId,
} from '@/hooks/team-operations-helpers';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import { generateTeamKey } from '@/utils/team-helpers';

function useTeamMatchOps(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
) {
  const addMatchToTeam = React.useCallback(
    async (matchId: number, teamSide: 'radiant' | 'dire') => {
      if (!selectedTeamId) throw new Error('No active team selected');
      const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
      const match = matchContext.getMatch(matchId);
      setTeams((prev) => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        if (team) {
          if (!(matchId in team.matches)) {
            const teamMatch: TeamMatchParticipation =
              match && !match.isLoading && !match.error
                ? buildTeamMatchFromReal(matchId, match, teamSide, selectedTeamId.leagueId)
                : buildOptimisticTeamMatch(matchId, selectedTeamId.leagueId, teamSide);
            team.matches[matchId] = teamMatch;
            if (!team.manualMatches) team.manualMatches = {};
            team.manualMatches[matchId] = { side: teamSide };
            newTeams.set(teamKey, { ...team, matches: team.matches, manualMatches: team.manualMatches });
          }
        }
        return newTeams;
      });
    },
    [selectedTeamId, matchContext, setTeams],
  );

  const updateTeamMatchFromMatch = React.useCallback(
    (matchId: number, match: ReturnType<MatchContextValue['getMatch']>) => {
      if (!selectedTeamId || !match) return;
      const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
      const team = teams.get(teamKey);
      const teamMatch = team?.matches[matchId];
      if (teamMatch && !match.isLoading && !match.error) {
        const updated = getUpdatedMatchFields(teamMatch, match);
        setTeams((prev) => {
          const newTeams = new Map(prev);
          const next = newTeams.get(teamKey);
          if (next && next.matches[matchId]) {
            next.matches[matchId] = { ...next.matches[matchId], ...updated };
            newTeams.set(teamKey, { ...next, matches: next.matches });
          }
          return newTeams;
        });
      }
    },
    [selectedTeamId, teams, setTeams],
  );

  React.useEffect(() => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    if (!team) return;
    Object.keys(team.matches).forEach((matchIdStr) => {
      const matchId = parseInt(matchIdStr, 10);
      const match = matchContext.getMatch(matchId);
      const teamMatch = team.matches[matchId];
      if (
        match &&
        teamMatch &&
        (teamMatch.opponentName === 'Loading...' || teamMatch.opponentName === 'Unknown') &&
        !match.isLoading &&
        !match.error
      ) {
        updateTeamMatchFromMatch(matchId, match);
      }
    });
  }, [selectedTeamId, teams, matchContext, updateTeamMatchFromMatch]);

  return { addMatchToTeam };
}

function useTeamPlayerOps(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  playerContext: PlayerContextValue,
) {
  const addPlayerToTeam = React.useCallback(
    async (playerId: number) => {
      if (!selectedTeamId) throw new Error('No active team selected');
      const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
      const player = await playerContext.addPlayer(playerId);
      setTeams((prev) => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        if (team) {
          const existingManual = Array.isArray(team.manualPlayers)
            ? team.manualPlayers
            : Object.keys(team.manualPlayers || {}).map((n) => Number(n));
          const updatedManualPlayers = Array.from(new Set([...existingManual, playerId]));
          let updatedPlayers = team.players;
          if (player) {
            const exists = updatedPlayers.some((p) => p.accountId === player.profile.profile.account_id);
            if (!exists) {
              updatedPlayers = mergePlayersUniqueByAccountId(updatedPlayers, [
                {
                  accountId: player.profile.profile.account_id,
                  playerName: player.profile.profile.personaname || 'Unknown Player',
                  roles: [],
                  totalMatches: 0,
                  totalWins: 0,
                  totalLosses: 0,
                  winRate: 0,
                  averageKDA: 0,
                  averageGPM: 0,
                  averageXPM: 0,
                  averageLastHits: 0,
                  averageDenies: 0,
                },
              ]);
            }
          }
          newTeams.set(teamKey, { ...team, players: updatedPlayers, manualPlayers: updatedManualPlayers });
        }
        return newTeams;
      });
    },
    [selectedTeamId, playerContext, setTeams],
  );

  const removeManualPlayer = React.useCallback(
    (playerId: number) => {
      if (!selectedTeamId) return;
      const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
      setTeams((prev) => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        if (team) {
          const manual = coerceManualPlayersToArray(
            team.manualPlayers as number[] | Record<string, number | string> | undefined,
          );
          team.manualPlayers = manual.filter((id) => id !== playerId);
          team.players = team.players.filter((p) => p.accountId !== playerId);
          newTeams.set(teamKey, { ...team });
        }
        return newTeams;
      });
      playerContext.removePlayer(playerId);
    },
    [selectedTeamId, setTeams, playerContext],
  );

  const editManualPlayer = React.useCallback(
    async (oldPlayerId: number, newPlayerId: number) => {
      if (!selectedTeamId) return;
      const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
      setTeams((prev) => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        if (team) {
          const manual = coerceManualPlayersToArray(
            team.manualPlayers as number[] | Record<string, number | string> | undefined,
          );
          const nextManual = Array.from(new Set([...manual.filter((id) => id !== oldPlayerId), newPlayerId]));
          team.manualPlayers = nextManual;
          team.players = team.players
            .map((p) => (p.accountId === oldPlayerId ? { ...p, accountId: newPlayerId } : p))
            .filter((p, idx, arr) => arr.findIndex((x) => x.accountId === p.accountId) === idx);
          newTeams.set(teamKey, { ...team });
        }
        return newTeams;
      });
      await playerContext.addPlayer(newPlayerId);
      setTimeout(() => {
        try {
          playerContext.removePlayer(oldPlayerId);
        } catch {
          // no-op
        }
      }, 50);
    },
    [selectedTeamId, setTeams, playerContext],
  );

  return { addPlayerToTeam, removeManualPlayer, editManualPlayer };
}

export function useTeamSpecificOperations(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
) {
  const matchOps = useTeamMatchOps(selectedTeamId, teams, setTeams, matchContext);
  const playerOps = useTeamPlayerOps(selectedTeamId, setTeams, playerContext);
  return { ...matchOps, ...playerOps };
}

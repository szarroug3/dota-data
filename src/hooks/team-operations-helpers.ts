import { processMatchAndExtractPlayers } from '@/lib/processing/team-processing';
import type { Match, MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';

// =============================================================================
// SMALL, PURE HELPERS USED BY TEAM OPERATIONS
// =============================================================================

export function coerceManualPlayersToArray(
  manualPlayers: number[] | Record<string, number | string> | undefined,
): number[] {
  if (!manualPlayers) return [];
  return Array.isArray(manualPlayers) ? manualPlayers : Object.keys(manualPlayers).map((id) => Number(id));
}

export function buildOptimisticTeamMatch(
  matchId: number,
  leagueId: number,
  teamSide: 'radiant' | 'dire',
): TeamMatchParticipation {
  return {
    matchId,
    result: 'lost',
    duration: 0,
    opponentName: 'Loading...',
    leagueId: leagueId.toString(),
    startTime: Date.now(),
    side: teamSide,
    pickOrder: null,
  };
}

export function buildTeamMatchFromReal(
  matchId: number,
  match: Match,
  teamSide: 'radiant' | 'dire',
  leagueId: number,
): TeamMatchParticipation {
  const result = match.result === teamSide ? 'won' : 'lost';
  const startTime = new Date(match.date).getTime();
  const opponentName = teamSide === 'radiant' ? match.dire?.name : match.radiant?.name;
  const pickOrder = match.pickOrder?.[teamSide] || null;
  return {
    matchId,
    result,
    duration: match.duration,
    opponentName: opponentName || '',
    leagueId: leagueId.toString(),
    startTime,
    side: teamSide,
    pickOrder,
  };
}

export function mergePlayersUniqueByAccountId(
  existing: TeamData['players'],
  additional: TeamData['players'],
): TeamData['players'] {
  if (!additional?.length) return existing;
  const byId = new Map<number, TeamData['players'][number]>();
  existing.forEach((p) => byId.set(p.accountId, p));
  additional.forEach((p) => byId.set(p.accountId, p));
  return Array.from(byId.values());
}

function getTeamSide(teamMatch: TeamMatchParticipation): 'radiant' | 'dire' | null {
  return (teamMatch.side as 'radiant' | 'dire' | null) || null;
}

function computeResult(
  teamSide: 'radiant' | 'dire' | null,
  fallback: TeamMatchParticipation['result'],
  match: Match,
): TeamMatchParticipation['result'] {
  if (!teamSide) return fallback;
  return match.result === teamSide ? 'won' : 'lost';
}

function computeOpponentName(teamSide: 'radiant' | 'dire' | null, fallback: string, match: Match): string {
  if (teamSide === 'radiant') return match.dire?.name || '';
  if (teamSide === 'dire') return match.radiant?.name || '';
  return fallback || '';
}

function computePickOrder(
  teamSide: 'radiant' | 'dire' | null,
  fallback: TeamMatchParticipation['pickOrder'],
  match: Match,
): TeamMatchParticipation['pickOrder'] {
  if (!teamSide) return fallback;
  return match.pickOrder?.[teamSide] || null;
}

export function getUpdatedMatchFields(
  teamMatch: TeamMatchParticipation,
  match: Match,
): Pick<TeamMatchParticipation, 'result' | 'duration' | 'opponentName' | 'startTime' | 'pickOrder'> {
  const teamSide = getTeamSide(teamMatch);
  const result = computeResult(teamSide, teamMatch.result, match);
  const startTime = new Date(match.date).getTime();
  const opponentName = computeOpponentName(teamSide, teamMatch.opponentName, match);
  const pickOrder = computePickOrder(teamSide, teamMatch.pickOrder, match);

  return {
    result,
    duration: match.duration,
    opponentName,
    startTime,
    pickOrder,
  };
}

// =============================================================================
// SIDE-EFFECT HELPERS USED BY CORE OPERATIONS
// =============================================================================

export function seedOptimisticTeamMatchesInTeamsMap(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamKey: string,
  teamMatches: Array<{ matchId: number; side: 'radiant' | 'dire' | null }>,
  existing: TeamData | undefined,
  leagueId: number,
): void {
  setTeams((prev) => {
    const newTeams = new Map(prev);
    const team = newTeams.get(teamKey);
    if (team) {
      const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
      teamMatches.forEach(({ matchId, side }) => {
        if (!updatedMatches[matchId]) {
          const isManualMatch = existing?.manualMatches?.[matchId];
          const knownSide = (isManualMatch?.side as 'radiant' | 'dire' | undefined) ?? side ?? 'radiant';
          updatedMatches[matchId] = buildOptimisticTeamMatch(matchId, leagueId, knownSide);
        }
      });
      newTeams.set(teamKey, { ...team, matches: updatedMatches });
    }
    return newTeams;
  });
}

export function seedOptimisticMatchesInMatchContext(
  matchContext: MatchContextValue,
  teamMatches: Array<{ matchId: number }>,
): void {
  teamMatches.forEach(({ matchId }) => {
    if (!matchContext.getMatch(matchId)) {
      void matchContext.addMatch(matchId);
    }
  });
}

export async function processTeamMatchesAndUpdateTeam(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamKey: string,
  teamMatches: Array<{ matchId: number; side: 'radiant' | 'dire' | null }>,
  existing: TeamData | undefined,
  teamId: number,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
): Promise<void> {
  const matchProcessingPromises = teamMatches.map(({ matchId, side }) => {
    const isManualMatch = existing?.manualMatches?.[matchId];
    const knownSide = (isManualMatch?.side as 'radiant' | 'dire' | undefined) ?? side ?? undefined;
    return processMatchAndExtractPlayers(matchId, teamId, matchContext, playerContext, knownSide);
  });
  const processedMatches = await Promise.all(matchProcessingPromises);
  setTeams((prev) => {
    const newTeams = new Map(prev);
    const team = newTeams.get(teamKey);
    if (team) {
      const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
      processedMatches.forEach((processedMatch) => {
        if (processedMatch) {
          updatedMatches[processedMatch.matchId] = processedMatch;
        }
      });
      const matchesArray = Object.values(updatedMatches);
      const totalWins = matchesArray.filter((m) => m.result === 'won').length;
      const totalLosses = matchesArray.filter((m) => m.result === 'lost').length;
      const averageMatchDuration =
        matchesArray.reduce((sum: number, m) => sum + (m.duration || 0), 0) / (matchesArray.length || 1);
      newTeams.set(teamKey, {
        ...team,
        matches: updatedMatches,
        performance: {
          ...team.performance,
          totalMatches: matchesArray.length,
          totalWins,
          totalLosses,
          overallWinRate: matchesArray.length > 0 ? (totalWins / matchesArray.length) * 100 : 0,
          averageMatchDuration,
        },
      });
    }
    return newTeams;
  });
}

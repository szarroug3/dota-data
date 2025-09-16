import type { Match } from '@/types/contexts/match-context-value';
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

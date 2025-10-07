import type { PlayerRole } from '@/frontend/lib/app-data-types';
import type { OpenDotaMatchPlayer } from '@/types/external-apis';

interface PlayerAnalysisResult {
  player: OpenDotaMatchPlayer;
  supportScore: number;
}

function calculateSupportScore(player: OpenDotaMatchPlayer): number {
  return (player.observer_uses || 0) + (player.sentry_uses || 0) * 2;
}

function analyzePlayer(player: OpenDotaMatchPlayer): PlayerAnalysisResult {
  const supportScore = calculateSupportScore(player);
  return { player, supportScore };
}

function groupPlayersByLaneRole(playerAnalysis: PlayerAnalysisResult[]) {
  const playersByLaneRole: Record<number, PlayerAnalysisResult[]> = {};
  playerAnalysis.forEach((analysis) => {
    const laneRole = analysis.player.lane_role || 0;
    if (!playersByLaneRole[laneRole]) {
      playersByLaneRole[laneRole] = [];
    }
    playersByLaneRole[laneRole].push(analysis);
  });
  return playersByLaneRole;
}

function assignMidRoles(
  playersByLaneRole: Record<number, PlayerAnalysisResult[]>,
  roleMap: Record<string, PlayerRole>,
) {
  const midPlayers = playersByLaneRole[2] || [];
  if (midPlayers.length > 0) {
    const key = safeKey(midPlayers[0].player.account_id);
    if (key) roleMap[key] = 'Mid';
  }
}

function assignSafeLaneRoles(
  playersByLaneRole: Record<number, PlayerAnalysisResult[]>,
  roleMap: Record<string, PlayerRole>,
) {
  const safeLanePlayers = playersByLaneRole[1] || [];
  if (safeLanePlayers.length === 0) return;
  const sortedPlayers = [...safeLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  if (safeLanePlayers.length === 1) {
    const k0 = safeKey(sortedPlayers[0].player.account_id);
    if (k0) roleMap[k0] = 'Carry';
  } else if (safeLanePlayers.length === 2) {
    const k0 = safeKey(sortedPlayers[0].player.account_id);
    const k1 = safeKey(sortedPlayers[1].player.account_id);
    if (k0) roleMap[k0] = 'Carry';
    if (k1) roleMap[k1] = 'Hard Support';
  }
}

function assignOffLaneRoles(
  playersByLaneRole: Record<number, PlayerAnalysisResult[]>,
  roleMap: Record<string, PlayerRole>,
) {
  const offLanePlayers = playersByLaneRole[3] || [];
  if (offLanePlayers.length === 0) return;

  const sortedPlayers = [...offLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  const keys = sortedPlayers.map((p) => safeKey(p.player.account_id)).filter((k): k is string => Boolean(k));

  if (keys[0]) roleMap[keys[0]] = 'Offlane';
  if (keys[1]) roleMap[keys[1]] = 'Support';
  if (keys[2]) roleMap[keys[2]] = 'Hard Support';
}

function assignRemainingRoles(playerAnalysis: PlayerAnalysisResult[], roleMap: Record<string, PlayerRole>) {
  const unassigned = playerAnalysis.filter((analysis) => {
    const k = safeKey(analysis.player?.account_id);
    return !k || !roleMap[k];
  });
  unassigned.forEach((analysis) => {
    const key = safeKey(analysis.player?.account_id);
    if (!key) return;
    if (analysis.player.is_roaming) {
      roleMap[key] = 'Roaming';
    }
  });
}

function safeKey(accountId: number | undefined | null): string | null {
  return typeof accountId === 'number' && Number.isFinite(accountId) ? accountId.toString() : null;
}

export function detectTeamRoles(teamPlayers: OpenDotaMatchPlayer[]): Record<string, PlayerRole> {
  const roleMap: Record<string, PlayerRole> = {};
  if (teamPlayers.length === 0) return roleMap;
  const playerAnalysis = teamPlayers.map(analyzePlayer);
  const playersByLaneRole = groupPlayersByLaneRole(playerAnalysis);
  assignMidRoles(playersByLaneRole, roleMap);
  assignSafeLaneRoles(playersByLaneRole, roleMap);
  assignOffLaneRoles(playersByLaneRole, roleMap);
  assignRemainingRoles(playerAnalysis, roleMap);
  return roleMap;
}

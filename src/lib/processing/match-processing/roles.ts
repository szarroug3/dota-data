import type { PlayerRole } from '@/types/contexts/team-context-value';
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
  playerAnalysis.forEach(analysis => {
    const laneRole = analysis.player.lane_role || 0;
    if (!playersByLaneRole[laneRole]) {
      playersByLaneRole[laneRole] = [];
    }
    playersByLaneRole[laneRole].push(analysis);
  });
  return playersByLaneRole;
}

function assignMidRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const midPlayers = playersByLaneRole[2] || [];
  if (midPlayers.length > 0) {
    roleMap[midPlayers[0].player.account_id.toString()] = 'Mid';
  }
}

function assignSafeLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const safeLanePlayers = playersByLaneRole[1] || [];
  if (safeLanePlayers.length === 0) return;
  const sortedPlayers = [...safeLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  if (safeLanePlayers.length === 1) {
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Carry';
  } else if (safeLanePlayers.length === 2) {
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Carry';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Hard Support';
  }
}

function assignOffLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const offLanePlayers = playersByLaneRole[3] || [];
  if (offLanePlayers.length === 0) return;
  const sortedPlayers = [...offLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  if (offLanePlayers.length === 1) {
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
  } else if (offLanePlayers.length === 2) {
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Support';
  } else if (offLanePlayers.length === 3) {
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Support';
    roleMap[sortedPlayers[2].player.account_id.toString()] = 'Hard Support';
  }
}

function assignRemainingRoles(playerAnalysis: PlayerAnalysisResult[], roleMap: Record<string, PlayerRole>) {
  const unassigned = playerAnalysis.filter(analysis => !roleMap[analysis.player.account_id.toString()]);
  unassigned.forEach(analysis => {
    if (analysis.player.is_roaming) {
      roleMap[analysis.player.account_id.toString()] = 'Roaming';
    }
  });
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



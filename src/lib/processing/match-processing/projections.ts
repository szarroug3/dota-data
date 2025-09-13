import type { EventType, Match, MatchEvent } from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';

export interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

export interface GameEvent {
  type: EventType;
  time: number;
  description: string;
  team?: 'radiant' | 'dire';
}

export interface TeamFightStats {
  radiant: { total: number; wins: number; losses: number };
  dire: { total: number; wins: number; losses: number };
}

function getTeamName(side: 'radiant' | 'dire' | 'neutral'): string {
  return side === 'radiant' ? 'Radiant' : 'Dire';
}

function generateEventDescription(event: MatchEvent): string {
  const teamName = getTeamName(event.side);
  switch (event.type) {
    case 'CHAT_MESSAGE_ROSHAN_KILL':
      return `${teamName} killed Roshan`;
    case 'CHAT_MESSAGE_AEGIS':
      return `Aegis picked up by ${event.details.aegisHolder || 'unknown player'}`;
    case 'building_kill':
      return `${teamName} destroyed ${event.details.buildingType || 'building'}`;
    case 'CHAT_MESSAGE_FIRSTBLOOD':
      return `First Blood: ${event.details.killer || 'unknown player'} killed ${event.details.victim || 'unknown player'}`;
    case 'team_fight':
      return `Team Fight`;
    default:
      return `Event at ${event.timestamp}s`;
  }
}

export function processGameEvents(match: Match): GameEvent[] {
  return match.events.map(event => ({
    type: event.type,
    time: event.timestamp,
    description: generateEventDescription(event),
    team: event.side === 'neutral' ? undefined : event.side,
    details: event.details as never
  }));
}

export function processDraftData(match: Match, originalMatchData?: OpenDotaMatch): DraftPhase[] {
  const phases: DraftPhase[] = [];
  if (originalMatchData?.picks_bans) {
    originalMatchData.picks_bans.forEach((pickBan, index) => {
      const order = index + 1;
      if (pickBan.is_pick) {
        phases.push({ phase: 'pick', team: pickBan.team === 0 ? 'radiant' : 'dire', hero: pickBan.hero_id.toString(), time: order });
      } else {
        phases.push({ phase: 'ban', team: pickBan.team === 0 ? 'radiant' : 'dire', hero: pickBan.hero_id.toString(), time: order });
      }
    });
    return phases.sort((a, b) => a.time - b.time);
  }
  return [];
}

function calculateWinsForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  return fights.filter(fight => fight.side === matchResult).length;
}

function calculateLossesForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  const opposingSide = matchResult === 'radiant' ? 'dire' : 'radiant';
  return fights.filter(fight => fight.side === opposingSide).length;
}

export function calculateTeamFightStats(match: Match): TeamFightStats {
  const teamFightEvents = match.events.filter(e => e.type === 'team_fight');
  const radiantFights = teamFightEvents.filter(e => e.side === 'radiant');
  const direFights = teamFightEvents.filter(e => e.side === 'dire');
  return {
    radiant: { total: radiantFights.length, wins: calculateWinsForTeam(radiantFights, match.result), losses: calculateLossesForTeam(radiantFights, match.result) },
    dire: { total: direFights.length, wins: calculateWinsForTeam(direFights, match.result), losses: calculateLossesForTeam(direFights, match.result) },
  };
}



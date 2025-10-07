import type { Match, MatchEvent } from '@/frontend/lib/app-data-types';
import type { OpenDotaMatch } from '@/types/external-apis';

export interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

export interface TeamFightStats {
  radiant: { total: number; wins: number; losses: number };
  dire: { total: number; wins: number; losses: number };
}

export function processDraftData(match: Match, originalMatchData?: OpenDotaMatch): DraftPhase[] {
  const phases: DraftPhase[] = [];
  if (originalMatchData?.picks_bans) {
    originalMatchData.picks_bans.forEach((pickBan, index) => {
      const order = index + 1;
      if (pickBan.is_pick) {
        phases.push({
          phase: 'pick',
          team: pickBan.team === 0 ? 'radiant' : 'dire',
          hero: pickBan.hero_id.toString(),
          time: order,
        });
      } else {
        phases.push({
          phase: 'ban',
          team: pickBan.team === 0 ? 'radiant' : 'dire',
          hero: pickBan.hero_id.toString(),
          time: order,
        });
      }
    });
    return phases.sort((a, b) => a.time - b.time);
  }
  return [];
}

function calculateWinsForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  return fights.filter((fight) => fight.side === matchResult).length;
}

function calculateLossesForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  const opposingSide = matchResult === 'radiant' ? 'dire' : 'radiant';
  return fights.filter((fight) => fight.side === opposingSide).length;
}

export function calculateTeamFightStats(match: Match): TeamFightStats {
  const teamFightEvents = match.events.filter((e) => e.type === 'team_fight');
  const radiantFights = teamFightEvents.filter((e) => e.side === 'radiant');
  const direFights = teamFightEvents.filter((e) => e.side === 'dire');
  return {
    radiant: {
      total: radiantFights.length,
      wins: calculateWinsForTeam(radiantFights, match.result),
      losses: calculateLossesForTeam(radiantFights, match.result),
    },
    dire: {
      total: direFights.length,
      wins: calculateWinsForTeam(direFights, match.result),
      losses: calculateLossesForTeam(direFights, match.result),
    },
  };
}

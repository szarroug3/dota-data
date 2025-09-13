import type { Hero } from '@/types/contexts/constants-context-value';
import type { HeroPick } from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';

export function determinePickOrder(matchData: OpenDotaMatch): {
  radiant: 'first' | 'second' | null;
  dire: 'first' | 'second' | null;
} {
  if (!matchData.picks_bans || matchData.picks_bans.length === 0) {
    return { radiant: null, dire: null };
  }
  const firstPick = matchData.picks_bans.find(pick => pick.is_pick);
  if (!firstPick) {
    return { radiant: null, dire: null };
  }
  const firstPickTeam = firstPick.team === 0 ? 'radiant' : 'dire';
  return {
    radiant: firstPickTeam === 'radiant' ? 'first' : 'second',
    dire: firstPickTeam === 'dire' ? 'first' : 'second',
  };
}

export function convertDraftData(matchData: OpenDotaMatch, heroes: Record<string, Hero>) {
  const radiantPicks: HeroPick[] = [];
  const direPicks: HeroPick[] = [];
  const radiantBans: string[] = [];
  const direBans: string[] = [];
  if (matchData.picks_bans) {
    matchData.picks_bans.forEach(pickBan => {
      const hero = heroes[pickBan.hero_id.toString()];
      if (!hero) return;
      if (pickBan.is_pick) {
        const heroPick: HeroPick = { accountId: 0, hero };
        if (pickBan.team === 0) {
          radiantPicks.push(heroPick);
        } else {
          direPicks.push(heroPick);
        }
      } else {
        const heroId = pickBan.hero_id.toString();
        if (pickBan.team === 0) {
          radiantBans.push(heroId);
        } else {
          direBans.push(heroId);
        }
      }
    });
  }
  return { radiantPicks, direPicks, radiantBans, direBans };
}



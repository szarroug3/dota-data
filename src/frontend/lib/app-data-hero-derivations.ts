import type { Hero, HeroPick, HeroSummaryEntry, Match, TeamHeroSummary } from './app-data-types';
import type { StoredMatchData } from './storage-manager';

interface ComputeTeamHeroSummaryOptions {
  matches: Match[];
  teamMatches: Map<number, StoredMatchData>; // participation + side/result info for the active team
  heroesMap: Map<number, Hero>;
}

interface HeroAggregate {
  picks: number;
  bans: number;
  wins: number;
  losses: number;
  roles: Set<string>;
}

function resolveHero(hero: Hero | undefined, heroId: number, heroesMap: Map<number, Hero>): Hero {
  if (hero) return hero;

  const fallbackHero = heroesMap.get(heroId);
  if (fallbackHero) return fallbackHero;

  return {
    id: heroId,
    name: `hero_${heroId}`,
    localizedName: `Hero ${heroId}`,
    imageUrl: '',
    roles: [],
  };
}

function addRole(aggregate: HeroAggregate, role?: string): void {
  if (role) {
    aggregate.roles.add(role);
  }
}

function createHeroSummaryEntry(heroId: number, aggregate: HeroAggregate): HeroSummaryEntry {
  const totalGames = aggregate.picks;
  const winRate = totalGames > 0 ? (aggregate.wins / totalGames) * 100 : 0;

  return {
    heroId: heroId.toString(),
    heroName: `Hero ${heroId}`,
    heroImage: '',
    count: aggregate.picks,
    winRate,
    totalGames: aggregate.picks,
    primaryAttribute: undefined,
    playedRoles: Array.from(aggregate.roles).map((role) => ({ role, count: aggregate.picks })),
  };
}

function getHeroPicksForSide(match: Match, teamSide: 'radiant' | 'dire', isActiveTeam: boolean): HeroPick[] {
  const picks = match.draft[teamSide === 'radiant' ? 'radiantPicks' : 'direPicks'] || [];
  return picks.map((pick) => ({
    ...pick,
    isActiveTeam,
  }));
}

function getHeroBansForSide(match: Match, teamSide: 'radiant' | 'dire', _isActiveTeam: boolean): Hero[] {
  return match.draft[teamSide === 'radiant' ? 'radiantBans' : 'direBans'] || [];
}

function ensureAggregate(map: Map<number, HeroAggregate>, heroId: number): HeroAggregate {
  let aggregate = map.get(heroId);
  if (!aggregate) {
    aggregate = { picks: 0, bans: 0, wins: 0, losses: 0, roles: new Set() };
    map.set(heroId, aggregate);
  }
  return aggregate;
}

function processPicks(
  match: Match,
  meta: StoredMatchData,
  heroesMap: Map<number, Hero>,
  activePicks: Map<number, HeroAggregate>,
  opponentPicks: Map<number, HeroAggregate>,
) {
  const ourSide = meta.side;
  const oppSide = ourSide === 'radiant' ? 'dire' : 'radiant';
  const ourPicks = getHeroPicksForSide(match, ourSide, true);
  const theirPicks = getHeroPicksForSide(match, oppSide, false);

  for (const pick of ourPicks) {
    const hero = resolveHero(undefined, pick.hero.id, heroesMap);
    const agg = ensureAggregate(activePicks, pick.hero.id);
    agg.picks++;
    addRole(agg, hero.roles?.[0]);
    if (meta.result === 'won') agg.wins++; else agg.losses++;
  }

  for (const pick of theirPicks) {
    const hero = resolveHero(undefined, pick.hero.id, heroesMap);
    const agg = ensureAggregate(opponentPicks, pick.hero.id);
    agg.picks++;
    addRole(agg, hero.roles?.[0]);
    if (meta.result === 'lost') agg.wins++; else agg.losses++;
  }
}

function processBans(
  match: Match,
  meta: StoredMatchData,
  activeBans: Map<number, HeroAggregate>,
  opponentBans: Map<number, HeroAggregate>,
) {
  const ourSide = meta.side;
  const oppSide = ourSide === 'radiant' ? 'dire' : 'radiant';
  const ourBans = getHeroBansForSide(match, ourSide, true);
  const theirBans = getHeroBansForSide(match, oppSide, false);
  for (const ban of ourBans) ensureAggregate(activeBans, ban.id).bans++;
  for (const ban of theirBans) ensureAggregate(opponentBans, ban.id).bans++;
}

function aggregateHeroes(
  matches: Match[],
  teamMatches: Map<number, StoredMatchData>,
  heroesMap: Map<number, Hero>,
): {
  activePicks: Map<number, HeroAggregate>;
  opponentPicks: Map<number, HeroAggregate>;
  activeBans: Map<number, HeroAggregate>;
  opponentBans: Map<number, HeroAggregate>;
} {
  const activePicks = new Map<number, HeroAggregate>();
  const opponentPicks = new Map<number, HeroAggregate>();
  const activeBans = new Map<number, HeroAggregate>();
  const opponentBans = new Map<number, HeroAggregate>();

  for (const match of matches) {
    const meta = teamMatches.get(match.id);
    if (!meta || meta.isHidden) continue;
    processPicks(match, meta, heroesMap, activePicks, opponentPicks);
    processBans(match, meta, activeBans, opponentBans);
  }

  return { activePicks, opponentPicks, activeBans, opponentBans };
}

export function computeTeamHeroSummaryForMatches({
  matches,
  teamMatches,
  heroesMap,
}: ComputeTeamHeroSummaryOptions): TeamHeroSummary {
  const { activePicks, opponentPicks, activeBans, opponentBans } = aggregateHeroes(matches, teamMatches, heroesMap);

  const buildEntries = (aggregates: Map<number, HeroAggregate>): HeroSummaryEntry[] =>
    Array.from(aggregates.entries()).map(([heroId, aggregate]) => createHeroSummaryEntry(heroId, aggregate));

  return {
    matchesCount: matches.length,
    activeTeamPicks: buildEntries(activePicks),
    opponentTeamPicks: buildEntries(opponentPicks),
    activeTeamBans: buildEntries(activeBans),
    opponentTeamBans: buildEntries(opponentBans),
  };
}

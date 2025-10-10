import * as ParticipationHelpers from './app-data-participation-helpers';
import type { Hero, LeagueMatchesCache, Match, Team } from './app-data-types';
import type { StoredHero, StoredMatchData } from './storage-manager';

interface MatchParticipationContext {
  _matches: Map<number, Match>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  heroes: Map<number, Hero>;
  getTeam(teamKey: string): Team | undefined;
  updateTeamPlayersMetadata(teamKey: string, options?: { skipSave?: boolean }): void;
  updateTeamsRef(): void;
  saveToStorage(): void;
}

export function updateTeamMatchParticipation(
  appData: MatchParticipationContext,
  teamKey: string,
  matchIds: number[],
): void {
  const team = appData.getTeam(teamKey);
  if (!team) return;

  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);

  for (const matchId of matchIds) {
    updateMatchParticipationEntry(appData, team, leagueCache, matchId);
  }

  recalculateHighPerformingHeroes(appData, team);
  appData.updateTeamPlayersMetadata(teamKey, { skipSave: true });
  appData.updateTeamsRef();
  appData.saveToStorage();
}

function updateMatchParticipationEntry(
  appData: MatchParticipationContext,
  team: Team,
  leagueCache: LeagueMatchesCache | undefined,
  matchId: number,
): void {
  const match = appData._matches.get(matchId);
  if (!match) {
    return;
  }

  const matchInfo = leagueCache?.matches.get(matchId);
  const computedSide = ParticipationHelpers.determineTeamSide(team.teamId, matchInfo);
  const existingMatchData = team.matches.get(matchId);
  const resolvedSide = determineMatchSide(computedSide, existingMatchData?.side);
  const opponentName = ParticipationHelpers.getOpponentName(resolvedSide, match);
  const result = ParticipationHelpers.getMatchResult(resolvedSide, match);
  const resolvedResult = determineMatchResult(result, existingMatchData?.result);
  const resolvedPickOrder = determinePickOrder(match, resolvedSide, existingMatchData?.pickOrder);
  const heroes = extractTeamHeroes(match, resolvedSide, existingMatchData?.heroes, appData.heroes);

  const updatedMatchData = buildStoredMatchData(
    match,
    resolvedSide,
    resolvedResult,
    opponentName,
    resolvedPickOrder,
    heroes,
    existingMatchData,
  );

  team.matches.set(matchId, updatedMatchData);
}

function recalculateHighPerformingHeroes(appData: MatchParticipationContext, team: Team): void {
  const participationMap = new Map<number, { side?: 'radiant' | 'dire'; result?: 'won' | 'lost' | 'unknown' }>();
  team.matches.forEach((matchData, matchId) => {
    participationMap.set(matchId, {
      side: matchData.side,
      result: matchData.result as 'won' | 'lost' | 'unknown',
    });
  });

  team.highPerformingHeroes = ParticipationHelpers.calculateHighPerformingHeroes(participationMap, appData._matches);
}

function determineMatchSide(
  computedSide: 'radiant' | 'dire',
  existingSide: 'radiant' | 'dire' | undefined,
): 'radiant' | 'dire' {
  // For manual matches, prioritize the existing side if it exists
  // This allows manual side selection to override computed side
  if (existingSide) {
    return existingSide;
  }
  return computedSide;
}

function determineMatchResult(
  result: 'won' | 'lost' | 'unknown',
  existingResult: 'won' | 'lost' | undefined,
): 'won' | 'lost' {
  if (result === 'won' || result === 'lost') {
    return result;
  }
  if (existingResult === 'won' || existingResult === 'lost') {
    return existingResult;
  }
  return 'lost';
}

function determinePickOrder(match: Match, side: 'radiant' | 'dire', existingPickOrder: string | undefined): string {
  const pickOrder = match.pickOrder?.[side];
  if (pickOrder === 'first' || pickOrder === 'second') {
    return pickOrder;
  }
  if (existingPickOrder === 'first' || existingPickOrder === 'second') {
    return existingPickOrder;
  }
  return 'unknown';
}

function getHeroesFromPlayers(match: Match, side: 'radiant' | 'dire', heroesMap: Map<number, Hero>): StoredHero[] {
  const players = match.players?.[side] || [];
  return players
    .map((player) => createHeroSummary(player.hero, heroesMap))
    .filter((hero): hero is StoredHero => hero !== null);
}

function getHeroesFromDraft(match: Match, side: 'radiant' | 'dire', heroesMap: Map<number, Hero>): StoredHero[] {
  const picks = side === 'radiant' ? match.draft?.radiantPicks : match.draft?.direPicks;
  if (!picks) {
    return [];
  }

  return picks
    .map((pick) => createHeroSummary(pick.hero, heroesMap))
    .filter((hero): hero is StoredHero => hero !== null);
}

function extractTeamHeroes(
  match: Match,
  side: 'radiant' | 'dire',
  existingHeroes: StoredHero[] | undefined,
  heroesMap: Map<number, Hero>,
): StoredHero[] {
  const heroes = new Map<number, StoredHero>();

  (existingHeroes || []).forEach((hero) => {
    heroes.set(hero.id, hero);
  });

  const fromPlayers = getHeroesFromPlayers(match, side, heroesMap);
  fromPlayers.forEach((hero) => heroes.set(hero.id, hero));

  const fromDraft = getHeroesFromDraft(match, side, heroesMap);
  fromDraft.forEach((hero) => heroes.set(hero.id, hero));

  if (heroes.size === 0) {
    return existingHeroes ? [...existingHeroes] : [];
  }

  return Array.from(heroes.values());
}

function buildStoredMatchData(
  match: Match,
  side: 'radiant' | 'dire',
  result: 'won' | 'lost',
  opponentName: string,
  pickOrder: string,
  heroes: StoredHero[],
  existingMatchData: StoredMatchData | undefined,
): StoredMatchData {
  return {
    matchId: match.id,
    result,
    duration: match.duration,
    opponentName: opponentName || existingMatchData?.opponentName || 'Unknown',
    date: match.date,
    side,
    pickOrder,
    heroes,
    isManual: existingMatchData?.isManual ?? false,
    isHidden: existingMatchData?.isHidden ?? false,
  };
}

// eslint-disable-next-line complexity
function createHeroSummary(hero: Hero | undefined, heroesMap: Map<number, Hero>): StoredHero | null {
  const id = hero?.id;
  if (typeof id !== 'number') {
    return null;
  }

  const reference = heroesMap.get(id);
  let name = `npc_dota_hero_${id}`;
  let localizedName = `Hero ${id}`;
  let imageUrl = '';

  if (reference?.name) name = reference.name;
  if (reference?.localizedName) localizedName = reference.localizedName;
  if (reference?.imageUrl) imageUrl = reference.imageUrl;

  if (hero?.name) name = hero.name;
  if (hero?.localizedName) localizedName = hero.localizedName;
  if (hero?.imageUrl) imageUrl = hero.imageUrl;

  return {
    id,
    name,
    localizedName,
    imageUrl,
  };
}

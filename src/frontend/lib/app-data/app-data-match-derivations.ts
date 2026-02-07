import type {
  DraftPhase,
  EventDetails,
  Hero,
  Match,
  MatchFilters,
  MatchFiltersResult,
  MatchFilterStats,
  PlayerMatchData,
} from '@/frontend/lib/app-data/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage/storage-manager';

export type DraftFilter = 'picks' | 'bans' | 'both';

interface ComputeTeamMatchFiltersOptions {
  matches: Match[];
  teamMatches: Map<number, StoredMatchData>;
  filters: MatchFilters;
  hiddenMatchIds: Set<number>;
}

function applyDateRangeFilter(match: Match, filters: MatchFilters): boolean {
  if (filters.dateRange === 'all') return true;

  const matchDate = new Date(match.date);
  const now = new Date();

  switch (filters.dateRange) {
    case '7days': {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchDate >= sevenDaysAgo;
    }

    case '30days': {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return matchDate >= thirtyDaysAgo;
    }

    case 'custom': {
      if (filters.customDateRange.start) {
        const startDate = new Date(filters.customDateRange.start);
        if (matchDate < startDate) return false;
      }
      if (filters.customDateRange.end) {
        const endDate = new Date(filters.customDateRange.end);
        if (matchDate > endDate) return false;
      }
      return true;
    }

    default:
      return true;
  }
}

function applyResultFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (filters.result === 'all' || !teamMatch?.side) return true;

  const isWin = teamMatch.result === 'won';

  return filters.result === 'wins' ? isWin : !isWin;
}

function applyTeamSideFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (filters.teamSide === 'all' || !teamMatch?.side) return true;

  return teamMatch.side === filters.teamSide;
}

function applyPickOrderFilter(match: Match, teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (filters.pickOrder === 'all') return true;

  // If teamMatch is missing, we can't filter - exclude it
  if (!teamMatch) return false;

  // Get pick order from match data
  const matchPickOrder = match.pickOrder?.[teamMatch.side];

  // If match has no pick order data, exclude it (we need this info to filter)
  if (!matchPickOrder) return false;

  return matchPickOrder === filters.pickOrder;
}

function applyHeroesFilter(match: Match, teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (filters.heroesPlayed.length === 0 || !teamMatch?.side) return true;

  // Get heroes played by the team in this match from player data
  const teamPlayers = match.players[teamMatch.side] || [];
  const playedHeroes = teamPlayers
    .map((player) => player.hero?.id)
    .filter((id): id is number => typeof id === 'number')
    .map((id) => id.toString());

  if (filters.heroesPlayed.some((heroId) => playedHeroes.includes(heroId))) {
    return true;
  }

  if (teamMatch.heroes && teamMatch.heroes.length > 0) {
    const storedHeroIds = teamMatch.heroes.map((hero) => hero.id.toString());
    return filters.heroesPlayed.some((heroId) => storedHeroIds.includes(heroId));
  }

  // Check if any of the filtered heroes were played
  return false;
}

function applyOpponentFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (filters.opponent.length === 0 || !teamMatch || !teamMatch.opponentName) return true;

  // Get the opponent name from the team match participation data
  const opponentName = teamMatch.opponentName;

  // Check if the opponent team name matches any of the filtered opponents
  return filters.opponent.some((opponentNameFilter) => opponentNameFilter === opponentName);
}

function applyHighPerformersFilter(
  match: Match,
  teamMatch: StoredMatchData | undefined,
  filters: MatchFilters,
  allMatches: Match[],
  teamMatches: Map<number, StoredMatchData>,
  hiddenMatchIds: Set<number>,
): boolean {
  if (!filters.highPerformersOnly || !teamMatch?.side) return true;

  // Calculate hero statistics from unhidden matches (all matches minus manually hidden ones)
  const heroStats: Record<string, { count: number; wins: number; totalGames: number }> = {};

  // Aggregate hero statistics from unhidden matches
  allMatches.forEach((matchData) => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchData.id)) return;

    const matchTeamData = teamMatches.get(matchData.id);
    if (!matchTeamData?.side) return;

    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';

    teamPlayers.forEach((player) => {
      const heroId = player.hero.id.toString();
      if (!heroStats[heroId]) {
        heroStats[heroId] = { count: 0, wins: 0, totalGames: 0 };
      }

      heroStats[heroId].count++;
      heroStats[heroId].totalGames++;
      if (isWin) {
        heroStats[heroId].wins++;
      }
    });
  });

  // Identify high-performing heroes (5+ games, 60%+ win rate)
  const highPerformingHeroes = new Set(
    Object.entries(heroStats)
      .filter(([_, stats]) => stats.count >= 5 && stats.wins / stats.count >= 0.6)
      .map(([heroId, _]) => heroId),
  );

  // Check if current match contains any high-performing heroes
  const teamPlayers = match.players[teamMatch.side] || [];
  return teamPlayers.some((player) => highPerformingHeroes.has(player.hero.id.toString()));
}

function applyAllFiltersExceptHighPerformers(
  match: Match,
  teamMatches: Map<number, StoredMatchData>,
  filters: MatchFilters,
): boolean {
  const teamMatch = teamMatches.get(match.id);

  return (
    applyDateRangeFilter(match, filters) &&
    applyResultFilter(teamMatch, filters) &&
    applyTeamSideFilter(teamMatch, filters) &&
    applyPickOrderFilter(match, teamMatch, filters) &&
    applyHeroesFilter(match, teamMatch, filters) &&
    applyOpponentFilter(teamMatch, filters)
  );
}

function applyAllFilters(
  match: Match,
  teamMatches: Map<number, StoredMatchData>,
  filters: MatchFilters,
  allMatches: Match[],
  hiddenMatchIds: Set<number>,
): boolean {
  const teamMatch = teamMatches.get(match.id);

  return (
    applyAllFiltersExceptHighPerformers(match, teamMatches, filters) &&
    applyHighPerformersFilter(match, teamMatch, filters, allMatches, teamMatches, hiddenMatchIds)
  );
}

function getMatchFilterStats(
  matches: Match[],
  teamMatches: Map<number, StoredMatchData>,
  filters: MatchFilters,
  hiddenMatchIds: Set<number>,
): MatchFilterStats {
  const totalMatches = matches.length;
  const filteredMatches = matches.filter((match) =>
    applyAllFilters(match, teamMatches, filters, matches, hiddenMatchIds),
  );

  // Count matches that pass each individual filter
  const filterBreakdown = {
    dateRange: matches.filter((match) => applyDateRangeFilter(match, filters)).length,
    result: matches.filter((match) => {
      const teamMatch = teamMatches.get(match.id);
      return applyResultFilter(teamMatch, filters);
    }).length,
    teamSide: matches.filter((match) => {
      const teamMatch = teamMatches.get(match.id);
      return applyTeamSideFilter(teamMatch, filters);
    }).length,
    pickOrder: matches.filter((match) => {
      const teamMatch = teamMatches.get(match.id);
      return applyPickOrderFilter(match, teamMatch, filters);
    }).length,
    heroesPlayed: matches.filter((match) => {
      const teamMatch = teamMatches.get(match.id);
      return applyHeroesFilter(match, teamMatch, filters);
    }).length,
    opponent: matches.filter((match) => {
      const teamMatch = teamMatches.get(match.id);
      return applyOpponentFilter(teamMatch, filters);
    }).length,
    highPerformersOnly: (() => {
      return matches.filter((match) => {
        const teamMatch = teamMatches.get(match.id);
        return applyHighPerformersFilter(match, teamMatch, filters, matches, teamMatches, hiddenMatchIds);
      }).length;
    })(),
  };

  return {
    totalMatches,
    filteredMatches: filteredMatches.length,
    filterBreakdown,
  };
}

export function computeTeamMatchFilters(options: ComputeTeamMatchFiltersOptions): MatchFiltersResult {
  const { matches, teamMatches, filters, hiddenMatchIds } = options;

  const filteredMatches = matches.filter((match) =>
    applyAllFilters(match, teamMatches, filters, matches, hiddenMatchIds),
  );

  const stats = getMatchFilterStats(matches, teamMatches, filters, hiddenMatchIds);

  return {
    filteredMatches,
    filterStats: stats,
  };
}

/**
 * Filter draft phases by picks, bans, or both.
 */
export function getDraftPhasesFiltered(processedDraft: DraftPhase[] | undefined, filter: DraftFilter): DraftPhase[] {
  if (!processedDraft?.length) return [];
  if (filter === 'picks') return processedDraft.filter((p) => p.phase === 'pick');
  if (filter === 'bans') return processedDraft.filter((p) => p.phase === 'ban');
  return processedDraft;
}

/**
 * Return players for a side, sorted by draft pick order when draft is available.
 */
export function getPlayersSortedByDraft(match: Match | undefined, side: 'radiant' | 'dire'): PlayerMatchData[] {
  if (!match) return [];
  const players = (match.players[side] || []).slice();
  const picks = match.draft?.[side === 'radiant' ? 'radiantPicks' : 'direPicks'];
  if (!picks?.length) return players;
  return players.sort((a, b) => {
    const aIdx = picks.findIndex((p) => p.hero?.localizedName === a.hero?.localizedName);
    const bIdx = picks.findIndex((p) => p.hero?.localizedName === b.hero?.localizedName);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
}

function safeNumber(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function getMatchPlayerKda(player: PlayerMatchData | undefined): number {
  const kills = safeNumber(player?.stats.kills);
  const deaths = safeNumber(player?.stats.deaths);
  const assists = safeNumber(player?.stats.assists);
  return deaths > 0 ? (kills + assists) / deaths : kills + assists;
}

type TeamfightPlayerDetails = NonNullable<EventDetails['playerDetails']>[number];
export type TeamfightTotals = { radiant: { gold: number; xp: number }; dire: { gold: number; xp: number } };

export function computeTeamfightTotals(
  playerDetails: NonNullable<EventDetails['playerDetails']> | undefined,
): TeamfightTotals {
  const initial = { gold: 0, xp: 0 } as { gold: number; xp: number };
  if (!playerDetails || playerDetails.length === 0) return { radiant: initial, dire: initial };
  const radiant = playerDetails
    .filter((p: { playerIndex: number }) => p.playerIndex < 5)
    .reduce(
      (acc: { gold: number; xp: number }, p: { goldDelta: number; xpDelta: number }) => ({
        gold: acc.gold + p.goldDelta,
        xp: acc.xp + p.xpDelta,
      }),
      initial,
    );
  const dire = playerDetails
    .filter((p: { playerIndex: number }) => p.playerIndex >= 5)
    .reduce(
      (acc: { gold: number; xp: number }, p: { goldDelta: number; xpDelta: number }) => ({
        gold: acc.gold + p.goldDelta,
        xp: acc.xp + p.xpDelta,
      }),
      initial,
    );
  return { radiant, dire };
}

export type TeamfightRowData = {
  heroImageUrl?: string;
  heroName: string;
  isDead: boolean;
  damageText: string | number;
  goldDelta: number;
  xpDelta: number;
};

export function getHeroForPlayer(match: Match | undefined, playerIndex: number): Hero | undefined {
  if (!match?.players) return undefined;
  const isRadiant = playerIndex < 5;
  if (isRadiant) return match.players.radiant?.[playerIndex]?.hero;
  const direIndex = playerIndex - 5;
  return match.players.dire?.[direIndex]?.hero;
}

export function getHeroName(hero: { localizedName?: string } | undefined, fallbackIndex: number): string {
  return hero?.localizedName ?? `Player ${fallbackIndex}`;
}

export function deriveTeamfightRowData(player: TeamfightPlayerDetails, match?: Match): TeamfightRowData {
  const hero = getHeroForPlayer(match, player.playerIndex);
  const heroName = getHeroName(hero, player.playerIndex);
  return {
    heroImageUrl: hero?.imageUrl,
    heroName,
    isDead: player.deaths > 0,
    damageText: typeof player.damage === 'number' ? (player.damage.toLocaleString?.() ?? player.damage) : 0,
    goldDelta: player.goldDelta,
    xpDelta: player.xpDelta,
  };
}

export interface FilterOption {
  value: string;
  label: string;
}

type MatchWithOptionalDraft = Omit<Match, 'draft'> & { draft?: Match['draft'] | null };

/**
 * Build hero options for the "Heroes Played" filter from team matches.
 */
export function getHeroesPlayedOptionsForTeam(
  matches: MatchWithOptionalDraft[],
  teamMatches: Map<number, StoredMatchData>,
): FilterOption[] {
  const heroMap = new Map<number, Hero>();
  const addHero = (hero: Hero | undefined): void => {
    if (!hero?.id) return;
    heroMap.set(hero.id, hero);
  };

  matches.forEach((match) => {
    const teamMatchData = teamMatches.get(match.id);
    if (!teamMatchData?.side) return;
    if (match.draft) {
      const picks = teamMatchData.side === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
      picks?.forEach((pick) => addHero(pick.hero));
      return;
    }

    const teamPlayers = match.players[teamMatchData.side] || [];
    teamPlayers.forEach((player) => addHero(player.hero));

    if (teamMatchData.heroes.length > 0) {
      teamMatchData.heroes.forEach((hero) => addHero(hero));
    }
  });
  const playedHeroes = Array.from(heroMap.values()).sort((a, b) =>
    (a.localizedName ?? '').localeCompare(b.localizedName ?? ''),
  );
  return playedHeroes.map((hero) => ({ value: String(hero.id), label: hero.localizedName ?? `Hero ${hero.id}` }));
}

/**
 * Build opponent name options for the opponent filter from team match metadata.
 */
export function getOpponentNameOptionsForTeam(teamMatches: Map<number, StoredMatchData>): FilterOption[] {
  const names = new Set<string>();
  teamMatches.forEach((teamMatch) => {
    if (teamMatch.opponentName) names.add(teamMatch.opponentName);
  });
  return Array.from(names)
    .sort()
    .map((name) => ({ value: name, label: name }));
}

import {
  computeTeamMatchFilters,
  filterPlayersByTeam,
  sortPlayersByName,
} from '@/frontend/lib/app-data/app-data-derivations';
import { createPlaceholderMatch } from '@/frontend/lib/app-data/app-data-match-placeholder';
import type {
  Hero,
  Match,
  MatchFilters,
  MatchFiltersResult,
  Player,
  Team,
  LeagueMatchesCache,
} from '@/frontend/lib/app-data/app-data-types';
import type { StoredHero, StoredMatchData } from '@/frontend/lib/storage/storage-manager';
import { processPlayerRank, type PlayerRank } from '@/utils/player-statistics';
import { validatePlayerId } from '@/utils/validation';

export interface AppDataComputedOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  heroes: Map<number, Hero>;
}

export interface MatchHistoryData {
  activeTeamMatches: Match[];
  teamMatches: Map<number, StoredMatchData>;
  filteredMatches: Match[];
  visibleMatches: Match[];
  unhiddenMatches: Match[];
  selectedMatch: Match | null;
  filterStats: MatchFiltersResult['filterStats'];
}

export interface TeamPlayersViewData {
  teamPlayerIds: Set<number>;
  teamPlayers: Player[];
  sortedPlayers: Player[];
  manualPlayerIds: Set<number>;
}

export interface PlayerListViewEntry {
  player: Player;
  topHeroes: Hero[];
  rank: PlayerRank | null;
}

export interface PlayerIdInputValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MatchResultBadgeData {
  teamWon: boolean;
  teamSide: 'radiant' | 'dire' | undefined;
}

function sortMatchesByDateDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const aTime = Number.isFinite(Date.parse(a.date)) ? Date.parse(a.date) : 0;
    const bTime = Number.isFinite(Date.parse(b.date)) ? Date.parse(b.date) : 0;
    return bTime - aTime;
  });
}

export function getTeamMatches(appData: AppDataComputedOpsContext, teamKey: string): Match[] {
  const team = appData._teams.get(teamKey);
  if (!team) return [];

  // Combine match IDs from cache and stored metadata
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
  const storedMatchIds = Array.from(team.matches.keys());
  const allMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

  // Return matches that exist in our matches Map
  return sortMatchesByDateDesc(
    Array.from(allMatchIds)
      .map((matchId) => appData._matches.get(matchId))
      .filter((match): match is Match => match !== undefined),
  );
}

/**
 * Get all matches for a specific team, including placeholders for matches not yet loaded
 * Returns full Match objects where available, and placeholder Match objects for matches
 * that exist in team metadata but haven't been fully loaded yet
 *
 * @param teamKey - The team key (teamId-leagueId)
 * @returns Array of Match objects (full or placeholder) sorted by date descending
 */
export function getTeamMatchesWithPlaceholders(appData: AppDataComputedOpsContext, teamKey: string): Match[] {
  const team = appData._teams.get(teamKey);
  if (!team) return [];

  // Combine match IDs from cache and stored metadata
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
  const storedMatchIds = Array.from(team.matches.keys());
  const allMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

  // For each match ID, return full match if available, otherwise create placeholder
  const matches = Array.from(allMatchIds)
    .map((matchId) => {
      const fullMatch = appData._matches.get(matchId);
      if (fullMatch) {
        return fullMatch;
      }

      // Create placeholder if metadata exists
      const metadata = team.matches.get(matchId);
      if (!metadata) {
        return undefined;
      }

      return createPlaceholderMatch(team, matchId, metadata, appData.heroes);
    })
    .filter((match): match is Match => match !== undefined);

  return sortMatchesByDateDesc(matches);
}

export function getMatchesByIds(appData: AppDataComputedOpsContext, matchIds: number[]): Match[] {
  return sortMatchesByDateDesc(
    matchIds.map((id) => appData._matches.get(id)).filter((match): match is Match => match !== undefined),
  );
}

export function getTeamPlayerIds(appData: AppDataComputedOpsContext, teamKey: string): Set<number> {
  const team = appData._teams.get(teamKey);
  if (!team) return new Set();

  // Start with ALL stored player IDs (both manual and non-manual)
  const storedPlayerIds = Array.from(team.players.entries())
    .filter(([, playerData]) => playerData.accountId > 0)
    .map(([playerId]) => playerId);
  const playerIds = new Set<number>(storedPlayerIds);

  // Add player IDs from league matches
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const matchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];

  matchIds.forEach((matchId) => {
    const matchInfo = leagueCache?.matches.get(matchId);
    if (!matchInfo) return;

    // Add players based on which side the team played
    if (matchInfo.radiantTeamId === team.teamId) {
      matchInfo.radiantPlayerIds.forEach((id) => playerIds.add(id));
    }
    if (matchInfo.direTeamId === team.teamId) {
      matchInfo.direPlayerIds.forEach((id) => playerIds.add(id));
    }
  });

  // Add players from manual matches
  const manualMatchIds = Array.from(team.matches.entries())
    .filter(([, matchData]) => matchData.isManual)
    .map(([matchId]) => matchId);

  manualMatchIds.forEach((matchId) => {
    const match = appData._matches.get(matchId);
    if (!match) return;

    const matchData = team.matches.get(matchId);
    if (!matchData?.side) return;

    // Add players from the team's side
    const teamPlayers = match.players[matchData.side];
    teamPlayers.forEach((player) => {
      if (player.accountId) {
        playerIds.add(player.accountId);
      }
    });
  });

  return playerIds;
}

/**
 * Get manual player IDs for a specific team
 * Extracts player IDs from team.players Map where isManual === true
 *
 * @param teamKey - The team key (teamId-leagueId)
 * @returns Set of manual player account IDs
 */
export function getTeamManualPlayerIds(appData: AppDataComputedOpsContext, teamKey: string): Set<number> {
  const team = appData._teams.get(teamKey);
  if (!team) return new Set();

  const manualPlayerIds = new Set<number>();

  // Extract player IDs from team.players Map where isManual === true
  for (const [, playerData] of team.players.entries()) {
    if (playerData.isManual && playerData.accountId > 0) {
      manualPlayerIds.add(playerData.accountId);
    }
  }

  return manualPlayerIds;
}

// ============================================================================
// PLAYER ID INPUT VALIDATION
// ============================================================================

export function validatePlayerIdInput(playerIdInput: string): PlayerIdInputValidationResult {
  return validatePlayerId(playerIdInput);
}

export function parsePlayerIdInput(playerIdInput: string): number {
  const validation = validatePlayerIdInput(playerIdInput);
  if (!validation.isValid) {
    throw new Error(validation.error ?? 'Invalid player ID');
  }
  return parseInt(playerIdInput.trim(), 10);
}

export function getAddManualPlayerDuplicateError(
  appData: AppDataComputedOpsContext,
  teamKey: string,
  playerIdInput: string,
): string | undefined {
  const validation = validatePlayerIdInput(playerIdInput);
  if (!validation.isValid) return undefined;

  const playerId = parseInt(playerIdInput.trim(), 10);
  const teamPlayerIds = getTeamPlayerIds(appData, teamKey);
  return teamPlayerIds.has(playerId) ? `Player ${playerId} is already present for the selected team` : undefined;
}

export function getEditManualPlayerDuplicateError(
  appData: AppDataComputedOpsContext,
  teamKey: string,
  playerIdInput: string,
  currentPlayerId: number,
): string | undefined {
  const validation = validatePlayerIdInput(playerIdInput);
  if (!validation.isValid) return undefined;

  const playerId = parseInt(playerIdInput.trim(), 10);
  if (playerId === currentPlayerId) return undefined;

  const teamPlayerIds = getTeamPlayerIds(appData, teamKey);
  return teamPlayerIds.has(playerId) ? `Player ${playerId} is already present for the selected team` : undefined;
}

function getTopHeroesForPlayer(player: Player, heroes: Map<number, Hero>, limit = 5): Hero[] {
  return player.heroStats
    .slice()
    .sort((a, b) => b.games - a.games)
    .slice(0, limit)
    .map((stat) => heroes.get(stat.heroId))
    .filter((hero): hero is Hero => hero !== undefined);
}

export function getPlayerListViewEntries(appData: AppDataComputedOpsContext, players: Player[]): PlayerListViewEntry[] {
  return players.map((player) => ({
    player,
    rank: processPlayerRank(player.profile.rank_tier ?? 0, player.profile.leaderboard_rank),
    topHeroes: getTopHeroesForPlayer(player, appData.heroes),
  }));
}

/**
 * Filter matches to exclude those with IDs in the hidden set
 *
 * @param matches - Array of matches to filter
 * @param hiddenMatchIds - Set of match IDs to exclude
 * @returns Filtered array of matches (does not modify original)
 */
export function filterMatchesByHiddenIds(
  appData: AppDataComputedOpsContext,
  matches: Match[],
  hiddenMatchIds: Set<number>,
): Match[] {
  if (hiddenMatchIds.size === 0) {
    return matches;
  }
  return matches.filter((match) => !hiddenMatchIds.has(match.id));
}

export function getMatchHistoryData(
  appData: AppDataComputedOpsContext,
  teamKey: string | null,
  filters: MatchFilters,
  hiddenMatchIds: Set<number>,
  selectedMatchId: number | null,
): MatchHistoryData {
  const team = teamKey ? appData._teams.get(teamKey) : undefined;
  const teamMatches = team?.matches ?? new Map<number, StoredMatchData>();
  const activeTeamMatches = teamKey ? getTeamMatchesWithPlaceholders(appData, teamKey) : [];

  const filterResult = computeTeamMatchFilters({
    matches: activeTeamMatches,
    teamMatches,
    filters,
    hiddenMatchIds,
  });

  const visibleMatches = filterMatchesByHiddenIds(appData, filterResult.filteredMatches, hiddenMatchIds);
  const unhiddenMatches = filterMatchesByHiddenIds(appData, activeTeamMatches, hiddenMatchIds);
  const selectedMatch = selectedMatchId != null ? (appData._matches.get(selectedMatchId) ?? null) : null;

  return {
    activeTeamMatches,
    teamMatches,
    filteredMatches: filterResult.filteredMatches,
    visibleMatches,
    unhiddenMatches,
    selectedMatch,
    filterStats: filterResult.filterStats,
  };
}

export function getTeamPlayersViewData(
  appData: AppDataComputedOpsContext,
  players: Player[],
  teamKey: string | null,
): TeamPlayersViewData {
  const hasActiveTeam = Boolean(teamKey);
  const teamPlayerIds = teamKey ? getTeamPlayerIds(appData, teamKey) : new Set<number>();
  const teamPlayers = filterPlayersByTeam(players, teamPlayerIds, hasActiveTeam);
  const sortedPlayers = sortPlayersByName(teamPlayers);
  const manualPlayerIds = teamKey ? getTeamManualPlayerIds(appData, teamKey) : new Set<number>();

  return {
    teamPlayerIds,
    teamPlayers,
    sortedPlayers,
    manualPlayerIds,
  };
}

/**
 * Get heroes for a match from the team's side (players or draft fallback).
 */
function getHeroesFromPlayers(match: Match, side: 'radiant' | 'dire'): Hero[] {
  const teamPlayers = match.players[side] || [];
  return teamPlayers.map((player) => player.hero).filter((hero): hero is Hero => hero != null);
}

function getHeroesFromDraft(match: Match, side: 'radiant' | 'dire'): Hero[] {
  if (!match.draft) return [];
  const picks = side === 'radiant' ? match.draft.radiantPicks : match.draft.direPicks;
  return (picks?.map((pick) => pick.hero).slice(0, 5) ?? []).filter((hero): hero is Hero => hero != null);
}

function resolveStoredHero(storedHero: StoredHero, heroesMap: Map<number, Hero>): Hero {
  const hero = heroesMap.get(storedHero.id);
  if (hero) {
    return hero;
  }

  return {
    id: storedHero.id,
    name: storedHero.name,
    localizedName: storedHero.localizedName,
    imageUrl: storedHero.imageUrl,
  };
}

function getStoredHeroes(storedHeroes: StoredHero[] | undefined, heroesMap: Map<number, Hero>): Hero[] {
  if (!storedHeroes || storedHeroes.length === 0) return [];
  return storedHeroes.map((storedHero) => resolveStoredHero(storedHero, heroesMap));
}

export function getMatchHeroesForTeam(appData: AppDataComputedOpsContext, matchId: number, teamKey: string): Hero[] {
  const match = appData._matches.get(matchId);
  const team = appData._teams.get(teamKey);
  if (!match || !team) return [];

  const side = team.matches.get(matchId)?.side;
  if (!side) return [];

  const heroesFromPlayers = getHeroesFromPlayers(match, side);
  if (heroesFromPlayers.length > 0) return heroesFromPlayers;

  return getHeroesFromDraft(match, side);
}

/**
 * Get heroes for a match with stored-hero fallback when no match data exists.
 */
export function getMatchHeroesForTeamWithStored(
  appData: AppDataComputedOpsContext,
  matchId: number,
  teamKey: string,
  storedHeroes: StoredHero[] | undefined,
): Hero[] {
  const matchHeroes = getMatchHeroesForTeam(appData, matchId, teamKey);
  if (matchHeroes.length > 0) return matchHeroes;
  return getStoredHeroes(storedHeroes, appData.heroes);
}

/**
 * Get the pick order label for a match from the team's perspective.
 */
export function getMatchPickOrderLabel(
  appData: AppDataComputedOpsContext,
  matchId: number,
  teamKey: string,
): string | null {
  const match = appData._matches.get(matchId);
  const team = appData._teams.get(teamKey);
  if (!match?.pickOrder || !team) return null;

  const side = team.matches.get(matchId)?.side;
  if (!side) return null;

  const pickOrder = match.pickOrder[side];
  if (pickOrder === 'first') return 'First Pick';
  if (pickOrder === 'second') return 'Second Pick';
  return null;
}

/**
 * Get the match result label from the team's perspective.
 */
export function getMatchResultLabel(appData: AppDataComputedOpsContext, matchId: number, teamKey: string): string {
  const team = appData._teams.get(teamKey);
  const teamMatch = team?.matches.get(matchId);
  if (teamMatch?.result === 'won') return 'Victory';
  if (teamMatch?.result === 'lost') return 'Defeat';
  return 'Unknown';
}

/**
 * Get match result badge data for a team.
 */
export function getMatchResultBadgeData(
  appData: AppDataComputedOpsContext,
  matchId: number,
  teamKey: string,
): MatchResultBadgeData {
  const team = appData._teams.get(teamKey);
  const teamMatch = team?.matches.get(matchId);
  return {
    teamWon: teamMatch?.result === 'won',
    teamSide: teamMatch?.side,
  };
}

/**
 * Get manual match metadata for a match on a team (isManual, side).
 * Side is null when no stored metadata exists.
 */
export function getMatchManualMetadata(
  appData: AppDataComputedOpsContext,
  matchId: number,
  teamKey: string,
): { isManual: boolean; side: 'radiant' | 'dire' | null } {
  const team = appData._teams.get(teamKey);
  if (!team) return { isManual: false, side: null };

  const matchData = team.matches.get(matchId);
  return {
    isManual: matchData?.isManual ?? false,
    side: matchData?.side ?? null,
  };
}

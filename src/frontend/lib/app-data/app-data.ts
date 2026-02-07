import type React from 'react';

import * as ComputedOps from '@/frontend/lib/app-data/app-data-computed-ops';
import type {
  MatchHistoryData,
  PlayerListViewEntry,
  TeamPlayersViewData,
} from '@/frontend/lib/app-data/app-data-computed-ops';
import {
  filterMatches as filterMatchesOp,
  getTeamHeroSummaryForMatches as getTeamHeroSummaryForMatchesOp,
} from '@/frontend/lib/app-data/app-data-crud-ops';
import * as DataOps from '@/frontend/lib/app-data/app-data-data-ops';
import { computeAllHeroPerformanceStats } from '@/frontend/lib/app-data/app-data-hero-performance-ops';
import {
  filterHeroSummaryByHighPerformers,
  sortHeroSummaryEntries,
  type HeroSummarySortDirection,
  type HeroSummarySortField,
} from '@/frontend/lib/app-data/app-data-hero-summary-ops';
import * as InitializationOps from '@/frontend/lib/app-data/app-data-initialization-ops';
import * as LoadingOps from '@/frontend/lib/app-data/app-data-loading-ops';
import {
  getDraftPhasesFiltered,
  getHeroesPlayedOptionsForTeam,
  getOpponentNameOptionsForTeam,
  getMatchPlayerKda,
  getPlayersSortedByDraft,
  type DraftFilter,
  type FilterOption,
} from '@/frontend/lib/app-data/app-data-match-derivations';
import * as MatchOps from '@/frontend/lib/app-data/app-data-match-ops';
import { updateTeamMatchParticipation as updateTeamMatchParticipationOp } from '@/frontend/lib/app-data/app-data-match-participation-ops';
import { updateTeamPlayersMetadata as updateTeamPlayersMetadataOp } from '@/frontend/lib/app-data/app-data-player-metadata-ops';
import * as PlayerOps from '@/frontend/lib/app-data/app-data-player-ops';
import * as StatisticsOps from '@/frontend/lib/app-data/app-data-statistics-ops';
import type {
  PlayerRecentHeroCustomRange,
  PlayerRecentHeroDateRange,
  PlayerRecentHeroRowsResult,
  PlayerRecentHeroSortDirection,
  PlayerRecentHeroSortKey,
  PlayerTopHeroSummaryRow,
} from '@/frontend/lib/app-data/app-data-statistics-ops';
import * as StorageOps from '@/frontend/lib/app-data/app-data-storage-ops';
import type { LoadedStorageResult } from '@/frontend/lib/app-data/app-data-storage-ops';
import {
  type AppDataState,
  type DraftPhase,
  GLOBAL_TEAM_KEY,
  type Hero,
  type HeroSummaryEntry,
  type Item,
  type League,
  type LeagueMatchesCache,
  type Match,
  type MatchFilters,
  type MatchFiltersResult,
  type Player,
  type PlayerMatchData,
  type Team,
  type TeamDisplayData,
  type TeamHeroSummary,
} from '@/frontend/lib/app-data/app-data-types';
import * as UIOps from '@/frontend/lib/app-data/app-data-ui-ops';
import { processMatchData } from '@/frontend/lib/match/match-loader';
import {
  computeChartBounds,
  createMatchPerformanceTimelineChartData,
  type ChartBounds,
  type ChartDataPoint,
} from '@/frontend/lib/match/match-performance-timeline';
import type {
  DateRangeSelection,
  HeroStats,
  PlayerStats,
  TeamPlayerStats,
} from '@/frontend/lib/player/player-statistics-calculator';
import type { StoredHero, StoredMatchData } from '@/frontend/lib/storage/storage-manager';
import { parseMatch as apiParseMatch } from '@/frontend/matches/api/matches';
import { validateTeamForm } from '@/utils/validation/validation';

export class AppData {
  _teams: Map<string, Team> = new Map();
  _matches: Map<number, Match> = new Map();
  _teamsRef: Map<string, Team> = new Map();
  _matchesRef: Map<number, Match> = new Map();
  _players: Map<number, Player> = new Map();
  _playersRef: Map<number, Player> = new Map();
  get teams(): Map<string, Team> {
    return this._teamsRef;
  }
  get matches(): Map<number, Match> {
    return this._matchesRef;
  }
  get players(): Map<number, Player> {
    return this._playersRef;
  }
  heroes: Map<number, Hero> = new Map();
  items: Map<number, Item> = new Map();
  leagues: Map<number, League> = new Map();
  leagueMatchesCache: Map<number, LeagueMatchesCache> = new Map();
  state: AppDataState = {
    selectedTeamId: GLOBAL_TEAM_KEY,
    selectedTeamIdParsed: { teamId: 0, leagueId: 0 }, // 0-0 represents global team
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  };

  setTeamsState?: React.Dispatch<React.SetStateAction<Map<string, Team>>>;
  setMatchesState?: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  setPlayersState?: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
  setTeamsStateFn = (fn: React.Dispatch<React.SetStateAction<Map<string, Team>>>): void =>
    UIOps.setTeamsStateFn(this, fn);
  setMatchesStateFn = (fn: React.Dispatch<React.SetStateAction<Map<number, Match>>>): void =>
    UIOps.setMatchesStateFn(this, fn);
  setPlayersStateFn = (fn: React.Dispatch<React.SetStateAction<Map<number, Player>>>): void =>
    UIOps.setPlayersStateFn(this, fn);
  updateTeamsRef = (): void => UIOps.updateTeamsRef(this);
  updateMatchesRef = (): void => UIOps.updateMatchesRef(this);
  updatePlayersRef = (): void => UIOps.updatePlayersRef(this);
  createGlobalTeam = (): Team => StorageOps.createGlobalTeam();
  private ensureGlobalTeam(): void {
    StorageOps.ensureGlobalTeam(this);
  }
  updateTeamsMap = (teamId: string, team: Team): void => {
    this._teams.set(teamId, team);
    this.updateTeamsRef();
  };
  deleteFromTeamsMap = (teamId: string): void => {
    this._teams.delete(teamId);
    this.updateTeamsRef();
  };
  addTeam = (team: Omit<Team, 'createdAt' | 'updatedAt' | 'matches' | 'players' | 'highPerformingHeroes'>): void =>
    DataOps.addTeam(this, team);
  removeTeam = (teamId: string): void => {
    const wasSelected = this.state.selectedTeamId === teamId;

    if (wasSelected) {
      const fallbackTeamId =
        teamId !== GLOBAL_TEAM_KEY && this._teams.has(GLOBAL_TEAM_KEY)
          ? GLOBAL_TEAM_KEY
          : Array.from(this._teams.keys()).find((id) => id !== teamId);

      if (fallbackTeamId) {
        this.setSelectedTeam(fallbackTeamId);
      } else if (teamId === GLOBAL_TEAM_KEY) {
        return;
      } else {
        this.ensureGlobalTeam();
        this.setSelectedTeam(GLOBAL_TEAM_KEY);
      }
    }

    DataOps.removeTeam(this, teamId);
    this.saveToStorage();
  };
  updateTeam = (teamId: string, updates: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): void =>
    DataOps.updateTeam(this, teamId, updates);
  getTeam = (teamId: string): Team | undefined => DataOps.getTeam(this, teamId);
  getTeams = (): Team[] => DataOps.getTeams(this);
  getTeamDataForDisplay = (teamId: string): TeamDisplayData | undefined => DataOps.getTeamDataForDisplay(this, teamId);
  getAllTeamsForDisplay = (): TeamDisplayData[] => DataOps.getAllTeamsForDisplay(this);
  getAllTeamsForDisplayOrdered = (): TeamDisplayData[] => DataOps.getAllTeamsForDisplayOrdered(this);
  validateTeamFormInputs = (teamIdInput: string, leagueIdInput: string): ReturnType<typeof validateTeamForm> =>
    validateTeamForm(teamIdInput, leagueIdInput);
  parseTeamIdsFromInputs(teamIdInput: string, leagueIdInput: string): { teamId: number; leagueId: number } {
    const validation = validateTeamForm(teamIdInput, leagueIdInput);
    if (!validation.isValid) {
      const messages = [validation.errors.teamId, validation.errors.leagueId].filter((message): message is string =>
        Boolean(message),
      );
      const message = messages.length > 0 ? messages.join(' ') : 'Invalid team form inputs';
      throw new Error(message);
    }

    return {
      teamId: parseInt(teamIdInput.trim(), 10),
      leagueId: parseInt(leagueIdInput.trim(), 10),
    };
  }
  async addTeamFromInputs(teamIdInput: string, leagueIdInput: string): Promise<void> {
    const { teamId, leagueId } = this.parseTeamIdsFromInputs(teamIdInput, leagueIdInput);
    await this.loadTeam(teamId, leagueId);
  }
  async editTeamFromInputs(
    currentTeamIdInput: string,
    currentLeagueIdInput: string,
    newTeamIdInput: string,
    newLeagueIdInput: string,
  ): Promise<{ didChange: boolean }> {
    const current = this.parseTeamIdsFromInputs(currentTeamIdInput, currentLeagueIdInput);
    const next = this.parseTeamIdsFromInputs(newTeamIdInput, newLeagueIdInput);
    const currentKey = `${current.teamId}-${current.leagueId}`;
    const nextKey = `${next.teamId}-${next.leagueId}`;

    if (currentKey === nextKey) {
      return { didChange: false };
    }

    if (this.state.selectedTeamId === currentKey) {
      this.setSelectedTeam(GLOBAL_TEAM_KEY);
    }

    this.removeTeam(currentKey);

    try {
      await this.loadTeam(next.teamId, next.leagueId);
      return { didChange: true };
    } catch (error) {
      this.saveToStorage();
      throw error;
    }
  }
  removeTeamByIds = (teamId: number, leagueId: number): void => {
    const teamKey = `${teamId}-${leagueId}`;
    this.removeTeam(teamKey);
    this.saveToStorage();
  };
  setSelectedTeamByIds = (teamId: number, leagueId: number): void => {
    const teamKey = `${teamId}-${leagueId}`;
    this.setSelectedTeam(teamKey);
  };
  addMatch = (match: Match): void => DataOps.addMatch(this, match);
  removeMatch = (matchId: number): void => DataOps.removeMatch(this, matchId);
  getMatch = (matchId: number): Match | undefined => DataOps.getMatch(this, matchId);
  getMatches = (): Match[] => DataOps.getMatches(this);
  addPlayer = (player: Player): void => DataOps.addPlayer(this, player);
  removePlayer = (accountId: number): void => DataOps.removePlayer(this, accountId);
  getPlayer = (accountId: number): Player | undefined => DataOps.getPlayer(this, accountId);
  getPlayers = (): Player[] => DataOps.getPlayers(this);
  hideMatch = (teamId: string, matchId: number): void => DataOps.hideMatch(this, teamId, matchId);
  unhideMatch = (teamId: string, matchId: number): void => DataOps.unhideMatch(this, teamId, matchId);
  getHiddenMatches = (teamId: string): Match[] => DataOps.getHiddenMatches(this, teamId);
  loadPlayer = async (accountId: number): Promise<Player | null> => InitializationOps.loadPlayer(this, accountId);
  refreshPlayer = async (accountId: number): Promise<Player | null> => InitializationOps.refreshPlayer(this, accountId);
  loadPlayersFromMatchForTeam = async (match: Match, side: 'radiant' | 'dire'): Promise<void> =>
    LoadingOps.loadPlayersFromMatchForTeam(this, match, side);
  loadPlayersForTeamMatches = async (teamKey: string, matchIds: number[]): Promise<void> =>
    LoadingOps.loadPlayersForTeamMatches(this, teamKey, matchIds);
  setSelectedTeam = (teamId: string): void => UIOps.setSelectedTeam(this, teamId);
  setSelectedMatch = (matchId: number | null): void => UIOps.setSelectedMatch(this, matchId);
  setSelectedPlayer = (accountId: number | null): void => UIOps.setSelectedPlayer(this, accountId);
  getTeamMatches = (teamKey: string): Match[] => ComputedOps.getTeamMatches(this, teamKey);
  getTeamMatchesWithPlaceholders = (teamKey: string): Match[] =>
    ComputedOps.getTeamMatchesWithPlaceholders(this, teamKey);
  getMatchesByIds = (matchIds: number[]): Match[] => ComputedOps.getMatchesByIds(this, matchIds);
  getTeamPlayerIds = (teamKey: string): Set<number> => ComputedOps.getTeamPlayerIds(this, teamKey);
  getTeamManualPlayerIds = (teamKey: string): Set<number> => ComputedOps.getTeamManualPlayerIds(this, teamKey);
  loadTeamMatches = async (teamKey: string, force = false): Promise<void> =>
    LoadingOps.loadTeamMatches(this, teamKey, force);

  updateTeamPlayersMetadata = (teamKey: string, options?: { skipSave?: boolean }): void =>
    updateTeamPlayersMetadataOp(this, teamKey, options);
  updateTeamMatchParticipation = (teamKey: string, matchIds: number[]): void =>
    updateTeamMatchParticipationOp(this, teamKey, matchIds);
  loadMatch = async (matchId: number): Promise<Match | null> => InitializationOps.loadMatch(this, matchId);
  refreshMatch = async (matchId: number): Promise<Match | null> => InitializationOps.refreshMatch(this, matchId);
  addManualMatchToTeam = async (
    matchId: number,
    teamKey: string,
    userSelectedSide: 'radiant' | 'dire',
  ): Promise<Match | null> => {
    return MatchOps.addManualMatchToTeam(this, matchId, teamKey, userSelectedSide);
  };
  removeManualMatchFromTeam = (matchId: number, teamKey: string): void =>
    MatchOps.removeManualMatchFromTeam(this, matchId, teamKey);
  editManualMatchToTeam = async (
    oldMatchId: number,
    newMatchId: number,
    teamKey: string,
    userSelectedSide: 'radiant' | 'dire',
  ): Promise<Match | null> => {
    return MatchOps.editManualMatchToTeam(this, oldMatchId, newMatchId, teamKey, userSelectedSide);
  };
  teamHasMatch(matchId: number, teamKey: string): boolean {
    const team = this._teams.get(teamKey);
    if (!team) return false;

    // Check manual matches first
    const matchData = team.matches.get(matchId);
    if (matchData?.isManual) return true;

    // Check league matches cache
    const leagueCache = this.leagueMatchesCache.get(team.leagueId);
    const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
    return leagueMatchIds.includes(matchId);
  }
  getTeamMatchesMetadata = (teamKey: string): Map<number, StoredMatchData> => {
    const team = this._teams.get(teamKey);
    return team?.matches || new Map();
  };
  addManualPlayerToTeam = async (playerId: number, teamKey: string): Promise<Player | null> =>
    PlayerOps.addManualPlayerToTeam(this, playerId, teamKey);
  removeManualPlayerFromTeam = (playerId: number, teamKey: string): void =>
    PlayerOps.removeManualPlayerFromTeam(this, playerId, teamKey);
  editManualPlayerToTeam = async (oldPlayerId: number, newPlayerId: number, teamKey: string): Promise<Player | null> =>
    PlayerOps.editManualPlayerToTeam(this, oldPlayerId, newPlayerId, teamKey);
  teamHasPlayer(playerId: number, teamKey: string): boolean {
    const playerIds = this.getTeamPlayerIds(teamKey);
    return playerIds.has(playerId);
  }
  loadAllManualPlayers = async (): Promise<void> => LoadingOps.loadAllManualPlayers(this);
  loadAllManualMatches = async (): Promise<void> => LoadingOps.loadAllManualMatches(this);
  private async ensureReferenceDataLoaded(): Promise<void> {
    const tasks: Array<Promise<void>> = [];
    if (this.heroes.size === 0) tasks.push(this.loadHeroesData());
    if (this.items.size === 0) tasks.push(this.loadItemsData());
    if (this.leagues.size === 0) tasks.push(this.loadLeaguesData());
    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  loadHeroesData = async (): Promise<void> => InitializationOps.loadHeroesData(this);
  loadItemsData = async (): Promise<void> => InitializationOps.loadItemsData(this);
  loadLeaguesData = async (): Promise<void> => InitializationOps.loadLeaguesData(this);
  loadTeam = async (teamId: number, leagueId: number): Promise<void> => {
    await this.ensureReferenceDataLoaded();
    return InitializationOps.loadTeam(this, teamId, leagueId);
  };
  refreshTeam = async (teamId: number, leagueId: number): Promise<void> => {
    await this.ensureReferenceDataLoaded();
    return InitializationOps.refreshTeam(this, teamId, leagueId);
  };
  fetchTeamAndLeagueData = async (
    teamId: number,
    leagueId: number,
    fetchTeam = false,
    forceLeague = false,
  ): Promise<{ teamData: { name?: string }; teamError?: string; leagueError?: string }> =>
    LoadingOps.fetchTeamAndLeagueData(this, teamId, leagueId, fetchTeam, forceLeague);

  saveToStorage = (): void => StorageOps.saveToStorage(this);
  loadFromStorage = async (): Promise<LoadedStorageResult> => StorageOps.loadFromStorage(this);
  loadFromSharePayload = async (payload: {
    teams: Record<string, unknown>;
    activeTeam?: { teamId: number; leagueId: number } | null;
  }): Promise<LoadedStorageResult> => StorageOps.loadFromSharePayload(this, payload);
  refreshAllTeams = async (): Promise<void> => InitializationOps.refreshAllTeams(this);
  getPlayerStats = (playerId: number): PlayerStats => StatisticsOps.getPlayerStats(this, playerId);
  getPlayerHeroStats = (playerId: number): Map<number, HeroStats> => StatisticsOps.getPlayerHeroStats(this, playerId);
  getPlayerTopHeroesSummary = (playerId: number, limit = 5): PlayerTopHeroSummaryRow[] =>
    StatisticsOps.getPlayerTopHeroesSummary(this, playerId, limit);
  getPlayerHeroStatsForMatches = (playerId: number, matches: Match[]): HeroStats[] =>
    StatisticsOps.getPlayerHeroStatsForMatches(this, playerId, matches);
  getTeamPlayerStats = (playerId: number, teamKey: string): TeamPlayerStats =>
    StatisticsOps.getTeamPlayerStats(this, playerId, teamKey);
  getPlayerParticipatedMatches = (playerId: number, teamKey: string): Match[] =>
    StatisticsOps.getPlayerParticipatedMatches(this, playerId, teamKey);
  getTeamRoleStats = (playerId: number, teamKey: string): StatisticsOps.TeamRoleStats[] =>
    StatisticsOps.getTeamRoleStats(this, playerId, teamKey);
  getTeamPlayerDetailStats = (playerId: number, teamKey: string): StatisticsOps.TeamPlayerDetailStats =>
    StatisticsOps.getTeamPlayerDetailStats(this, playerId, teamKey);
  filterPlayerMatchesByDateRange = (playerId: number, dateRange: DateRangeSelection): Match[] =>
    StatisticsOps.filterPlayerMatchesByDateRange(this, playerId, dateRange);
  getPlayerRecentHeroRows(
    playerId: number,
    dateRange: PlayerRecentHeroDateRange,
    customRange: PlayerRecentHeroCustomRange,
    sortKey: PlayerRecentHeroSortKey,
    sortDirection: PlayerRecentHeroSortDirection,
  ): PlayerRecentHeroRowsResult {
    return StatisticsOps.getPlayerRecentHeroRows(this, playerId, dateRange, customRange, sortKey, sortDirection);
  }
  getTeamHeroSummaryForMatches = (teamKey: string, matches: Match[]): TeamHeroSummary =>
    getTeamHeroSummaryForMatchesOp(this, teamKey, matches);
  filterMatches(
    matches: Match[],
    teamKey: string,
    filters: MatchFilters,
    hiddenMatchIds: Set<number> = new Set(),
  ): MatchFiltersResult {
    return filterMatchesOp(this, matches, teamKey, filters, hiddenMatchIds);
  }
  sortPlayersByName = (players: Player[]): Player[] => DataOps.sortPlayersByName(this, players);
  filterPlayersByTeam = (players: Player[], teamKey: string | null | undefined): Player[] =>
    DataOps.filterPlayersByTeam(this, players, teamKey);
  sortHeroSummaryEntries = (
    heroes: HeroSummaryEntry[],
    sortField: HeroSummarySortField,
    sortDirection: HeroSummarySortDirection,
  ): HeroSummaryEntry[] => sortHeroSummaryEntries(heroes, sortField, sortDirection);
  filterHeroSummaryByHighPerformers = (
    heroes: HeroSummaryEntry[],
    highPerformingHeroIds: Set<string>,
  ): HeroSummaryEntry[] => filterHeroSummaryByHighPerformers(heroes, highPerformingHeroIds);
  filterMatchesByHiddenIds = (matches: Match[], hiddenMatchIds: Set<number>): Match[] =>
    ComputedOps.filterMatchesByHiddenIds(this, matches, hiddenMatchIds);
  getMatchHistoryData(
    teamKey: string | null,
    filters: MatchFilters,
    hiddenMatchIds: Set<number>,
    selectedMatchId: number | null,
  ): MatchHistoryData {
    return ComputedOps.getMatchHistoryData(this, teamKey, filters, hiddenMatchIds, selectedMatchId);
  }
  getTeamPlayersViewData = (players: Player[], teamKey: string | null): TeamPlayersViewData =>
    ComputedOps.getTeamPlayersViewData(this, players, teamKey);
  getPlayerListViewEntries = (players: Player[]): PlayerListViewEntry[] =>
    ComputedOps.getPlayerListViewEntries(this, players);
  validatePlayerIdInput = (playerIdInput: string): ComputedOps.PlayerIdInputValidationResult =>
    ComputedOps.validatePlayerIdInput(playerIdInput);
  parsePlayerIdInput = (playerIdInput: string): number => ComputedOps.parsePlayerIdInput(playerIdInput);
  getAddManualPlayerDuplicateError = (teamKey: string, playerIdInput: string): string | undefined =>
    ComputedOps.getAddManualPlayerDuplicateError(this, teamKey, playerIdInput);
  getEditManualPlayerDuplicateError = (
    teamKey: string,
    playerIdInput: string,
    currentPlayerId: number,
  ): string | undefined => ComputedOps.getEditManualPlayerDuplicateError(this, teamKey, playerIdInput, currentPlayerId);
  parseMatchAndUpdate = async (matchId: number): Promise<void> => {
    const parsed = await apiParseMatch(matchId);
    const processed = processMatchData(parsed, this.heroes, this.items);
    this.addMatch(processed);
  };
  getMatchPerformanceTimelineChartData = (matchId: number): ChartDataPoint[] | null =>
    createMatchPerformanceTimelineChartData(this.getMatch(matchId));
  getMatchPerformanceTimelineBounds = (chartData: ChartDataPoint[]): ChartBounds => computeChartBounds(chartData);
  getHighPerformingHeroIdsForTeam(teamKey: string, hiddenMatchIds: Set<number>): Set<string> {
    const matches = this.getTeamMatchesWithPlaceholders(teamKey);
    const teamMatches = this.getTeamMatchesMetadata(teamKey);
    const stats = computeAllHeroPerformanceStats(matches, teamMatches, hiddenMatchIds);
    const ids = new Set<string>();
    stats.forEach((s, heroId) => {
      if (s.isHighPerforming) ids.add(String(heroId));
    });
    return ids;
  }
  isHighPerformingHero = (heroId: number, teamKey: string, hiddenMatchIds: Set<number>): boolean =>
    this.getHighPerformingHeroIdsForTeam(teamKey, hiddenMatchIds).has(String(heroId));
  getHeroesPlayedOptions = (teamKey: string): FilterOption[] => {
    const matches = this.getTeamMatchesWithPlaceholders(teamKey);
    const teamMatches = this.getTeamMatchesMetadata(teamKey);
    return getHeroesPlayedOptionsForTeam(matches, teamMatches);
  };
  getOpponentNameOptions = (teamKey: string): FilterOption[] =>
    getOpponentNameOptionsForTeam(this.getTeamMatchesMetadata(teamKey));
  getMatchHeroesForTeam = (matchId: number, teamKey: string): Hero[] =>
    ComputedOps.getMatchHeroesForTeam(this, matchId, teamKey);
  getMatchHeroesForTeamWithStored = (
    matchId: number,
    teamKey: string,
    storedHeroes: StoredHero[] | undefined,
  ): Hero[] => ComputedOps.getMatchHeroesForTeamWithStored(this, matchId, teamKey, storedHeroes);
  getMatchPickOrderLabel = (matchId: number, teamKey: string): string | null =>
    ComputedOps.getMatchPickOrderLabel(this, matchId, teamKey);
  getMatchResultLabel = (matchId: number, teamKey: string): string =>
    ComputedOps.getMatchResultLabel(this, matchId, teamKey);
  getMatchResultBadgeData = (matchId: number, teamKey: string): ComputedOps.MatchResultBadgeData =>
    ComputedOps.getMatchResultBadgeData(this, matchId, teamKey);
  getMatchManualMetadata = (matchId: number, teamKey: string): { isManual: boolean; side: 'radiant' | 'dire' | null } =>
    ComputedOps.getMatchManualMetadata(this, matchId, teamKey);
  getDraftPhases = (matchId: number, filter: DraftFilter): DraftPhase[] => {
    const match = this.getMatch(matchId);
    return getDraftPhasesFiltered(match?.processedDraft, filter);
  };
  getPlayersSortedByDraft = (matchId: number, side: 'radiant' | 'dire'): PlayerMatchData[] =>
    getPlayersSortedByDraft(this.getMatch(matchId), side);
  getMatchPlayerKda = (player: PlayerMatchData | undefined): number => getMatchPlayerKda(player);
  getEditManualMatchDuplicateError(teamKey: string, newMatchId: number, currentMatchId: number): string | undefined {
    if (!Number.isFinite(newMatchId) || newMatchId === currentMatchId) return undefined;
    const team = this.getTeam(teamKey);
    if (!team) return undefined;
    const alreadyHasMatch = team.matches.has(newMatchId);
    return alreadyHasMatch ? `Match ${newMatchId} is already present for the selected team` : undefined;
  }
}

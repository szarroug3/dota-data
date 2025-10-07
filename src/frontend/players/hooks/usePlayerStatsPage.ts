import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { Player } from '@/frontend/lib/app-data-types';
import type { StoredPlayerData } from '@/frontend/lib/storage-manager';
import type { PlayerDetailsPanelMode } from '@/frontend/players/components/stateless/details/PlayerDetailsPanel';
import type { PlayerListViewMode } from '@/frontend/players/components/stateless/PlayerListView';
import type { ResizablePlayerLayoutRef } from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import type { PlayerDetailedStats } from '@/utils/player-statistics';

export interface PlayerStats {
  player: Player;
  playerId: string;
  playerName: string;
  totalMatches: number;
  winRate: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  mostPlayedHero: {
    heroId: string;
    heroName: string;
    matches: number;
    winRate: number;
  };
  bestPerformanceHero: {
    heroId: string;
    heroName: string;
    matches: number;
    winRate: number;
    averageKDA: number;
  };
  recentPerformance: {
    trend: 'improving' | 'declining' | 'stable';
    lastFiveMatches: { win: boolean; kda: number }[];
  };
  detailedStats?: PlayerDetailedStats;
}

export function usePlayerData() {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  const teams = appData.teams;
  const playersMap = appData.players;

  const playersArray = useMemo(() => {
    const team = teams.get(selectedTeamId) ?? appData.getTeam(selectedTeamId);

    if (!team) {
      return Array.from(playersMap.values());
    }

    // Get player IDs for the team (from manual players, league matches, and manual matches)
    const teamPlayerIds = appData.getTeamPlayerIds(selectedTeamId);

    // Create array of players, using full data if available or creating placeholders
    const players: Player[] = [];

    for (const playerId of teamPlayerIds) {
      const fullPlayer = appData.getPlayer(playerId);
      if (fullPlayer) {
        // Use full player data if available
        players.push(fullPlayer);
      } else {
        // Create placeholder player from team's stored player data
        const storedPlayerData = team.players.get(playerId);
        if (storedPlayerData && storedPlayerData.accountId > 0) {
          const placeholder = createPlaceholderPlayerFromStored(storedPlayerData);
          players.push(placeholder);
        }
      }
    }

    return players;
    // Dependencies:
    // - selectedTeamId: selected team changes should recompute the list
    // - teams: getTeamPlayerIds reads team metadata (manual players + matches)
    // - playersMap: ensures re-run when hydrated player data arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, selectedTeamId, teams, playersMap]);

  const refreshPlayer = useCallback(
    async (accountId: number) => {
      return appData.refreshPlayer(accountId);
    },
    [appData],
  );

  const addPlayer = useCallback(
    async (accountId: number) => {
      return appData.loadPlayer(accountId);
    },
    [appData],
  );

  return {
    players: playersArray,
    isLoading: false, // TODO: Track loading state in AppData
    error: null as null,
    selectedTeamId: appData.state.selectedTeamIdParsed,
    refreshPlayer,
    addPlayer,
  };
}

export function usePlayerSelection() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const appData = useAppData();

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return appData.players.get(selectedPlayerId) || null;
  }, [selectedPlayerId, appData.players]);

  const selectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
  };

  return {
    selectedPlayer,
    selectedPlayerId,
    selectPlayer,
  };
}

export function useHiddenPlayers(filteredPlayers: Player[]) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Player[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  const handleHidePlayer = useCallback(
    (id: number) => {
      setHiddenPlayers((prev) => {
        const playerToHide = filteredPlayers.find((p: Player) => p.accountId === id);
        if (!playerToHide) return prev;
        return [...prev, playerToHide];
      });
    },
    [filteredPlayers],
  );

  const handleUnhidePlayer = useCallback((id: number) => {
    setHiddenPlayers((prev) => prev.filter((p: Player) => p.accountId !== id));
  }, []);

  const visiblePlayers = useMemo(() => {
    const hiddenIds = new Set(hiddenPlayers.map((p: Player) => p.accountId));
    return filteredPlayers.filter((p: Player) => !hiddenIds.has(p.accountId));
  }, [filteredPlayers, hiddenPlayers]);

  return {
    hiddenPlayers,
    showHiddenModal,
    setShowHiddenModal,
    handleHidePlayer,
    handleUnhidePlayer,
    visiblePlayers,
  };
}

export function usePlayerViewModes() {
  const { config, updateConfig } = useConfigContext();

  const [viewMode, setViewModeState] = useState<PlayerListViewMode>(config.preferredPlayerlistView ?? 'list');
  const [playerDetailsViewMode, setPlayerDetailsViewMode] = useState<PlayerDetailsPanelMode>('summary');

  useEffect(() => {
    setViewModeState(config.preferredPlayerlistView ?? 'list');
  }, [config.preferredPlayerlistView]);

  const setViewMode = useCallback(
    (mode: PlayerListViewMode) => {
      setViewModeState(mode);
      updateConfig({ preferredPlayerlistView: mode }).catch((error) => {
        console.error('Failed to save player list view mode preference:', error);
      });
    },
    [updateConfig],
  );

  return {
    viewMode,
    setViewMode,
    playerDetailsViewMode,
    setPlayerDetailsViewMode,
  };
}

export function useSortedPlayers(players: Player[]) {
  return useMemo(() => {
    return [...players].sort((a, b) => {
      const aName = a.profile.personaname.toLowerCase();
      const bName = b.profile.personaname.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [players]);
}

// Filter helpers to scope players to the active team
export function useTeamPlayerIds(): Set<number> {
  const appData = useAppData();
  const teams = appData.teams;
  const matches = appData.matches;
  const selectedTeamId = appData.state.selectedTeamId;

  return useMemo(() => {
    if (!selectedTeamId) return new Set<number>();

    // Use AppData to get player IDs for the team
    return appData.getTeamPlayerIds(selectedTeamId);
    // teams and matches are required despite linter warning because getTeamPlayerIds() internally reads:
    // - team.players Map (for manual players) and team.matches Map (for manual matches) from the teams Map
    // - match.players data from the matches Map (for extracting player IDs from manual matches)
    // Without these deps, the player list won't update when matches/teams change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, selectedTeamId, teams, matches]);
}

export function useFilteredTeamPlayers(
  players: Player[],
  teamPlayerIds: Set<number>,
  hasActiveTeam: boolean,
): Player[] {
  return useMemo(() => {
    if (!hasActiveTeam) {
      return players;
    }

    if (teamPlayerIds.size === 0) return [] as Player[];
    return players.filter((p) => teamPlayerIds.has(p.accountId));
  }, [players, teamPlayerIds, hasActiveTeam]);
}

export function useWaitForPlayerReadySource(players: Player[]) {
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const waitForPlayerReady = useCallback(async (playerId: number, timeoutMs = 3000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const player = playersRef.current.find((p) => p.accountId === playerId);
      if (player && !player.error) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return false;
  }, []);

  return waitForPlayerReady;
}

export function usePlayerListActions(deps: {
  refreshPlayer: (id: number) => Promise<void | object | null>;
  resizableLayoutRef: MutableRefObject<ResizablePlayerLayoutRef | null>;
  setShowAddPlayerSheet: SetStateAction<boolean> | Dispatch<SetStateAction<boolean>>;
}) {
  const { refreshPlayer, resizableLayoutRef, setShowAddPlayerSheet } = deps as {
    refreshPlayer: (id: number) => Promise<void | object | null>;
    resizableLayoutRef: MutableRefObject<ResizablePlayerLayoutRef | null>;
    setShowAddPlayerSheet: Dispatch<SetStateAction<boolean>>;
  };

  const handleRefreshPlayer = useCallback(
    async (playerId: number) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        await refreshPlayer(playerId);
      } catch (error) {
        console.error('Error in handleRefreshPlayer:', error);
      }
    },
    [refreshPlayer],
  );

  const handleOpenAddPlayerSheet = useCallback(() => {
    setShowAddPlayerSheet(true);
  }, [setShowAddPlayerSheet]);

  const handleScrollToPlayer = useCallback(
    (playerId: number) => {
      resizableLayoutRef.current?.scrollToPlayer(playerId);
    },
    [resizableLayoutRef],
  );

  return { handleRefreshPlayer, handleOpenAddPlayerSheet, handleScrollToPlayer } as const;
}

/**
 * Hook to provide team operation wrappers for appData methods
 * Used to add/remove/edit manual players on teams
 */
export function useTeamPlayerOperations() {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

  const addPlayerToTeam = useCallback(
    async (playerId: number) => {
      await appData.addManualPlayerToTeam(playerId, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  const removeManualPlayer = useCallback(
    (playerId: number) => {
      appData.removeManualPlayerFromTeam(playerId, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  const editManualPlayer = useCallback(
    async (oldId: number, newId: number) => {
      // Atomic swap to prevent flickering
      await appData.editManualPlayerToTeam(oldId, newId, selectedTeamId);
    },
    [appData, selectedTeamId],
  );

  return { addPlayerToTeam, removeManualPlayer, editManualPlayer };
}

export function usePlayerEditActions(deps: {
  addPlayer: (id: number) => Promise<Player | null>;
  addPlayerToTeam?: (id: number) => Promise<void>;
  removeManualPlayer?: (id: number) => void;
  editManualPlayer?: (oldId: number, newId: number) => Promise<void>;
  selectPlayer: (id: number) => void;
  resizableLayoutRef: MutableRefObject<ResizablePlayerLayoutRef | null>;
  waitForPlayerReady: (playerId: number, timeoutMs?: number) => Promise<boolean>;
}) {
  const appData = useAppData();
  const {
    addPlayer,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    resizableLayoutRef,
    waitForPlayerReady,
  } = deps;

  const handleRemoveManualPlayer = useCallback(
    (playerId: number) => {
      try {
        // Remove from team context
        removeManualPlayer?.(playerId);

        // Remove from AppData
        appData.removeManualPlayerFromTeam(playerId, appData.state.selectedTeamId);
      } catch (e) {
        console.error('Failed to remove manual player:', e);
      }
    },
    [removeManualPlayer, appData],
  );

  const handleEditManualPlayer = useCallback((playerId: number) => {
    // This consumer should open the edit sheet; leave empty here
    console.warn('handleEditManualPlayer should be provided by UI consumer', playerId);
  }, []);

  const handleAddPlayer = useCallback(
    async (playerId: string) => {
      const playerIdNum = parseInt(playerId, 10);
      if (isNaN(playerIdNum)) {
        throw new Error('Invalid player ID');
      }

      // Load player via player context (full processing)
      addPlayer(playerIdNum);

      // Link to currently selected team (always exists, defaults to global)
      try {
        // Add to team context (for now)
        addPlayerToTeam?.(playerIdNum);

        // Add to AppData (tracks player ID association)
        appData.addManualPlayerToTeam(playerIdNum, appData.state.selectedTeamId);
      } catch (e) {
        console.warn('addPlayerToTeam failed, player added to context only:', e);
      }

      // Select and scroll right away so the optimistic card is visible
      selectPlayer(playerIdNum);
      await new Promise((resolve) => setTimeout(resolve, 10));
      resizableLayoutRef.current?.scrollToPlayer(playerIdNum);
    },
    [addPlayer, addPlayerToTeam, selectPlayer, resizableLayoutRef, appData],
  );

  const onEditPlayer = useCallback(
    async (oldId: number, newPlayerId: string) => {
      if (!Number.isFinite(Number(newPlayerId))) return;
      const newIdNum = Number(newPlayerId);
      await editManualPlayer?.(oldId, newIdNum);
      await new Promise((resolve) => setTimeout(resolve, 10));
      resizableLayoutRef.current?.scrollToPlayer(newIdNum);
      const ready = await waitForPlayerReady(newIdNum);
      if (ready) {
        selectPlayer(newIdNum);
      }
    },
    [editManualPlayer, resizableLayoutRef, waitForPlayerReady, selectPlayer],
  );

  return { handleRemoveManualPlayer, handleEditManualPlayer, handleAddPlayer, onEditPlayer } as const;
}

/**
 * Create a placeholder player from stored player data
 * Similar to createPlaceholderPlayer in app-data-storage-ops.ts but for use in hooks
 */
function createPlaceholderPlayerFromStored(stored: StoredPlayerData): Player {
  const now = Date.now();
  const wins = Math.round((stored.winRate / 100) * stored.games);
  const losses = stored.games - wins;

  return {
    accountId: stored.accountId,
    profile: {
      name: stored.name,
      personaname: stored.name,
      avatar: stored.avatar,
      avatarfull: stored.avatar,
      rank_tier: stored.rank_tier,
      leaderboard_rank: stored.leaderboard_rank,
    },
    heroStats: stored.topHeroes.map((hero) => ({
      heroId: hero.id,
      games: 0,
      wins: 0,
      lastPlayed: now,
    })),
    overallStats: {
      wins,
      losses,
      totalGames: stored.games,
      winRate: stored.winRate,
    },
    recentMatchIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

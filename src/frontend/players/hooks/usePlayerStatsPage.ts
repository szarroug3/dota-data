import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import type { PlayerDetailsPanelMode } from '@/frontend/players/components/stateless/details/PlayerDetailsPanel';
import type { PlayerListViewMode } from '@/frontend/players/components/stateless/PlayerListView';
import type { ResizablePlayerLayoutRef } from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import { usePlayerContext } from '@/frontend/players/contexts/state/player-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import type { Player } from '@/types/contexts/player-context-value';
import { TeamData } from '@/types/contexts/team-context-value';

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
  detailedStats?: import('@/utils/player-statistics').PlayerDetailedStats;
}

export function usePlayerData() {
  const { players, isLoading, refreshPlayer, addPlayer } = usePlayerContext();
  const { selectedTeamId } = useTeamContext();

  const playersArray = useMemo(() => {
    return Array.from(players.values());
  }, [players]);

  return {
    players: playersArray,
    isLoading,
    error: null as null,
    selectedTeamId,
    refreshPlayer,
    addPlayer,
  };
}

export function usePlayerSelection() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const { players } = usePlayerContext();

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return (
      Array.from(players.values()).find((player) => player.profile.profile.account_id === selectedPlayerId) || null
    );
  }, [selectedPlayerId, players]);

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
        const playerToHide = filteredPlayers.find((p: Player) => p.profile.profile.account_id === id);
        if (!playerToHide) return prev;
        return [...prev, playerToHide];
      });
    },
    [filteredPlayers],
  );

  const handleUnhidePlayer = useCallback((id: number) => {
    setHiddenPlayers((prev) => prev.filter((p: Player) => p.profile.profile.account_id !== id));
  }, []);

  const visiblePlayers = useMemo(() => {
    const hiddenIds = new Set(hiddenPlayers.map((p: Player) => p.profile.profile.account_id));
    return filteredPlayers.filter((p: Player) => !hiddenIds.has(p.profile.profile.account_id));
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
    return [...players].sort((a, b) => a.profile.profile.personaname.localeCompare(b.profile.profile.personaname));
  }, [players]);
}

export function useManualPlayerIds(getSelectedTeam?: () => TeamData | undefined) {
  return useMemo(() => {
    const selectedTeam = getSelectedTeam?.();
    const manual = selectedTeam?.manualPlayers ?? [];
    return new Set<number>(manual);
  }, [getSelectedTeam]);
}

export function useWaitForPlayerReadySource(players: Player[]) {
  const playersRef = useRef<Player[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const waitForPlayerReady = useCallback(async (playerId: number, timeoutMs = 3000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const player = playersRef.current.find((p) => p.profile.profile.account_id === playerId);
      if (player && !player.error) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return false;
  }, []);

  return waitForPlayerReady;
}

// Legacy handler kept for compatibility — prefer using usePlayerListActions/usePlayerEditActions
export const usePlayerStatsHandlers = undefined as never;

export function usePlayerListActions(deps: {
  refreshPlayer: (id: number) => Promise<void | object | null>;
  resizableLayoutRef: MutableRefObject<ResizablePlayerLayoutRef | null>;
  setShowAddPlayerSheet: Dispatch<SetStateAction<boolean>>;
}) {
  const { refreshPlayer, resizableLayoutRef, setShowAddPlayerSheet } = deps;

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

export function usePlayerEditActions(deps: {
  addPlayer: (id: number) => Promise<Player | null>;
  addPlayerToTeam?: (id: number) => Promise<void>;
  removeManualPlayer?: (id: number) => void;
  editManualPlayer?: (oldId: number, newId: number) => Promise<void>;
  selectPlayer: (id: number) => void;
  resizableLayoutRef: MutableRefObject<ResizablePlayerLayoutRef | null>;
  waitForPlayerReady: (playerId: number, timeoutMs?: number) => Promise<boolean>;
}) {
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
        removeManualPlayer?.(playerId);
      } catch (e) {
        console.error('Failed to remove manual player:', e);
      }
    },
    [removeManualPlayer],
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
      const added = await addPlayer(playerIdNum);
      try {
        await addPlayerToTeam?.(playerIdNum);
      } catch (e) {
        console.warn('addPlayerToTeam failed, player added to context only:', e);
      }
      if (added && !added.error) {
        selectPlayer(playerIdNum);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
      resizableLayoutRef.current?.scrollToPlayer(playerIdNum);
    },
    [addPlayer, addPlayerToTeam, selectPlayer, resizableLayoutRef],
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

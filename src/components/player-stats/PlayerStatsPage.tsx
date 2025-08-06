'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';

import { AddPlayerSheet } from './AddPlayerSheet';
import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import type { PlayerListViewMode } from './list/PlayerListView';
import { EmptyStateContent } from './player-stats-page/EmptyStateContent';
import { ErrorContent } from './player-stats-page/ErrorContent';
import { ResizablePlayerLayout, type ResizablePlayerLayoutRef } from './ResizablePlayerLayout';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function usePlayerData() {
  const { players, isLoading, refreshPlayer, addPlayer } = usePlayerContext();
  const { selectedTeamId } = useTeamContext();

  const playersArray = useMemo(() => {
    return Array.from(players.values());
  }, [players]);

  return {
    players: playersArray,
    isLoading,
    error: null, // TODO: Add error handling from player context
    selectedTeamId,
    refreshPlayer,
    addPlayer
  };
}

function usePlayerSelection() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const { players } = usePlayerContext();

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return Array.from(players.values()).find(player => 
      player.profile.profile.account_id === selectedPlayerId
    ) || null;
  }, [selectedPlayerId, players]);

  const selectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
  };

  return {
    selectedPlayer,
    selectedPlayerId,
    selectPlayer
  };
}

function useHiddenPlayers(filteredPlayers: Player[]) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Player[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  // Hide a player (remove from visible, add to hidden)
  const handleHidePlayer = useCallback((id: number) => {
    setHiddenPlayers(prev => {
      const playerToHide = filteredPlayers.find((p: Player) => p.profile.profile.account_id === id);
      if (!playerToHide) return prev;
      return [...prev, playerToHide];
    });
  }, [filteredPlayers]);

  // Unhide a player (remove from hidden, add back to visible)
  const handleUnhidePlayer = useCallback((id: number) => {
    setHiddenPlayers(prev => prev.filter((p: Player) => p.profile.profile.account_id !== id));
  }, []);

  // Filter out hidden players from the visible list
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
    visiblePlayers
  };
}

function usePlayerViewModes() {
  const [viewMode, setViewMode] = useState<PlayerListViewMode>('list');
  const [playerDetailsViewMode, setPlayerDetailsViewMode] = useState<PlayerDetailsPanelMode>('summary');

  return {
    viewMode,
    setViewMode,
    playerDetailsViewMode,
    setPlayerDetailsViewMode
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlayerStatsEmptyState(players: Player[], selectedTeamId: { teamId: number; leagueId: number } | null) {
  if (!selectedTeamId) {
    return <EmptyStateContent type="no-selection" />;
  }
  if (players.length === 0) {
    return <EmptyStateContent type="no-teams" />;
  }
  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PlayerStatsPage: React.FC = () => {
  const { players, isLoading, error, refreshPlayer, addPlayer } = usePlayerData();
  const { selectedTeamId } = useTeamContext();
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelection();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModes();
  const { hiddenPlayers, showHiddenModal, setShowHiddenModal, handleHidePlayer, handleUnhidePlayer, visiblePlayers } = useHiddenPlayers(players);
  
  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);

  // Sort players alphabetically by name
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => 
      a.profile.profile.personaname.localeCompare(b.profile.profile.personaname)
    );
  }, [players]);

  const handleRefreshPlayer = useCallback(async (playerId: number) => {
    try {
      console.log('handleRefreshPlayer called with playerId:', playerId);
      // Add a small delay to prevent any race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      await refreshPlayer(playerId);
    } catch (error) {
      console.error('Error in handleRefreshPlayer:', error);
    }
  }, [refreshPlayer]);

  const handleAddPlayer = useCallback(async (playerId: string) => {
    try {
      const playerIdNum = parseInt(playerId, 10);
      if (isNaN(playerIdNum)) {
        throw new Error('Invalid player ID');
      }
      
      const newPlayer = await addPlayer(playerIdNum);
      if (newPlayer) {
        // Optionally select the newly added player
        selectPlayer(playerIdNum);
      }
    } catch (error) {
      console.error('Failed to add player:', error);
      throw error;
    }
  }, [addPlayer, selectPlayer]);

  const handleOpenAddPlayerSheet = useCallback(() => {
    setShowAddPlayerSheet(true);
  }, []);

  const handleScrollToPlayer = useCallback((playerId: number) => {
    resizableLayoutRef.current?.scrollToPlayer(playerId);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton type="text" lines={8} />;
    }

    if (error) {
      return <ErrorContent error={error} />;
    }

    const emptyState = getPlayerStatsEmptyState(players, selectedTeamId);
    if (emptyState) {
      return emptyState;
    }

    return (
      <ResizablePlayerLayout
        ref={resizableLayoutRef}
        players={players}
        visiblePlayers={visiblePlayers}
        filteredPlayers={sortedPlayers}
        onHidePlayer={handleHidePlayer}
        onRefreshPlayer={handleRefreshPlayer}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={selectPlayer}
        hiddenPlayersCount={hiddenPlayers.length}
        onShowHiddenPlayers={() => setShowHiddenModal(true)}
        hiddenPlayerIds={new Set(hiddenPlayers.map(p => p.profile.profile.account_id))}
        selectedPlayer={selectedPlayer}
        playerDetailsViewMode={playerDetailsViewMode}
        setPlayerDetailsViewMode={setPlayerDetailsViewMode}
        onScrollToPlayer={handleScrollToPlayer}
        onAddPlayer={handleOpenAddPlayerSheet}
      />
    );
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
        {renderContent()}
      </Suspense>
      
      <AddPlayerSheet
        isOpen={showAddPlayerSheet}
        onClose={() => setShowAddPlayerSheet(false)}
        onAddPlayer={handleAddPlayer}
        existingPlayers={players}
      />
    </ErrorBoundary>
  );
}; 
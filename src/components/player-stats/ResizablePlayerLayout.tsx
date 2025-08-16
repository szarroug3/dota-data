'use client';

import React, { forwardRef, useImperativeHandle } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { Player } from '@/types/contexts/player-context-value';

import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import { PlayerDetailsPanel } from './details/PlayerDetailsPanel';
import type { PlayerListViewMode } from './list/PlayerListView';
import { PlayersList, type PlayersListRef } from './list/PlayersList';

interface ResizablePlayerLayoutProps {
  // Player list
  players: Player[];
  visiblePlayers: Player[];
  filteredPlayers: Player[]; // Players after filtering but before hiding
  onHidePlayer: (playerId: number) => void;
  onRefreshPlayer: (playerId: number) => void;
  viewMode: PlayerListViewMode;
  setViewMode: (mode: PlayerListViewMode) => void;
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  hiddenPlayersCount?: number;
  onShowHiddenPlayers?: () => void;
  hiddenPlayerIds?: Set<number>;
  manualPlayerIds?: Set<number>;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  
  // Player details
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (mode: PlayerDetailsPanelMode) => void;
  
  // Scroll functionality
  onScrollToPlayer?: (playerId: number) => void;
  
  // Add player functionality
  onAddPlayer?: () => void;
}

export interface ResizablePlayerLayoutRef {
  scrollToPlayer: (playerId: number) => void;
}

export const ResizablePlayerLayout =
  React.memo(forwardRef<ResizablePlayerLayoutRef, ResizablePlayerLayoutProps>(({
  players,
  visiblePlayers,
  filteredPlayers,
  onHidePlayer,
  onRefreshPlayer,
  viewMode,
  setViewMode,
  selectedPlayerId,
  onSelectPlayer,
  hiddenPlayersCount = 0,
  onShowHiddenPlayers,
  hiddenPlayerIds = new Set(),
  selectedPlayer,
  playerDetailsViewMode,
  setPlayerDetailsViewMode,
  onScrollToPlayer,
  onAddPlayer,
  manualPlayerIds,
  onEditPlayer,
  onRemovePlayer,
}, ref) => {
  const playersListRef = React.useRef<PlayersListRef>(null);

  useImperativeHandle(ref, () => ({
    scrollToPlayer: (playerId: number) => {
      playersListRef.current?.scrollToPlayer(playerId);
    }
  }));

  return (
    <div className="h-fit flex flex-col">
      {/* Resizable Panels */}
      <div className="h-fit">
        <ResizablePanelGroup direction="horizontal">
          {/* Player List Panel */}
          <ResizablePanel 
            id="player-list" 
            defaultSize={50}
            minSize={0} 
            maxSize={100} 
            className="overflow-visible"
          >
            <div className="h-fit pt-2 pr-3 @container" style={{ containerType: 'inline-size' }}>
              <PlayersList
                ref={playersListRef}
                players={visiblePlayers}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={onSelectPlayer}
                onHidePlayer={onHidePlayer}
                onRefreshPlayer={onRefreshPlayer}
                viewMode={viewMode}
                setViewMode={setViewMode}
                hiddenPlayersCount={hiddenPlayersCount}
                onShowHiddenPlayers={onShowHiddenPlayers}
                hiddenPlayerIds={hiddenPlayerIds}
                filteredPlayers={filteredPlayers}
                onScrollToPlayer={onScrollToPlayer}
                onAddPlayer={onAddPlayer}
                manualPlayerIds={manualPlayerIds}
                onEditPlayer={onEditPlayer}
                onRemovePlayer={onRemovePlayer}
              />
            </div>
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle withHandle className="after:w-4" />
          
          {/* Player Details Panel */}
          <ResizablePanel 
            id="player-details" 
            defaultSize={50}
            minSize={0} 
            maxSize={100}
            className="overflow-hidden"
          >
            <div className="h-fit pt-2 pl-3">
              {selectedPlayer ? (
                <PlayerDetailsPanel
                  player={selectedPlayer}
                  viewMode={playerDetailsViewMode}
                  onViewModeChange={setPlayerDetailsViewMode}
                  allPlayers={players}
                  hiddenPlayerIds={hiddenPlayerIds}
                />
              ) : (
                <div className="bg-card rounded-lg shadow-md flex items-center justify-center p-8 text-muted-foreground min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)]">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">No Player Selected</div>
                    <div className="text-sm">Select a player from the list to view details</div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}));

ResizablePlayerLayout.displayName = 'ResizablePlayerLayout'; 
'use client';

import React, { forwardRef, useImperativeHandle } from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { PlayerDetailsPanelMode } from '@/frontend/players/components/stateless/details/PlayerDetailsPanel';
import { PlayerDetailsPanel } from '@/frontend/players/components/stateless/details/PlayerDetailsPanel';
import type { PlayerListViewMode } from '@/frontend/players/components/stateless/PlayerListView';
import { PlayersList, type PlayersListRef } from '@/frontend/players/components/stateless/PlayersList';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';

interface ResizablePlayerLayoutProps {
  players: Player[];
  visiblePlayers: Player[];
  filteredPlayers: Player[];
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
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (mode: PlayerDetailsPanelMode) => void;
  onScrollToPlayer?: (playerId: number) => void;
  onAddPlayer?: () => void;
  heroes: Record<string, Hero>;
  preferredSite: PreferredExternalSite;
  matchesArray: Match[];
  selectedTeam: TeamData | null | undefined;
}

export interface ResizablePlayerLayoutRef {
  scrollToPlayer: (playerId: number) => void;
}

function PlayersListSection(props: {
  players: Player[];
  visiblePlayers: Player[];
  filteredPlayers: Player[];
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  onHidePlayer: (playerId: number) => void;
  onRefreshPlayer: (playerId: number) => void;
  viewMode: PlayerListViewMode;
  setViewMode: (mode: PlayerListViewMode) => void;
  hiddenPlayersCount?: number;
  onShowHiddenPlayers?: () => void;
  hiddenPlayerIds?: Set<number>;
  onScrollToPlayer?: (playerId: number) => void;
  onAddPlayer?: () => void;
  manualPlayerIds?: Set<number>;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  heroes: Record<string, Hero>;
  preferredSite: PreferredExternalSite;
  playersListRef: React.RefObject<PlayersListRef>;
}) {
  const {
    visiblePlayers,
    selectedPlayerId,
    onSelectPlayer,
    onHidePlayer,
    onRefreshPlayer,
    viewMode,
    setViewMode,
    hiddenPlayersCount = 0,
    onShowHiddenPlayers,
    hiddenPlayerIds = new Set(),
    filteredPlayers,
    onScrollToPlayer,
    onAddPlayer,
    manualPlayerIds,
    onEditPlayer,
    onRemovePlayer,
    heroes,
    preferredSite,
    playersListRef,
  } = props;

  return (
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
        heroes={heroes}
        preferredSite={preferredSite}
      />
    </div>
  );
}

function PlayerDetailsSection(props: {
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (mode: PlayerDetailsPanelMode) => void;
  players: Player[];
  hiddenPlayerIds?: Set<number>;
  heroes: Record<string, Hero>;
  matchesArray: Match[];
  selectedTeam: TeamData | null | undefined;
}) {
  const {
    selectedPlayer,
    playerDetailsViewMode,
    setPlayerDetailsViewMode,
    players,
    hiddenPlayerIds = new Set(),
    heroes,
    matchesArray,
    selectedTeam,
  } = props;
  return (
    <div className="h-fit pt-2 pl-3">
      {selectedPlayer ? (
        <PlayerDetailsPanel
          player={selectedPlayer}
          viewMode={playerDetailsViewMode}
          onViewModeChange={setPlayerDetailsViewMode}
          allPlayers={players}
          hiddenPlayerIds={hiddenPlayerIds}
          heroes={heroes}
          matchesArray={matchesArray}
          selectedTeam={selectedTeam}
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
  );
}

export const ResizablePlayerLayout = React.memo(
  forwardRef<ResizablePlayerLayoutRef, ResizablePlayerLayoutProps>(
    (
      {
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
        heroes,
        preferredSite,
        matchesArray,
        selectedTeam,
      },
      ref,
    ) => {
      const playersListRef = React.useRef<PlayersListRef>(null!);

      useImperativeHandle(ref, () => ({
        scrollToPlayer: (playerId: number) => {
          playersListRef.current?.scrollToPlayer(playerId);
        },
      }));

      return (
        <div className="h-fit flex flex-col">
          <div className="h-fit">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="player-list" defaultSize={50} minSize={0} maxSize={100} className="overflow-visible">
                <PlayersListSection
                  players={players}
                  visiblePlayers={visiblePlayers}
                  filteredPlayers={filteredPlayers}
                  selectedPlayerId={selectedPlayerId}
                  onSelectPlayer={onSelectPlayer}
                  onHidePlayer={onHidePlayer}
                  onRefreshPlayer={onRefreshPlayer}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  hiddenPlayersCount={hiddenPlayersCount}
                  onShowHiddenPlayers={onShowHiddenPlayers}
                  hiddenPlayerIds={hiddenPlayerIds}
                  onScrollToPlayer={onScrollToPlayer}
                  onAddPlayer={onAddPlayer}
                  manualPlayerIds={manualPlayerIds}
                  onEditPlayer={onEditPlayer}
                  onRemovePlayer={onRemovePlayer}
                  heroes={heroes}
                  preferredSite={preferredSite}
                  playersListRef={playersListRef}
                />
              </ResizablePanel>

              <ResizableHandle withHandle className="after:w-4" />

              <ResizablePanel
                id="player-details"
                defaultSize={50}
                minSize={0}
                maxSize={100}
                className="overflow-hidden"
              >
                <PlayerDetailsSection
                  selectedPlayer={selectedPlayer}
                  playerDetailsViewMode={playerDetailsViewMode}
                  setPlayerDetailsViewMode={setPlayerDetailsViewMode}
                  players={players}
                  hiddenPlayerIds={hiddenPlayerIds}
                  heroes={heroes}
                  matchesArray={matchesArray}
                  selectedTeam={selectedTeam}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      );
    },
  ),
);

ResizablePlayerLayout.displayName = 'ResizablePlayerLayout';

import { Eye, List, Plus, SquareStack } from 'lucide-react';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';

import { PlayerListView, type PlayerListViewMode } from './PlayerListView';

// Custom hook for scroll functionality
const useScrollToPlayer = (cardContentRef: React.RefObject<HTMLDivElement | null>) => {
  const [scrolledPlayerId, setScrolledPlayerId] = useState<number | null>(null);

  const handleScrollToPlayer = useCallback(
    (playerId: number) => {
      if (!cardContentRef.current) return;
      if (scrolledPlayerId === playerId) return;

      const container = cardContentRef.current;
      const playerElement = container.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement | null;

      if (!playerElement) return;

      const containerRect = container.getBoundingClientRect();
      const elementRect = playerElement.getBoundingClientRect();

      const padding = 12;

      // Check if the element is fully visible
      const isFullyVisible = elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;

      if (isFullyVisible) {
        setScrolledPlayerId(playerId);
        return;
      }

      // Calculate how much to scroll by
      const scrollOffset = elementRect.top - containerRect.top - padding;
      const targetScrollTop = container.scrollTop + scrollOffset;

      // Use smooth scrolling
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
      setScrolledPlayerId(playerId);
    },
    [cardContentRef, scrolledPlayerId],
  );

  return { handleScrollToPlayer };
};

interface PlayersListProps {
  players: Player[];
  onHidePlayer: (playerId: number) => void;
  onRefreshPlayer: (playerId: number) => void;
  viewMode: PlayerListViewMode;
  setViewMode: (mode: PlayerListViewMode) => void;
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  hiddenPlayersCount?: number;
  onShowHiddenPlayers?: () => void;
  onAddPlayer?: () => void;
  manualPlayerIds?: Set<number>;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  hiddenPlayerIds?: Set<number>;
  filteredPlayers?: Player[];
  onScrollToPlayer?: (playerId: number) => void;
  heroes: Record<string, Hero>;
  preferredSite: PreferredExternalSite;
}

export interface PlayersListRef {
  scrollToPlayer: (playerId: number) => void;
}

interface PlayerListLayoutButtonsProps {
  viewMode: PlayerListViewMode;
  setViewMode: (mode: PlayerListViewMode) => void;
}

const PlayerListLayoutButtons: React.FC<PlayerListLayoutButtonsProps> = ({ viewMode, setViewMode }) => (
  <>
    <div className="@[120px]:flex hidden flex-shrink-0">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as PlayerListViewMode)}>
        <TabsList className="grid w-auto grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2 min-w-0">
            <List className="w-4 h-4 flex-shrink-0" />
            <span className="@[420px]:block hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2 min-w-0">
            <SquareStack className="w-4 h-4 flex-shrink-0" />
            <span className="@[420px]:block hidden">Card</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="@[120px]:hidden h-9 w-24">{/* Invisible placeholder to maintain space when tabs are hidden */}</div>
  </>
);

interface PlayersListContentProps {
  players: Player[];
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  onRefreshPlayer: (playerId: number) => void;
  viewMode: PlayerListViewMode;
  onAddPlayer?: () => void;
  hiddenPlayersCount?: number;
  onShowHiddenPlayers?: () => void;
  setViewMode: (mode: PlayerListViewMode) => void;
  cardContentRef: React.RefObject<HTMLDivElement | null>;
  manualPlayerIds?: Set<number>;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  hiddenPlayerIds?: Set<number>;
  heroes: Record<string, Hero>;
  preferredSite: PreferredExternalSite;
}

const PlayersListContent: React.FC<PlayersListContentProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onRefreshPlayer,
  viewMode,
  onAddPlayer,
  hiddenPlayersCount = 0,
  onShowHiddenPlayers,
  setViewMode,
  cardContentRef,
  manualPlayerIds,
  onEditPlayer,
  onRemovePlayer,
  hiddenPlayerIds,
  heroes,
  preferredSite,
}) => {
  return (
    <Card
      className="flex flex-col min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] @container"
      style={{ containerType: 'inline-size' }}
    >
      <CardHeader className="flex items-center justify-between flex-shrink-0 min-w-0">
        <div className="min-w-0 overflow-hidden opacity-0 invisible @[250px]:opacity-100 @[250px]:visible">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">Player Statistics</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
            {players.length} players found
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hiddenPlayersCount > 0 && onShowHiddenPlayers && (
            <div className="@[260px]:flex hidden">
              <Button variant="outline" size="sm" onClick={onShowHiddenPlayers} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{hiddenPlayersCount}</span>
              </Button>
            </div>
          )}
          {onAddPlayer && (
            <div className="@[180px]:block hidden">
              <Button
                onClick={onAddPlayer}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 px-3 py-1 text-xs w-[32px] @[420px]:w-[102px]"
              >
                <Plus className="h-3 w-3" />
                <span className="@[420px]:block hidden">Add Player</span>
              </Button>
            </div>
          )}
          <div className="ml-auto">
            <PlayerListLayoutButtons viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
      </CardHeader>
      <CardContent ref={cardContentRef} className="flex-1 min-h-0 px-0 py-0 overflow-y-auto @[135px]:block hidden">
        <div className="px-4 py-2">
          <PlayerListView
            players={players}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={onSelectPlayer}
            onRefreshPlayer={onRefreshPlayer}
            viewMode={viewMode}
            manualPlayerIds={manualPlayerIds}
            onEditPlayer={onEditPlayer}
            onRemovePlayer={onRemovePlayer}
            hiddenPlayerIds={hiddenPlayerIds}
            heroes={heroes}
            preferredSite={preferredSite}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const PlayersList = forwardRef<PlayersListRef, PlayersListProps>(
  (
    {
      players,
      onRefreshPlayer,
      viewMode,
      setViewMode,
      selectedPlayerId,
      onSelectPlayer,
      hiddenPlayersCount = 0,
      onShowHiddenPlayers,
      onAddPlayer,
      manualPlayerIds,
      onEditPlayer,
      onRemovePlayer,
      hiddenPlayerIds,
      heroes,
      preferredSite,
    },
    ref,
  ) => {
    const cardContentRef = React.useRef<HTMLDivElement>(null);
    const { handleScrollToPlayer } = useScrollToPlayer(cardContentRef);

    useImperativeHandle(ref, () => ({
      scrollToPlayer: handleScrollToPlayer,
    }));

    return (
      <PlayersListContent
        players={players}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        onRefreshPlayer={onRefreshPlayer}
        viewMode={viewMode}
        setViewMode={setViewMode}
        hiddenPlayersCount={hiddenPlayersCount}
        onShowHiddenPlayers={onShowHiddenPlayers}
        onAddPlayer={onAddPlayer}
        cardContentRef={cardContentRef}
        manualPlayerIds={manualPlayerIds}
        onEditPlayer={onEditPlayer}
        onRemovePlayer={onRemovePlayer}
        hiddenPlayerIds={hiddenPlayerIds}
        heroes={heroes}
        preferredSite={preferredSite}
      />
    );
  },
);

PlayersList.displayName = 'PlayersList';

import { Pencil, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { RefreshButton } from '@/frontend/matches/components/stateless/common/RefreshButton';
import { PlayerAvatar } from '@/frontend/players/components/stateless/PlayerAvatar';
import { PlayerExternalSiteButton } from '@/frontend/players/components/stateless/PlayerExternalSiteButton';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerRank } from '@/utils/player-statistics';

export type PlayerListViewMode = 'list' | 'card';

interface PlayerListViewProps {
  players: Player[];
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  onRefreshPlayer?: (playerId: number) => void;
  viewMode: PlayerListViewMode;
  manualPlayerIds?: Set<number>;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
  hiddenPlayerIds?: Set<number>;
  heroes: Record<string, Hero>;
  preferredSite: PreferredExternalSite;
}

function getTopHeroes(player: Player, heroes: Record<string, Hero>): Hero[] {
  if (!player.heroes) return [];
  const top = [...player.heroes].sort((a, b) => b.games - a.games).slice(0, 5);
  return top.map((h) => heroes[h.hero_id.toString()]).filter(Boolean) as Hero[];
}

function renderRank(rankTier?: number | null, leaderboardRank?: number | null): React.ReactNode {
  const processed = processPlayerRank(rankTier ?? 0, leaderboardRank ?? undefined);
  if (!processed) return null;
  const stars = processed.isImmortal ? 0 : processed.stars;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm font-medium truncate">{processed.displayText}</span>
      {stars > 0 && (
        <div className="flex gap-0.5 flex-shrink-0">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-yellow-500 text-xs">
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerTopHeroes({
  heroes,
  align = 'justify-end',
}: {
  heroes: Hero[];
  align?: 'justify-end' | 'justify-center';
}) {
  if (heroes.length === 0) return null;
  const size = { width: 'w-8', height: 'h-8' } as const;
  const totalHeroes = heroes.length;
  return (
    <div className={`-space-x-1 inline-flex ${align}`}>
      <div className="@[300px]:flex hidden">
        {heroes.slice(0, 5).map((h) => (
          <HeroAvatar key={h.id} hero={h} avatarSize={size} />
        ))}
      </div>
      <div className="@[250px]:flex @[300px]:hidden hidden">
        {heroes.slice(0, 3).map((h) => (
          <HeroAvatar key={h.id} hero={h} avatarSize={size} />
        ))}
        {totalHeroes > 3 && (
          <div
            className={`${size.width} ${size.height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}
          >
            <span className="text-xs font-medium text-muted-foreground">+{totalHeroes - 3}</span>
          </div>
        )}
      </div>
      <div className="@[200px]:flex @[250px]:hidden hidden">
        {heroes.slice(0, 2).map((h) => (
          <HeroAvatar key={h.id} hero={h} avatarSize={size} />
        ))}
        {totalHeroes > 2 && (
          <div
            className={`${size.width} ${size.height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}
          >
            <span className="text-xs font-medium text-muted-foreground">+{totalHeroes - 2}</span>
          </div>
        )}
      </div>
      <div className="@[120px]:flex @[200px]:hidden hidden">
        {heroes.slice(0, 1).map((h) => (
          <HeroAvatar key={h.id} hero={h} avatarSize={size} />
        ))}
        {totalHeroes > 1 && (
          <div
            className={`${size.width} ${size.height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}
          >
            <span className="text-xs font-medium text-muted-foreground">+{totalHeroes - 1}</span>
          </div>
        )}
      </div>
      {/* Below 120px: placeholder keeps alignment when heroes are hidden */}
      <div className="@[120px]:hidden flex w-8 h-8" aria-hidden="true" />
    </div>
  );
}

function PlayerActions({
  player,
  onRefresh,
  preferredSite,
}: {
  player: Player;
  onRefresh?: (id: number) => void;
  preferredSite: PreferredExternalSite;
}) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <PlayerExternalSiteButton playerId={player.profile.profile.account_id} preferredSite={preferredSite} size="sm" />
      {onRefresh && !player.error && (
        <RefreshButton
          onClick={() => onRefresh(player.profile.profile.account_id)}
          ariaLabel={`Refresh ${player.profile.profile.personaname}`}
        />
      )}
    </div>
  );
}

function InfoOrPlaceholder({ show, children }: { show: boolean; children: React.ReactNode }) {
  return show ? (
    <div className="text-sm text-muted-foreground truncate">{children}</div>
  ) : (
    <div className="text-sm text-muted-foreground truncate h-4">&nbsp;</div>
  );
}

function PlayerTextInfo({ player, totalGames, winRate }: { player: Player; totalGames: number; winRate: number }) {
  const hasError = Boolean(player.error);
  const showLoading = player.isLoading && !hasError;
  const showData = !hasError && !player.isLoading;
  return (
    <div className="min-w-0 @[120px]:block hidden">
      <div className="font-semibold truncate flex items-center gap-2">
        <span>{showLoading ? `Loading ${player.profile.profile.account_id}` : player.profile.profile.personaname}</span>
        {showLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-label="Loading" />
        )}
      </div>
      {hasError ? (
        <div className="text-sm text-destructive truncate" role="alert">
          {player.error}
        </div>
      ) : (
        <>
          <InfoOrPlaceholder show={showData}>
            {renderRank(player.profile.rank_tier, player.profile.leaderboard_rank)}
          </InfoOrPlaceholder>
          <InfoOrPlaceholder show={showData}>
            {totalGames} Games • {winRate.toFixed(1)}% Win Rate
          </InfoOrPlaceholder>
        </>
      )}
    </div>
  );
}

function ManualPlayerActions({
  playerId,
  isManual,
  onEditPlayer,
  onRemovePlayer,
}: {
  playerId: number;
  isManual?: boolean;
  onEditPlayer?: (id: number) => void;
  onRemovePlayer?: (id: number) => void;
}) {
  if (!isManual) return null;
  return (
    <div className="@[270px]:flex hidden items-center gap-2">
      <button
        type="button"
        aria-label="Edit player"
        className="p-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onEditPlayer?.(playerId);
        }}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Remove player"
        className="p-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onRemovePlayer?.(playerId);
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

const ListRow: React.FC<{
  player: Player;
  isSelected: boolean;
  onSelect?: (id: number) => void;
  topHeroes: Hero[];
  onRefresh?: (id: number) => void;
  isManual?: boolean;
  onEditPlayer?: (id: number) => void;
  onRemovePlayer?: (id: number) => void;
  preferredSite: PreferredExternalSite;
}> = ({
  player,
  isSelected,
  onSelect,
  topHeroes,
  onRefresh,
  isManual,
  onEditPlayer,
  onRemovePlayer,
  preferredSite,
}) => {
  const totalGames = player.wl.win + player.wl.lose;
  const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
  const handleSelect = () => {
    if (!player.error) onSelect?.(player.profile.profile.account_id);
  };
  const aria = player.error
    ? `${player.profile.profile.personaname} - Error: ${player.error}`
    : `Select ${player.profile.profile.personaname}`;
  return (
    <Card
      className={`transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'} ${player.error ? 'border-destructive bg-destructive/5 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleSelect}
      role="button"
      tabIndex={player.error ? -1 : 0}
      aria-label={aria}
    >
      <CardContent className="py-0 @container" style={{ containerType: 'inline-size' }}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatar
              player={player}
              avatarSize={{ width: 'w-10', height: 'h-10' }}
              showLink={false}
              preferredSite={preferredSite}
            />
            <PlayerTextInfo player={player} totalGames={totalGames} winRate={winRate} />
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-0">
            {player.isLoading ? (
              <div className="h-8 w-28" aria-hidden="true" />
            ) : (
              <PlayerTopHeroes heroes={topHeroes} />
            )}
            <div className="flex items-center gap-2">
              <div className="@[120px]:flex hidden">
                <PlayerActions player={player} onRefresh={onRefresh} preferredSite={preferredSite} />
              </div>
              {/* Placeholder to keep alignment when actions are hidden below 120px */}
              <div className="@[120px]:hidden flex w-10 h-8" aria-hidden="true" />
              <ManualPlayerActions
                playerId={player.profile.profile.account_id}
                isManual={isManual}
                onEditPlayer={onEditPlayer}
                onRemovePlayer={onRemovePlayer}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PlayerListView: React.FC<PlayerListViewProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onRefreshPlayer,
  viewMode,
  manualPlayerIds,
  onEditPlayer,
  onRemovePlayer,
  heroes,
  preferredSite,
}) => {
  const processed = useMemo(() => {
    return players.map((p) => ({
      player: p,
      rank: processPlayerRank(p.profile.rank_tier, p.profile.leaderboard_rank),
      topHeroes: getTopHeroes(p, heroes),
    }));
  }, [players, heroes]);

  if (players.length === 0) {
    return <PlayersEmptyState />;
  }

  if (viewMode === 'card') {
    return (
      <PlayerCardsGrid
        processed={processed}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={onSelectPlayer}
        onRefreshPlayer={onRefreshPlayer}
        preferredSite={preferredSite}
      />
    );
  }

  return (
    <div className="grid gap-2 w-full">
      {processed.map(({ player, topHeroes }) => (
        <div key={player.profile.profile.account_id} data-player-id={player.profile.profile.account_id}>
          <ListRow
            player={player}
            isSelected={selectedPlayerId === player.profile.profile.account_id}
            onSelect={onSelectPlayer}
            topHeroes={topHeroes}
            onRefresh={onRefreshPlayer}
            isManual={manualPlayerIds?.has(player.profile.profile.account_id)}
            onEditPlayer={onEditPlayer}
            onRemovePlayer={onRemovePlayer}
            preferredSite={preferredSite}
          />
        </div>
      ))}
    </div>
  );
};

PlayerListView.displayName = 'PlayerListView';

function PlayersEmptyState(): React.ReactElement {
  return (
    <div className="w-full flex items-center justify-center p-8 text-muted-foreground">
      <div className="text-center">
        <div className="text-lg font-medium mb-2">No players found</div>
        <div className="text-sm">Try adjusting your filters or adding more players.</div>
      </div>
    </div>
  );
}

const PlayerCardsGrid: React.FC<{
  processed: Array<{ player: Player; topHeroes: Hero[] }>;
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  onRefreshPlayer?: (playerId: number) => void;
  preferredSite: PreferredExternalSite;
}> = ({ processed, selectedPlayerId, onSelectPlayer, onRefreshPlayer, preferredSite }) => {
  return (
    <div className="grid gap-4 w-full overflow-hidden grid-cols-1 @[430px]:grid-cols-2 @[630px]:grid-cols-3 @[830px]:grid-cols-4">
      {processed.map(({ player, topHeroes }) => {
        const totalGames = player.wl.win + player.wl.lose;
        const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
        const isSelected = selectedPlayerId === player.profile.profile.account_id;
        return (
          <Card
            key={player.profile.profile.account_id}
            className={`transition-all w-full overflow-hidden ${isSelected ? 'ring-2 ring-primary' : 'cursor-pointer hover:shadow-md'}`}
            onClick={() => onSelectPlayer?.(player.profile.profile.account_id)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-3 mb-3">
                <PlayerAvatar
                  player={player}
                  avatarSize={{ width: 'w-16', height: 'h-16' }}
                  showLink={false}
                  preferredSite={preferredSite}
                />
                <div className="text-center w-full min-w-0 overflow-hidden">
                  <div className="font-medium truncate">{player.profile.profile.personaname}</div>
                  <div className="text-xs text-muted-foreground h-4 flex items-center justify-center truncate">
                    {renderRank(player.profile.rank_tier, player.profile.leaderboard_rank) || '\u00A0'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2 text-center truncate">
                {totalGames} games • {winRate.toFixed(1)}%
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-center overflow-hidden w-full">
                  <PlayerTopHeroes heroes={topHeroes} align="justify-center" />
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <PlayerExternalSiteButton
                    playerId={player.profile.profile.account_id}
                    preferredSite={preferredSite}
                    size="sm"
                  />
                  <RefreshButton
                    onClick={() => onRefreshPlayer?.(player.profile.profile.account_id)}
                    ariaLabel={`Refresh ${player.profile.profile.personaname}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

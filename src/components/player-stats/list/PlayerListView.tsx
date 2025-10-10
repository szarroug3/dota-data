import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import { useConstantsContext } from '@/contexts/constants-context';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { PlayerRank } from '@/utils/player-statistics';
import { processPlayerRank } from '@/utils/player-statistics';
 

import { HeroAvatar } from '../../match-history/common/HeroAvatar';
import { RefreshButton } from '../../match-history/common/RefreshButton';
import { PlayerExternalSiteButton } from '../common/PlayerExternalSiteButton';
import { PlayerAvatar } from '../player-stats-page/PlayerAvatar';

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
}

// Helper function to render rank display
const renderRank = (rank: PlayerRank | null) => {
  if (!rank) return null;
  
  return (
    <div className="flex items-center space-x-2 min-w-0">
      <span className="text-sm font-medium text-foreground dark:text-foreground truncate">
        {rank.displayText}
      </span>
      {!rank.isImmortal && rank.stars > 0 && (
        <div className="flex space-x-1 flex-shrink-0">
          {Array.from({ length: rank.stars }, (_, i) => (
            <span key={i} className="text-yellow-500 text-xs">★</span>
          ))}
        </div>
      )}
    </div>
  );
};

// Responsive top heroes that degrade 5 → 4 → 3 → 2 → 1 → hidden as width shrinks
const ResponsiveTopHeroes: React.FC<{
  player: Player;
  heroes: Record<string, Hero>;
  index?: number;
}> = ({ player, heroes, index }) => {
  const topHeroes = getTopHeroes(player, heroes);
  if (topHeroes.length === 0) {
    return (
      <div className="text-xs text-muted-foreground dark:text-muted-foreground"></div>
    );
  }

  const avatarSize = { width: 'w-8', height: 'h-8' };
  const isFirstItem = index === 0;
  const tooltipPosition = isFirstItem ? 'top-full mt-1' : 'bottom-full mb-1';

  // Renderers modeled after MatchListViewCard's HeroAvatars – no "+x" indicator, just avatars
  const renderFive = (): React.ReactNode => (
    <div className="@[390px]:flex hidden -space-x-1">
      {topHeroes.slice(0, 5).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderFour = (): React.ReactNode => (
    <div className="@[350px]:flex @[390px]:hidden hidden -space-x-1">
      {topHeroes.slice(0, 4).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderThree = (): React.ReactNode => (
    <div className="@[310px]:flex @[350px]:hidden hidden -space-x-1">
      {topHeroes.slice(0, 3).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderTwo = (): React.ReactNode => (
    <div className="@[270px]:flex @[310px]:hidden hidden -space-x-1">
      {topHeroes.slice(0, 2).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderOne = (): React.ReactNode => (
    <div className="@[230px]:flex @[270px]:hidden hidden -space-x-1">
      {topHeroes.slice(0, 1).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderPlaceholder = (): React.ReactNode => (
    // Reserve horizontal space when avatars collapse to prevent text reflow
    <div className="@[230px]:hidden flex h-8 w-10" aria-hidden="true" />
  );

  return (
    <div className="h-8 flex items-center justify-end -space-x-1 overflow-hidden pr-1">
      {renderFive()}
      {renderFour()}
      {renderThree()}
      {renderTwo()}
      {renderOne()}
      {renderPlaceholder()}
    </div>
  );
};

// Responsive top heroes for Card view (start disappearing at 190)
const ResponsiveTopHeroesCard: React.FC<{
  player: Player;
  heroes: Record<string, Hero>;
  index?: number;
}> = ({ player, heroes, index }) => {
  const topHeroes = getTopHeroes(player, heroes);
  if (topHeroes.length === 0) {
    return <div className="text-xs text-muted-foreground dark:text-muted-foreground">No hero data</div>;
  }

  const avatarSize = { width: 'w-8', height: 'h-8' };
  const isFirstItem = index === 0;
  const tooltipPosition = isFirstItem ? 'top-full mt-1' : 'bottom-full mb-1';

  const mk = (count: number): React.ReactNode => (
    <div className="flex items-center gap-1">
      {topHeroes.slice(0, Math.min(count, topHeroes.length)).map((h, i) => (
        <div key={i} className="relative group">
          <HeroAvatar hero={h.hero} avatarSize={avatarSize} />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {h.hero.localizedName}
            <br />
            {h.games} Games • {h.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-8 flex items-center justify-center -space-x-1 overflow-hidden pr-1">
      <div className="@[180px]:flex hidden">{mk(5)}</div>
      <div className="@[140px]:flex @[180px]:hidden hidden">{mk(4)}</div>
      <div className="@[100px]:flex @[140px]:hidden hidden">{mk(3)}</div>
      <div className="@[80px]:flex @[100px]:hidden hidden">{mk(2)}</div>
      <div className="@[60px]:flex @[80px]:hidden hidden">{mk(1)}</div>
      <div className="@[60px]:hidden flex w-10 h-8" aria-hidden="true" />
    </div>
  );
};

// Helper function to get top 5 heroes
const getTopHeroes = (player: Player, heroes: Record<string, Hero>) => {
  if (!player.heroes || player.heroes.length === 0) return [];
  
  // Sort heroes by games played (descending) and take top 5
  const sortedHeroes = [...player.heroes]
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);
  
  // Map to hero data with win rate
  return sortedHeroes.map(heroData => {
    const hero = heroes[heroData.hero_id];
    const winRate = heroData.games > 0 ? (heroData.win / heroData.games) * 100 : 0;
    
    return {
      hero,
      games: heroData.games,
      wins: heroData.win,
      winRate
    };
  }).filter(item => item.hero); // Filter out heroes not found in constants
};

// Removed legacy helper renderTopHeroes (replaced by responsive variants)

// Row item used by list mode
interface PlayerListRowProps {
  player: Player;
  isSelected: boolean;
  index: number;
  heroes: Record<string, Hero>;
  rank: PlayerRank | null;
  onSelect: (playerId: number) => void;
  onRefresh?: (playerId: number) => void | Promise<void>;
  preferredExternalSite: PreferredExternalSite;
  isManual?: boolean;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
}

const PlayerListRowContent: React.FC<{
  player: Player;
  index: number;
  heroes: Record<string, Hero>;
  rank: PlayerRank | null;
  onRefresh?: (playerId: number) => void | Promise<void>;
  preferredExternalSite: PreferredExternalSite;
  isManual?: boolean;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
}> = ({ player, index, heroes, rank, onRefresh, preferredExternalSite, isManual = false, onEditPlayer, onRemovePlayer }) => {
  const totalGames = player.wl.win + player.wl.lose;
  const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;

  // Always render the same layout, even on error, with buttons available

  return (
    <CardContent className="p-4 h-[134px] @container" style={{ containerType: 'inline-size' }}>
      <div className="flex items-center space-x-4 h-full relative">
        {/* Player avatar with placeholder to preserve layout */}
        <div className="flex-shrink-0 w-12 h-12">
          {/* Visible avatar ≥50, placeholder otherwise */}
          <div className="@[50px]:block hidden w-12 h-12">
            <PlayerAvatar
              player={player}
              avatarSize={{ width: 'w-12', height: 'h-12' }}
              showLink={false}
              className="flex-shrink-0"
            />
          </div>
          <div className="@[50px]:hidden block w-12 h-12" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden pr-2">
          {/* Player name with placeholder for height */}
          <div>
            <h3 className="font-semibold truncate @[175px]:block hidden">
              {player.profile.profile.personaname}
            </h3>
            <div className="@[175px]:hidden block h-5" aria-hidden="true" />
          </div>
          {rank ? (
            <>
              <div className="mt-1 overflow-hidden @[120px]:block hidden">{renderRank(rank)}</div>
              <div className="@[120px]:hidden block h-5 mt-1" aria-hidden="true" />
            </>
          ) : null}
          {/* Games / Win Rate OR Error message */}
          {!player.error ? (
            <>
              <div className="mt-1 @[190px]:block hidden">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
                  <span>{totalGames}</span>
                  <span className="@[365px]:inline hidden">&nbsp;Games</span>
                  <span className="mx-1">•</span>
                  <span>{winRate.toFixed(1)}%</span>
                  <span className="@[365px]:inline hidden">&nbsp;Win Rate</span>
                </p>
              </div>
              {/* Maintain consistent height when stats line hides responsively */}
              <div className="@[190px]:hidden block h-5 mt-1" aria-hidden="true" />
              {/* No extra error placeholders in non-error state to avoid unintended spacing */}
            </>
          ) : (
            <>
              <div className="mt-1 @[190px]:block hidden">
                <p className="text-sm text-destructive truncate">Failed to fetch player</p>
              </div>
              <div className="@[190px]:hidden block h-5" aria-hidden="true" />
              {/* Error badge visible ≥220px */}
              <div className="mt-1 @[220px]:block hidden">
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              </div>
              {/* Placeholder for badge when hidden <220px to preserve layout (exact element, invisible) */}
              <div className="mt-1 @[220px]:hidden block" aria-hidden="true">
                <Badge variant="destructive" className="text-xs invisible">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Right sidebar: two stacked blocks with fixed spacing and padding */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0 w-[72px] pt-2 pb-1 overflow-visible">
          <div className="overflow-visible">
            <ResponsiveTopHeroes player={player} heroes={heroes} index={index} />
          </div>
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <div className="@[200px]:flex hidden">
              <PlayerExternalSiteButton
                playerId={player.profile.profile.account_id}
                preferredSite={preferredExternalSite}
                size="sm"
              />
              {onRefresh && (
                <RefreshButton
                  key={`refresh-${player.profile.profile.account_id}`}
                  onClick={async () => {
                    try {
                      await onRefresh(player.profile.profile.account_id);
                    } catch (error) {
                      console.error('Error refreshing player:', error);
                    }
                  }}
                  ariaLabel={`Refresh ${player.profile.profile.personaname}`}
                />
              )}
                {isManual && (
                  <div className="@[145px]:flex hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit player"
                      onClick={() => onEditPlayer?.(player.profile.profile.account_id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove player"
                      onClick={() => onRemovePlayer?.(player.profile.profile.account_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
            </div>
            {/* Placeholder occupies the same space when buttons are hidden */}
            <div className="@[200px]:hidden flex w-[72px] h-8" aria-hidden="true" />
          </div>
        </div>
      </div>
    </CardContent>
  );
};

const PlayerListRow: React.FC<PlayerListRowProps> = ({
  player,
  isSelected,
  index,
  heroes,
  rank,
  onSelect,
  onRefresh,
  preferredExternalSite,
  isManual,
  onEditPlayer,
  onRemovePlayer
}) => {
  return (
    <Card
      key={player.profile.profile.account_id}
      className={`transition-all duration-200 w-full py-0 ${
        player.error
          ? 'border-destructive bg-destructive/5 cursor-not-allowed'
          : isSelected
          ? 'ring-2 ring-primary'
          : 'cursor-pointer hover:shadow-md'
      }`}
      onClick={() => {
        if (!player.error) onSelect(player.profile.profile.account_id);
      }}
      role="button"
      tabIndex={player.error ? -1 : 0}
      aria-label={
        player.error
          ? `${player.profile.profile.personaname} - Error: ${player.error}`
          : `Select ${player.profile.profile.personaname}`
      }
    >
      <div className="@[135px]:block hidden">
        <PlayerListRowContent
        player={player}
        index={index}
        heroes={heroes}
        rank={rank}
        onRefresh={onRefresh}
        preferredExternalSite={preferredExternalSite}
        isManual={isManual}
        onEditPlayer={onEditPlayer}
        onRemovePlayer={onRemovePlayer}
        />
      </div>
      {/* Card disappears entirely under 35px */}
      <div className="@[135px]:hidden block h-[134px]" aria-hidden="true" />
    </Card>
  );
};

// Card tile used by card mode
interface PlayerCardTileProps {
  player: Player;
  isSelected: boolean;
  index: number;
  heroes: Record<string, Hero>;
  rank: PlayerRank | null;
  onSelect: (playerId: number) => void;
  onRefresh?: (playerId: number) => void | Promise<void>;
  preferredExternalSite: PreferredExternalSite;
  isManual?: boolean;
  onEditPlayer?: (playerId: number) => void;
  onRemovePlayer?: (playerId: number) => void;
}

const PlayerCardTile: React.FC<PlayerCardTileProps> = ({
  player,
  isSelected,
  index,
  heroes,
  rank,
  onSelect,
  onRefresh,
  preferredExternalSite,
  isManual = false,
  onEditPlayer,
  onRemovePlayer
}) => {
  const totalGames = player.wl.win + player.wl.lose;
  const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;

  return (
    <Card
      key={player.profile.profile.account_id}
      className={`transition-all w-full py-0 ${
        player.error
          ? 'border-destructive bg-destructive/5 cursor-not-allowed'
          : isSelected
          ? 'ring-2 ring-primary'
          : 'cursor-pointer hover:shadow-md'
      }`}
      onClick={() => {
        if (!player.error) onSelect(player.profile.profile.account_id);
      }}
      role="button"
      tabIndex={player.error ? -1 : 0}
      aria-label={
        player.error
          ? `${player.profile.profile.personaname} - Error: ${player.error}`
          : `Select ${player.profile.profile.personaname}`
      }
    >
      <CardContent className="p-4 @container h-[255px]" style={{ containerType: 'inline-size' }}>
        <div className="flex flex-col items-center space-y-3 mb-3">
          <PlayerAvatar 
            player={player}
            avatarSize={{ width: 'w-16', height: 'h-16' }}
            showLink={false}
          />
          <div className="text-center w-full min-w-0 overflow-hidden">
            <div className="font-medium truncate">
              {player.profile.profile.personaname}
            </div>
            {!player.error ? (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground h-4 truncate w-full @container">
                <div className="@[120px]:flex hidden items-center justify-center">
                  {rank ? (
                    <div className="flex items-center justify-center">
                      {renderRank(rank)}
                    </div>
                  ) : (
                    '\u00A0'
                  )}
                </div>
                <div className="@[120px]:hidden block h-4" aria-hidden="true" />
              </div>
            ) : (
              <div className="h-4 flex items-center justify-center text-destructive w-full max-w-full">
                <span className="text-sm font-medium leading-none truncate">Failed to fetch player</span>
              </div>
            )}
          </div>
        </div>
        <>
          {/* Stats placeholder to keep height consistent */}
          {/* Reserve a consistent line beneath the name for stats or spacing */}
          <div className="mb-2 h-4 @[190px]:block hidden" aria-hidden={player.error ? 'true' : 'false'}>
            {!player.error && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground text-center truncate">
                <span>{totalGames}</span>
                <span className="@[200px]:inline hidden">&nbsp;Games</span>
                <span className="mx-1">•</span>
                <span>{winRate.toFixed(1)}%</span>
                <span className="@[200px]:inline hidden">&nbsp;Win Rate</span>
              </p>
            )}
          </div>
          <div className="@[190px]:hidden block h-4 mb-2" aria-hidden="true" />
          <div className="flex flex-col items-center gap-2">
            <div className="text-center overflow-hidden">
              <div className="h-8 flex items-center justify-center">
                {player.error ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                ) : (
                  <ResponsiveTopHeroesCard player={player} heroes={heroes} index={index} />
                )}
              </div>
            </div>
            <div
              className="flex justify-center gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <PlayerExternalSiteButton
                playerId={player.profile.profile.account_id}
                preferredSite={preferredExternalSite}
                size="sm"
              />
              {onRefresh && (
                <RefreshButton
                  key={`refresh-${player.profile.profile.account_id}`}
                  onClick={async () => {
                    try {
                      await onRefresh(player.profile.profile.account_id);
                    } catch (error) {
                      console.error('Error refreshing player:', error);
                    }
                  }}
                  ariaLabel={`Refresh ${player.profile.profile.personaname}`}
                />
              )}
                {isManual && (
                  <div className="@[145px]:flex hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit player"
                      onClick={() => onEditPlayer?.(player.profile.profile.account_id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove player"
                      onClick={() => onRemovePlayer?.(player.profile.profile.account_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </>
      </CardContent>
    </Card>
  );
};

export const PlayerListView: React.FC<PlayerListViewProps> = React.memo(({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onRefreshPlayer,
  viewMode,
  manualPlayerIds,
  onEditPlayer,
  onRemovePlayer,
}) => {
  // Match the responsive grid behavior used by the match list card view
  const useResponsiveGrid = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      // Guard for environments without ResizeObserver (e.g., jsdom tests)
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width;
        const newColumns = Math.floor(width / 200) || 1;
        setColumns(newColumns);
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, [containerRef?.current?.offsetWidth]);

    return { containerRef, columns };
  };

  const { containerRef, columns } = useResponsiveGrid();
  const { heroes } = useConstantsContext();
  const config = useConfigContext();

  // Memoize player data processing to prevent unnecessary re-renders
  const processedPlayers = useMemo(() => {
    return players.map(player => ({
      ...player,
      rank: processPlayerRank(player.profile.rank_tier, player.profile.leaderboard_rank),
      topHeroes: getTopHeroes(player, heroes)
    }));
  }, [players, heroes]);

  const handlePlayerClick = (playerId: number) => {
    onSelectPlayer?.(playerId);
  };

  if (viewMode === 'list') {
    return (
      <div className="grid gap-2 w-full">
        {processedPlayers.map((player, index) => (
          <div
            key={player.profile.profile.account_id}
            data-player-id={player.profile.profile.account_id}
          >
            <PlayerListRow
              player={player}
              isSelected={selectedPlayerId === player.profile.profile.account_id}
              index={index}
              heroes={heroes}
              rank={player.rank}
              onSelect={handlePlayerClick}
              onRefresh={onRefreshPlayer}
              preferredExternalSite={config.config.preferredExternalSite}
              isManual={manualPlayerIds?.has(player.profile.profile.account_id)}
              onEditPlayer={onEditPlayer}
              onRemovePlayer={onRemovePlayer}
            />
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div
        ref={containerRef}
        className="grid gap-2 w-full"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {processedPlayers.map((player, index) => (
          <div
            key={player.profile.profile.account_id}
            data-player-id={player.profile.profile.account_id}
          >
            <PlayerCardTile
              player={player}
              isSelected={selectedPlayerId === player.profile.profile.account_id}
              index={index}
              heroes={heroes}
              rank={player.rank}
              onSelect={handlePlayerClick}
              onRefresh={onRefreshPlayer}
              preferredExternalSite={config.config.preferredExternalSite}
              isManual={manualPlayerIds?.has(player.profile.profile.account_id)}
              onEditPlayer={onEditPlayer}
              onRemovePlayer={onRemovePlayer}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
});

PlayerListView.displayName = 'PlayerListView'; 
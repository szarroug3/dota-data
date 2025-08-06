import React, { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Player } from '@/types/contexts/player-context-value';
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
}

// Helper function to render rank display
const renderRank = (rank: any) => {
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

// Helper function to get top 5 heroes
const getTopHeroes = (player: Player, heroes: Record<string, any>) => {
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

// Helper function to render top heroes
const renderTopHeroes = (player: Player, heroes: Record<string, any>, index?: number) => {
  const topHeroes = getTopHeroes(player, heroes);
  
  if (topHeroes.length === 0) {
    return (
      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
        No hero data
      </div>
    );
  }
  
  // Use the same size as match list for consistency
  const avatarSize = { width: 'w-8', height: 'h-8' };
  
  // Determine tooltip position based on index
  const isFirstItem = index === 0;
  const tooltipPosition = isFirstItem ? 'top-full mt-1' : 'bottom-full mb-1';
  
  return (
    <div className="flex items-center gap-1">
      {topHeroes.map((heroData, heroIndex) => (
        <div key={heroIndex} className="relative group">
          <HeroAvatar 
            hero={heroData.hero}
            avatarSize={avatarSize}
          />
          <div className={`absolute left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center ${tooltipPosition}`}>
            {heroData.hero.localizedName}
            <br />
            {heroData.games} games • {heroData.winRate.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
};

export const PlayerListView: React.FC<PlayerListViewProps> = React.memo(({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onRefreshPlayer,
  viewMode,
}) => {
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
      <div className="space-y-2 w-full overflow-hidden">
        {processedPlayers.map((player, index) => {
          const totalGames = player.wl.win + player.wl.lose;
          const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
          const isSelected = selectedPlayerId === player.profile.profile.account_id;

          return (
            <Card
              key={player.profile.profile.account_id}
              className={`transition-all duration-200 w-full overflow-hidden ${
                isSelected 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'cursor-pointer hover:shadow-md'
              }`}
              onClick={() => handlePlayerClick(player.profile.profile.account_id)}
            >
              <CardContent>
                <div className="flex items-center space-x-4">
                  <PlayerAvatar 
                    player={player}
                    avatarSize={{ width: 'w-12', height: 'h-12' }}
                    showLink={false}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-semibold truncate">
                      {player.profile.profile.personaname}
                    </h3>
                    {player.rank && (
                      <div className="mt-1 overflow-hidden">
                        {renderRank(player.rank)}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 truncate">
                      {totalGames} games • {winRate.toFixed(1)}% win rate
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-0">
                    <div className="text-right overflow-hidden">
                      {renderTopHeroes(player, heroes, index)}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <PlayerExternalSiteButton
                        playerId={player.profile.profile.account_id}
                        preferredSite={config.config.preferredExternalSite}
                        size="sm"
                      />
                      {onRefreshPlayer && (
                        <RefreshButton
                          key={`refresh-${player.profile.profile.account_id}`}
                          onClick={async () => {
                            try {
                              console.log('Refresh button clicked for player:', player.profile.profile.account_id);
                              await onRefreshPlayer(player.profile.profile.account_id);
                            } catch (error) {
                              console.error('Error refreshing player:', error);
                            }
                          }}
                          ariaLabel={`Refresh ${player.profile.profile.personaname}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full overflow-hidden">
        {processedPlayers.map((player, index) => {
          const totalGames = player.wl.win + player.wl.lose;
          const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
          const isSelected = selectedPlayerId === player.profile.profile.account_id;

          return (
            <Card
              key={player.profile.profile.account_id}
              className={`transition-all w-full overflow-hidden ${
                isSelected 
                  ? 'ring-2 ring-primary' 
                  : 'cursor-pointer hover:shadow-md'
              }`}
              onClick={() => handlePlayerClick(player.profile.profile.account_id)}
            >
              <CardContent className="p-4">
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
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground h-4 flex items-center justify-center truncate">
                      {player.rank ? player.rank.displayText : '\u00A0'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mb-2 text-center truncate">
                  {totalGames} games • {winRate.toFixed(1)}%
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center overflow-hidden">
                    {renderTopHeroes(player, heroes, index)}
                  </div>
                  <div className="flex justify-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <PlayerExternalSiteButton
                      playerId={player.profile.profile.account_id}
                      preferredSite={config.config.preferredExternalSite}
                      size="sm"
                    />
                    {onRefreshPlayer && (
                      <RefreshButton
                        key={`refresh-${player.profile.profile.account_id}`}
                        onClick={async () => {
                          try {
                            console.log('Refresh button clicked for player:', player.profile.profile.account_id);
                            await onRefreshPlayer(player.profile.profile.account_id);
                          } catch (error) {
                            console.error('Error refreshing player:', error);
                          }
                        }}
                        ariaLabel={`Refresh ${player.profile.profile.personaname}`}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return null;
});

PlayerListView.displayName = 'PlayerListView'; 
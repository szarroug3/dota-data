import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerRank } from '@/utils/player-statistics';

interface PlayerDetailsPanelSummaryProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Helper function to render rank display
const renderRank = (rank: any) => {
  if (!rank) return null;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-foreground dark:text-foreground">
        {rank.displayText}
      </span>
      {!rank.isImmortal && rank.stars > 0 && (
        <div className="flex space-x-1">
          {Array.from({ length: rank.stars }, (_, i) => (
            <span key={i} className="text-yellow-500">★</span>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: any) => (
  <div className="flex items-center space-x-2">
    <HeroAvatar 
      hero={hero}
      avatarSize={{ width: 'w-8', height: 'h-8' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground">
      {hero.localizedName}
    </span>
  </div>
);

export const PlayerDetailsPanelSummary: React.FC<PlayerDetailsPanelSummaryProps> = ({
  player,
  allPlayers = [],
  hiddenPlayerIds = new Set(),
}) => {
  const { heroes } = useConstantsContext();
  const rank = processPlayerRank(player.profile.rank_tier);
  
  // Get top 5 heroes by games played
  const topHeroes = player.heroes
    .sort((a, b) => b.games - a.games)
    .slice(0, 5)
    .map(hero => {
      const heroData = heroes[hero.hero_id.toString()];
      return {
        hero: heroData || {
          id: hero.hero_id.toString(),
          name: `npc_dota_hero_${hero.hero_id}`,
          localizedName: `Hero ${hero.hero_id}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: ''
        },
        games: hero.games,
        wins: hero.win,
        winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0
      };
    });

  const totalGames = player.wl.win + player.wl.lose;
  const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Rank</div>
            <div className="text-foreground dark:text-foreground">
              {rank ? renderRank(rank) : <span className="text-muted-foreground">Not calibrated</span>}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Total Games</div>
            <div className="text-foreground dark:text-foreground">{totalGames}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
            <div className="text-foreground dark:text-foreground">{winRate.toFixed(1)}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Wins</div>
            <div className="text-foreground dark:text-foreground">{player.wl.win}</div>
          </div>
        </div>
      </div>

      {/* Top Heroes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Top Heroes</h3>
        <div className="space-y-2">
          {topHeroes.map((hero, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  #{index + 1}
                </span>
                {renderHeroWithAvatar(hero.hero)}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(1)}%</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Performance */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Recent Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground dark:text-foreground">
              {player.recentMatches.length}
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Recent Matches</div>
          </div>
          <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground dark:text-foreground">
              {player.heroes.length}
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Heroes Played</div>
          </div>
          <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground dark:text-foreground">
              {player.rankings.length}
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Rankings</div>
          </div>
          <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground dark:text-foreground">
              {player.ratings.length}
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Ratings</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
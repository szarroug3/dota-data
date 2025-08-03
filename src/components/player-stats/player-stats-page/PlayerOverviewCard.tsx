import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';

import { PlayerAvatar } from './PlayerAvatar';
import type { PlayerStats } from './usePlayerStats';

interface PlayerOverviewCardProps {
  player: PlayerStats;
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
            <span key={i} className="text-yellow-500 text-xs">★</span>
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
      hero={hero.hero}
      avatarSize={{ width: 'w-5', height: 'h-5' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground text-sm">
      {hero.hero.localizedName}
    </span>
  </div>
);

export const PlayerOverviewCard: React.FC<PlayerOverviewCardProps> = ({ player }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <PlayerAvatar 
          player={player.player}
          avatarSize={{ width: 'w-12', height: 'h-12' }}
          showLink={true}
        />
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
            {player.playerName}
          </h3>
          {player.detailedStats?.rank && renderRank(player.detailedStats.rank)}
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {player.totalMatches} matches • {player.winRate.toFixed(1)}% win rate
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-8 text-sm">
        <div className="text-center">
          <div className="font-semibold text-foreground dark:text-foreground">
            {player.averageKDA.toFixed(2)}
          </div>
          <div className="text-muted-foreground dark:text-muted-foreground">K/D/A</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground dark:text-foreground">
            {player.averageGPM.toFixed(0)}
          </div>
          <div className="text-muted-foreground dark:text-muted-foreground">GPM</div>
        </div>
        <div className="text-center">
          {player.detailedStats?.topHeroesAllTime?.[0] ? (
            renderHeroWithAvatar(player.detailedStats.topHeroesAllTime[0])
          ) : (
            <div>
              <div className="font-semibold text-foreground dark:text-foreground">
                {player.mostPlayedHero.heroName}
              </div>
              <div className="text-muted-foreground dark:text-muted-foreground">Most Played</div>
            </div>
          )}
        </div>
        <div className="flex space-x-1">
          {player.recentPerformance.lastFiveMatches.map((match, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                match.win ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {match.win ? 'W' : 'L'}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
); 
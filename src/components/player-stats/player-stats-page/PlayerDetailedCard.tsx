import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';

import { PlayerAvatar } from './PlayerAvatar';
import type { PlayerStats } from './usePlayerStats';

interface PlayerDetailedCardProps {
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
      hero={hero.hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground">
      {hero.hero.localizedName}
    </span>
  </div>
);

// Helper function to render hero usage section
const renderHeroUsage = (heroes: any[], title: string) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">{title}</h4>
    <div className="space-y-1">
      {heroes.map((hero, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          {renderHeroWithAvatar(hero)}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              {hero.games} games
            </span>
            <span className="text-xs font-medium">
              {hero.winRate.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render team role statistics
const renderTeamRoles = (roles: any[]) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">Team Roles</h4>
    <div className="space-y-1">
      {roles.map((role, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground dark:text-muted-foreground">
            {role.role}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              {role.games} games
            </span>
            <span className="text-xs font-medium">
              {role.winRate.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render team hero statistics
const renderTeamHeroes = (heroes: any[]) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">Team Heroes</h4>
    <div className="space-y-1">
      {heroes.map((hero, index) => (
        <div key={index} className="text-sm">
          <div className="flex items-center justify-between">
            {renderHeroWithAvatar(hero)}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                {hero.games} games
              </span>
              <span className="text-xs font-medium">
                {hero.winRate.toFixed(1)}%
              </span>
            </div>
          </div>
          {hero.roles && hero.roles.length > 0 && (
            <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 ml-8">
              Roles: {hero.roles.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render performance trend badge
const renderPerformanceTrend = (trend: string) => {
  const getTrendClasses = () => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTrendClasses()}`}>
      {trend.charAt(0).toUpperCase() + trend.slice(1)}
    </span>
  );
};

// Helper function to render stat card
const renderStatCard = (value: number, label: string, format: (val: number) => string) => (
  <div className="text-center">
    <div className="font-semibold text-foreground dark:text-foreground">
      {format(value)}
    </div>
    <div className="text-muted-foreground dark:text-muted-foreground">{label}</div>
  </div>
);

// Helper function to render recent matches
const renderRecentMatches = (matches: Array<{ win: boolean }>) => (
  <div className="flex space-x-1">
    {matches.map((match, index) => (
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
);

export const PlayerDetailedCard: React.FC<PlayerDetailedCardProps> = ({ player }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        <PlayerAvatar 
          player={player.player}
          avatarSize={{ width: 'w-16', height: 'h-16' }}
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
      <div className="flex flex-col items-end space-y-2">
        {renderPerformanceTrend(player.recentPerformance.trend)}
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {renderStatCard(player.averageKills, 'Avg Kills', (val) => val.toFixed(1))}
      {renderStatCard(player.averageDeaths, 'Avg Deaths', (val) => val.toFixed(1))}
      {renderStatCard(player.averageAssists, 'Avg Assists', (val) => val.toFixed(1))}
      {renderStatCard(player.averageKDA, 'Avg KDA', (val) => val.toFixed(2))}
      {renderStatCard(player.averageGPM, 'Avg GPM', (val) => val.toFixed(0))}
      {renderStatCard(player.averageXPM, 'Avg XPM', (val) => val.toFixed(0))}
    </div>
    
    {player.detailedStats && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {player.detailedStats.topHeroesAllTime.length > 0 && 
            renderHeroUsage(player.detailedStats.topHeroesAllTime, 'Top Heroes (All Time)')}
          {player.detailedStats.topHeroesRecent.length > 0 && 
            renderHeroUsage(player.detailedStats.topHeroesRecent, 'Top Heroes (Recent)')}
        </div>
        <div className="space-y-4">
          {player.detailedStats.teamRoles.length > 0 && 
            renderTeamRoles(player.detailedStats.teamRoles)}
          {player.detailedStats.teamHeroes.length > 0 && 
            renderTeamHeroes(player.detailedStats.teamHeroes)}
        </div>
      </div>
    )}
    
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">Recent Performance</h4>
      {renderRecentMatches(player.recentPerformance.lastFiveMatches)}
    </div>
  </div>
); 
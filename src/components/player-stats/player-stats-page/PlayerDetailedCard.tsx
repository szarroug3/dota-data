import React from 'react';

import type { PlayerStats } from './usePlayerStats';

interface PlayerDetailedCardProps {
  player: PlayerStats;
}

// Helper function to render player avatar
const renderPlayerAvatar = (player: PlayerStats) => (
  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
    {player.avatar ? (
      <img src={player.avatar} alt={player.playerName} className="w-16 h-16 rounded-full" />
    ) : (
      <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
        {player.playerName.charAt(0).toUpperCase()}
      </span>
    )}
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
        return 'bg-gray-100 text-gray-800';
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
    <div className="font-semibold text-gray-900 dark:text-white">
      {format(value)}
    </div>
    <div className="text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);

// Helper function to render hero info
const renderHeroInfo = (hero: { heroName: string; matches: number; winRate: number; averageKDA?: number }) => (
  <div className="flex items-center space-x-3">
    <span className="font-medium text-gray-900 dark:text-white">{hero.heroName}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400">{hero.matches} matches</span>
    <span className="text-xs text-gray-500 dark:text-gray-400">{hero.winRate.toFixed(1)}% win rate</span>
    {hero.averageKDA && (
      <span className="text-xs text-gray-500 dark:text-gray-400">Avg KDA: {hero.averageKDA.toFixed(2)}</span>
    )}
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
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        {renderPlayerAvatar(player)}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {player.playerName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {player.totalMatches} matches • {player.winRate.toFixed(1)}% win rate
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        {renderPerformanceTrend(player.recentPerformance.trend)}
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {renderStatCard(player.averageKills, 'Avg Kills', (val) => val.toFixed(1))}
      {renderStatCard(player.averageDeaths, 'Avg Deaths', (val) => val.toFixed(1))}
      {renderStatCard(player.averageAssists, 'Avg Assists', (val) => val.toFixed(1))}
      {renderStatCard(player.averageKDA, 'Avg KDA', (val) => val.toFixed(2))}
      {renderStatCard(player.averageGPM, 'Avg GPM', (val) => val.toFixed(0))}
      {renderStatCard(player.averageXPM, 'Avg XPM', (val) => val.toFixed(0))}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Most Played Hero</h4>
        {renderHeroInfo(player.mostPlayedHero)}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Best Performance Hero</h4>
        {renderHeroInfo(player.bestPerformanceHero)}
      </div>
    </div>
    
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent Performance</h4>
      {renderRecentMatches(player.recentPerformance.lastFiveMatches)}
    </div>
  </div>
); 
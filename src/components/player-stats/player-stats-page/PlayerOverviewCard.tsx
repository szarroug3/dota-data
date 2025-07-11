import React from 'react';

import type { PlayerStats } from './usePlayerStats';

interface PlayerOverviewCardProps {
  player: PlayerStats;
}

export const PlayerOverviewCard: React.FC<PlayerOverviewCardProps> = ({ player }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          {player.avatar ? (
            <img src={player.avatar} alt={player.playerName} className="w-12 h-12 rounded-full" />
          ) : (
            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
              {player.playerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {player.playerName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {player.totalMatches} matches • {player.winRate.toFixed(1)}% win rate
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-8 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {player.averageKDA.toFixed(2)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">K/D/A</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {player.averageGPM.toFixed(0)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">GPM</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {player.mostPlayedHero.heroName}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Most Played</div>
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
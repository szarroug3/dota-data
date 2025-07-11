import React from 'react';

import type { PlayerPerformance } from './useMatchDetails';

interface PlayerPerformanceSectionProps {
  players: PlayerPerformance[];
  level: 'basic' | 'advanced' | 'expert';
  formatNumber: (num: number) => string;
  getKDAColor: (kda: number) => string;
}

interface PlayerRowProps {
  player: PlayerPerformance;
  formatNumber: (num: number) => string;
  getKDAColor: (kda: number) => string;
  level: 'basic' | 'advanced' | 'expert';
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player, formatNumber, getKDAColor, level }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex items-center space-x-3 flex-1">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {player.playerName.charAt(0)}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {player.playerName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Lvl {player.level}
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {player.heroName}
        </div>
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      {/* KDA */}
      <div className="text-center">
        <div className={`text-sm font-medium ${getKDAColor(player.kda)}`}>
          {player.kills}/{player.deaths}/{player.assists}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          KDA: {player.kda.toFixed(2)}
        </div>
      </div>
      
      {/* GPM/XPM */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatNumber(player.gpm)}/{formatNumber(player.xpm)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          GPM/XPM
        </div>
      </div>
      
      {/* Advanced stats */}
      {level !== 'basic' && (
        <>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {player.lastHits}/{player.denies}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              LH/DN
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(player.netWorth)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Net Worth
            </div>
          </div>
        </>
      )}
      
      {/* Expert stats */}
      {level === 'expert' && (
        <>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(player.heroDamage)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hero DMG
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(player.towerDamage)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Tower DMG
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {player.items.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Items
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

export const PlayerPerformanceSection: React.FC<PlayerPerformanceSectionProps> = ({ 
  players, 
  level, 
  formatNumber, 
  getKDAColor 
}) => {
  const radiantPlayers = players.filter(p => p.side === 'radiant');
  const direPlayers = players.filter(p => p.side === 'dire');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Player Performance</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-green-600 mb-3">Radiant</h3>
          <div className="space-y-2">
            {radiantPlayers.map((player) => (
              <PlayerRow 
                key={player.playerId} 
                player={player} 
                formatNumber={formatNumber}
                getKDAColor={getKDAColor}
                level={level}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-red-600 mb-3">Dire</h3>
          <div className="space-y-2">
            {direPlayers.map((player) => (
              <PlayerRow 
                key={player.playerId} 
                player={player} 
                formatNumber={formatNumber}
                getKDAColor={getKDAColor}
                level={level}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
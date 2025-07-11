import React from 'react';

import type { DetailedMatch } from './useMatchDetails';

interface DraftPhaseSectionProps {
  picks: DetailedMatch['picks'];
  bans: DetailedMatch['bans'];
}

export const DraftPhaseSection: React.FC<DraftPhaseSectionProps> = ({ picks, bans }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Draft Phase</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Picks</h3>
        <div className="space-y-2">
          {picks.map((pick, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  #{pick.order}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pick.heroName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pick.playerName}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pick.team === 'radiant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {pick.team}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Bans</h3>
        <div className="space-y-2">
          {bans.map((ban, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  #{ban.order}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {ban.heroName}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                ban.team === 'radiant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {ban.team}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
); 
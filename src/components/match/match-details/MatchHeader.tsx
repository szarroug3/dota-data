import React from 'react';

import type { DetailedMatch } from './useMatchDetails';

interface MatchHeaderProps {
  match: DetailedMatch;
  onClose?: () => void;
  formatDuration: (seconds: number) => string;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match, onClose, formatDuration }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          Match #{match.id}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
            {formatDuration(match.duration)}
          </span>
        </div>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close match details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-green-600">{match.radiantScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Radiant</div>
      </div>
      
      <div className="text-center">
        <div className={`text-2xl font-bold ${match.winner === 'radiant' ? 'text-green-600' : 'text-red-600'}`}>
          {match.winner === 'radiant' ? 'Radiant Victory' : 'Dire Victory'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Winner</div>
      </div>
      
      <div className="text-center">
        <div className="text-3xl font-bold text-red-600">{match.direScore}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Dire</div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-500 dark:text-gray-400">Game Mode:</span>
        <span className="ml-2 font-medium text-gray-900 dark:text-white">{match.gameMode}</span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Patch:</span>
        <span className="ml-2 font-medium text-gray-900 dark:text-white">{match.patch}</span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Total Kills:</span>
        <span className="ml-2 font-medium text-gray-900 dark:text-white">{match.totalKills}</span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Roshan Kills:</span>
        <span className="ml-2 font-medium text-gray-900 dark:text-white">{match.objectives.roshan}</span>
      </div>
    </div>
  </div>
); 
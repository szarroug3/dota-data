import React from 'react';

import type { HeroSuggestion } from '@/hooks/useDraftSuggestions';

interface HeroSuggestionCardProps {
  hero: HeroSuggestion;
  onSelect: () => void;
  actionType: 'pick' | 'ban';
  isYourTurn: boolean;
}

export const HeroSuggestionCard: React.FC<HeroSuggestionCardProps> = ({ 
  hero, 
  onSelect, 
  actionType, 
  isYourTurn 
}) => {
  const getPriorityClass = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-gray-500';
    }
  };

  const getActionClass = (type: 'pick' | 'ban') => {
    return type === 'pick' 
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-red-600 hover:bg-red-700';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${getPriorityClass(hero.priority)}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{hero.heroName}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{hero.roles.join(', ')}</p>
        </div>
        <button
          onClick={onSelect}
          disabled={!isYourTurn}
          className={`px-3 py-1 text-white rounded-md transition-colors text-sm font-semibold ${getActionClass(actionType)} disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {actionType === 'pick' ? 'Pick' : 'Ban'}
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Win Rate:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{hero.winRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Pick Rate:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{hero.pickRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Ban Rate:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{hero.banRate.toFixed(2)}%</span>
        </div>
      </div>

      <div className="mt-3">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reasons:</h5>
        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {hero.reasons.map(reason => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </div>
  );
}; 
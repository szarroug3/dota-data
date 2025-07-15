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
    <div className={`bg-card dark:bg-card rounded-lg shadow-md p-4 border-l-4 ${getPriorityClass(hero.priority)}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg text-foreground dark:text-foreground">{hero.heroName}</h4>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">{hero.roles.join(', ')}</p>
        </div>
        <button
          onClick={onSelect}
          disabled={!isYourTurn}
          className={`px-3 py-1 text-white rounded-md transition-colors text-sm font-semibold ${getActionClass(actionType)} disabled:bg-muted disabled:cursor-not-allowed`}
        >
          {actionType === 'pick' ? 'Pick' : 'Ban'}
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground dark:text-muted-foreground">Win Rate:</span>
          <span className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground dark:text-muted-foreground">Pick Rate:</span>
          <span className="font-semibold text-foreground dark:text-foreground">{hero.pickRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground dark:text-muted-foreground">Ban Rate:</span>
          <span className="font-semibold text-foreground dark:text-foreground">{hero.banRate.toFixed(2)}%</span>
        </div>
      </div>

      <div className="mt-3">
        <h5 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground mb-1">Reasons:</h5>
        <ul className="list-disc list-inside text-xs text-muted-foreground dark:text-muted-foreground space-y-1">
          {hero.reasons.map(reason => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </div>
  );
}; 
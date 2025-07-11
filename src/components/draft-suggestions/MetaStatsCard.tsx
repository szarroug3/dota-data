import React from 'react';

import type { HeroSuggestion } from '@/hooks/useDraftSuggestions';

interface MetaStatsCardProps {
  title: string;
  heroes: HeroSuggestion[];
}

export const MetaStatsCard: React.FC<MetaStatsCardProps> = ({ title, heroes }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h4 className="font-semibold text-md mb-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        {title}
      </h4>
      <ul className="space-y-2 text-sm">
        {heroes.map(hero => (
          <li key={hero.heroId} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
            <span>{hero.heroName}</span>
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {title.includes('Pick') ? `${hero.pickRate.toFixed(1)}%` : 
               title.includes('Ban') ? `${hero.banRate.toFixed(1)}%` : 
               `${hero.winRate.toFixed(1)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
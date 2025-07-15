import React from 'react';

import type { HeroSuggestion } from '@/hooks/useDraftSuggestions';

interface MetaStatsCardProps {
  title: string;
  heroes: HeroSuggestion[];
}

export const MetaStatsCard: React.FC<MetaStatsCardProps> = ({ title, heroes }) => {
  return (
    <div className="bg-card dark:bg-card rounded-lg shadow-md p-4">
      <h4 className="font-semibold text-md mb-3 text-foreground dark:text-foreground border-b border-border dark:border-border pb-2">
        {title}
      </h4>
      <ul className="space-y-2 text-sm">
        {heroes.map(hero => (
          <li key={hero.heroId} className="flex justify-between items-center text-muted-foreground dark:text-muted-foreground">
            <span>{hero.heroName}</span>
            <span className="font-mono text-xs bg-muted dark:bg-muted px-2 py-1 rounded">
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
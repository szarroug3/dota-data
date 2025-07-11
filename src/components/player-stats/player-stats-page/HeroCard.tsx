import React from 'react';

interface HeroCardProps {
  title: string;
  hero: {
    heroName: string;
    matches: number;
    winRate: number;
    averageKDA?: number;
  };
}

export const HeroCard: React.FC<HeroCardProps> = ({ title, hero }) => (
  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</div>
    <div className="text-lg font-semibold text-gray-900 dark:text-white">{hero.heroName}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{hero.matches} matches</div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{hero.winRate.toFixed(1)}% win rate</div>
    {hero.averageKDA !== undefined && (
      <div className="text-xs text-gray-500 dark:text-gray-400">Avg KDA: {hero.averageKDA.toFixed(2)}</div>
    )}
  </div>
); 
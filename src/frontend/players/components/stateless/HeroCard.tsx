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
  <div className="bg-muted dark:bg-muted rounded-lg p-4">
    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">{title}</div>
    <div className="text-lg font-semibold text-foreground dark:text-foreground">{hero.heroName}</div>
    <div className="text-xs text-muted-foreground dark:text-muted-foreground">{hero.matches} Matches</div>
    <div className="text-xs text-muted-foreground dark:text-muted-foreground">{hero.winRate.toFixed(1)}% Win Rate</div>
    {hero.averageKDA !== undefined && (
      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
        Avg KDA: {hero.averageKDA.toFixed(2)}
      </div>
    )}
  </div>
);

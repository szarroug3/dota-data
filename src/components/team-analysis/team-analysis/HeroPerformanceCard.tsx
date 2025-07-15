import React from 'react';

interface HeroPerformanceCardProps {
  title: string;
  heroes: Array<{
    heroName: string;
    winRate: number;
    matches: number;
    averageKDA: number;
  }>;
  type: 'success' | 'underperform';
}

export const HeroPerformanceCard: React.FC<HeroPerformanceCardProps> = ({ title, heroes, type }) => {
  const bgColor = type === 'success' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

  const textColor = type === 'success'
    ? 'text-success dark:text-success'
    : 'text-destructive dark:text-destructive';

  return (
    <div className={`${bgColor} border rounded-lg p-4`}>
      <h4 className={`font-semibold ${textColor} mb-3`}>{title}</h4>
      <div className="space-y-2">
        {heroes.map((hero, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground dark:text-foreground">{hero.heroName}</span>
            <div className="flex items-center space-x-3">
              <span className="text-muted-foreground dark:text-muted-foreground">{hero.matches} matches</span>
              <span className={`font-semibold ${type === 'success' ? 'text-success' : 'text-destructive'}`}>
                {hero.winRate.toFixed(1)}% WR
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
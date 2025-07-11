import React from 'react';

import { useTeamData } from '@/hooks/use-team-data';

export const PerformanceHighlights: React.FC = () => {
  const { teamData } = useTeamData();

  // Mock highlights data - in real implementation this would come from team data
  const highlights = {
    bestHero: {
      heroId: '1',
      heroName: 'Anti-Mage',
      gamesPlayed: 15,
      winRate: 73.3
    },
    recentTrend: 'improving' as const,
    mostPlayedHero: {
      heroId: '2',
      heroName: 'Crystal Maiden',
      gamesPlayed: 20,
      winRate: 65.0
    },
    keyStatistic: 'Won 3 of last 5 matches'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance Highlights
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HighlightCard
          title="Best Performing Hero"
          value={highlights.bestHero.heroName}
          subtitle={`${highlights.bestHero.gamesPlayed} games • ${highlights.bestHero.winRate}% win rate`}
          icon="🏆"
          color="green"
        />
        
        <HighlightCard
          title="Recent Trend"
          value={highlights.recentTrend === 'improving' ? 'Improving' : 'Declining'}
          subtitle="Last 10 matches"
          icon="📈"
          color={highlights.recentTrend === 'improving' ? 'green' : 'red'}
        />
        
        <HighlightCard
          title="Most Played Hero"
          value={highlights.mostPlayedHero.heroName}
          subtitle={`${highlights.mostPlayedHero.gamesPlayed} games • ${highlights.mostPlayedHero.winRate}% win rate`}
          icon="🎮"
          color="blue"
        />
        
        <HighlightCard
          title="Key Statistic"
          value={highlights.keyStatistic}
          subtitle="Recent performance"
          icon="💡"
          color="purple"
        />
      </div>
      
      {!teamData && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Add matches to see highlights
          </p>
        </div>
      )}
    </div>
  );
};

interface HighlightCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'green' | 'red' | 'blue' | 'purple';
}

const HighlightCard: React.FC<HighlightCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}) => {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`font-semibold ${colorClasses[color]}`}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}; 
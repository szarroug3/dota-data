import React from 'react';

interface TimePatternCardProps {
  title: string;
  performance: number;
  trend: 'improving' | 'declining' | 'stable';
}

export const TimePatternCard: React.FC<TimePatternCardProps> = ({ title, performance, trend }) => {
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
        {performance.toFixed(0)}%
      </div>
      <div className="flex items-center justify-center space-x-1">
        <span className="text-sm">{getTrendIcon(trend)}</span>
        <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}; 
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
      case 'improving': return 'text-success';
      case 'declining': return 'text-destructive';
      case 'stable': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card dark:bg-card rounded-lg shadow p-4 text-center">
      <h4 className="font-semibold text-foreground dark:text-foreground mb-2">{title}</h4>
      <div className="text-2xl font-bold text-primary dark:text-blue-400 mb-1">
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
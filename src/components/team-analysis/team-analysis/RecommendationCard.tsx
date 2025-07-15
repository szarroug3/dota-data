import React from 'react';

interface RecommendationCardProps {
  recommendation: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actionItems: string[];
  };
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-500 bg-accent dark:bg-accent';
      default: return 'border-gray-500 bg-muted dark:bg-background/20';
    }
  };

  const getPriorityTextColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-destructive dark:text-destructive';
      case 'medium': return 'text-yellow-800 dark:text-yellow-200';
      case 'low': return 'text-primary dark:text-primary';
      default: return 'text-foreground dark:text-foreground';
    }
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase ${getPriorityTextColor(recommendation.priority)}`}>
          {recommendation.priority} Priority
        </span>
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">{recommendation.category}</span>
      </div>
      <h4 className="font-semibold text-foreground dark:text-foreground mb-2">{recommendation.title}</h4>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">{recommendation.description}</p>
      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
        <strong>Action Items:</strong>
        <ul className="mt-1 space-y-1">
          {recommendation.actionItems.map((item, index) => (
            <li key={index} className="ml-4">• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 
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
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityTextColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-800 dark:text-red-200';
      case 'medium': return 'text-yellow-800 dark:text-yellow-200';
      case 'low': return 'text-blue-800 dark:text-blue-200';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase ${getPriorityTextColor(recommendation.priority)}`}>
          {recommendation.priority} Priority
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{recommendation.category}</span>
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{recommendation.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{recommendation.description}</p>
      <div className="text-xs text-gray-500 dark:text-gray-400">
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
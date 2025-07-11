import React from 'react';

interface WeaknessCardProps {
  weakness: {
    category: string;
    score: number;
    description: string;
    improvements: string[];
  };
}

export const WeaknessCard: React.FC<WeaknessCardProps> = ({ weakness }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-red-800 dark:text-red-200">{weakness.category}</h4>
        <span className="text-lg font-bold text-red-600 dark:text-red-400">{weakness.score.toFixed(0)}%</span>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300 mb-3">{weakness.description}</p>
      <div className="text-xs text-red-600 dark:text-red-400">
        <strong>Improvements:</strong> {weakness.improvements.join(', ')}
      </div>
    </div>
  );
}; 
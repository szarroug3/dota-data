import React from 'react';

interface StrengthCardProps {
  strength: {
    category: string;
    score: number;
    description: string;
    examples: string[];
  };
}

export const StrengthCard: React.FC<StrengthCardProps> = ({ strength }) => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-green-800 dark:text-green-200">{strength.category}</h4>
        <span className="text-lg font-bold text-green-600 dark:text-green-400">{strength.score.toFixed(0)}%</span>
      </div>
      <p className="text-sm text-green-700 dark:text-green-300 mb-3">{strength.description}</p>
      <div className="text-xs text-green-600 dark:text-green-400">
        <strong>Examples:</strong> {strength.examples.join(', ')}
      </div>
    </div>
  );
}; 
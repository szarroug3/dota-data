import React from 'react';

interface DetailLevelControlsProps {
  currentLevel: 'basic' | 'advanced' | 'expert';
  onLevelChange: (level: 'basic' | 'advanced' | 'expert') => void;
}

export const DetailLevelControls: React.FC<DetailLevelControlsProps> = ({ currentLevel, onLevelChange }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center justify-between">
      <h3 className="font-medium text-gray-900 dark:text-white">Detail Level</h3>
      <div className="flex items-center space-x-2">
        {(['basic', 'advanced', 'expert'] as const).map((levelOption) => (
          <button
            key={levelOption}
            onClick={() => onLevelChange(levelOption)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              currentLevel === levelOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {levelOption.charAt(0).toUpperCase() + levelOption.slice(1)}
          </button>
        ))}
      </div>
    </div>
  </div>
); 
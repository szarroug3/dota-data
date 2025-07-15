import React from 'react';

interface DetailLevelControlsProps {
  currentLevel: 'basic' | 'advanced' | 'expert';
  onLevelChange: (level: 'basic' | 'advanced' | 'expert') => void;
}

export const DetailLevelControls: React.FC<DetailLevelControlsProps> = ({ currentLevel, onLevelChange }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-sm border border-border dark:border-border p-4">
    <div className="flex items-center justify-between">
      <h3 className="font-medium text-foreground dark:text-foreground">Detail Level</h3>
      <div className="flex items-center space-x-2">
        {(['basic', 'advanced', 'expert'] as const).map((levelOption) => (
          <button
            key={levelOption}
            onClick={() => onLevelChange(levelOption)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              currentLevel === levelOption
                ? 'bg-blue-600 text-white'
                : 'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent'
            }`}
          >
            {levelOption.charAt(0).toUpperCase() + levelOption.slice(1)}
          </button>
        ))}
      </div>
    </div>
  </div>
); 
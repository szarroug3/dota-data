import React from 'react';

export const QuickActions: React.FC = () => {
  const handleAddMatch = () => {
    console.log('Add match action');
  };

  const handleViewAnalysis = () => {
    console.log('View team analysis');
  };

  const handleViewDraftSuggestions = () => {
    console.log('View draft suggestions');
  };

  const handleViewPlayerStats = () => {
    console.log('View player stats');
  };

  const handleViewMatchHistory = () => {
    console.log('View match history');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      
      <div className="space-y-3">
        <ActionButton
          title="Add Match"
          description="Add a new match to track"
          icon="➕"
          onClick={handleAddMatch}
          primary
        />
        
        <ActionButton
          title="Team Analysis"
          description="View detailed team performance"
          icon="📊"
          onClick={handleViewAnalysis}
        />
        
        <ActionButton
          title="Draft Suggestions"
          description="Get meta insights and recommendations"
          icon="🎯"
          onClick={handleViewDraftSuggestions}
        />
        
        <ActionButton
          title="Player Stats"
          description="View individual player performance"
          icon="👤"
          onClick={handleViewPlayerStats}
        />
        
        <ActionButton
          title="Match History"
          description="Browse all team matches"
          icon="📜"
          onClick={handleViewMatchHistory}
        />
      </div>
    </div>
  );
};

interface ActionButtonProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  primary = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border transition-colors ${
        primary
          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="text-left">
          <p className={`font-medium ${
            primary ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            {title}
          </p>
          <p className={`text-sm ${
            primary ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}; 
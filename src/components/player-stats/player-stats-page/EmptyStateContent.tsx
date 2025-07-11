import React from 'react';

interface EmptyStateContentProps {
  type: 'no-teams' | 'no-selection';
}

export const EmptyStateContent: React.FC<EmptyStateContentProps> = ({ type }) => {
  if (type === 'no-teams') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          No Teams Added
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add a team first to view player statistics.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Select a Team
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose a team from the sidebar to view player statistics.
      </p>
    </div>
  );
}; 
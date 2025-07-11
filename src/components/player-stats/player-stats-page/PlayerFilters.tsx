import React from 'react';

interface PlayerFiltersProps {
  viewType: 'overview' | 'detailed';
  sortBy: 'winRate' | 'kda' | 'gpm' | 'matches';
  sortDirection: 'asc' | 'desc';
  onViewTypeChange: (type: 'overview' | 'detailed') => void;
  onSortChange: (sortBy: 'winRate' | 'kda' | 'gpm' | 'matches') => void;
  onSortDirectionChange: () => void;
}

export const PlayerFilters: React.FC<PlayerFiltersProps> = ({
  viewType,
  sortBy,
  sortDirection,
  onViewTypeChange,
  onSortChange,
  onSortDirectionChange
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="flex items-center space-x-2">
      <label htmlFor="viewType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        View:
      </label>
      <select
        id="viewType"
        value={viewType}
        onChange={(e) => onViewTypeChange(e.target.value as typeof viewType)}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      >
        <option value="overview">Overview</option>
        <option value="detailed">Detailed</option>
      </select>
    </div>
    <div className="flex items-center space-x-2">
      <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sortBy"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      >
        <option value="winRate">Win Rate</option>
        <option value="kda">K/D/A</option>
        <option value="gpm">GPM</option>
        <option value="matches">Matches</option>
      </select>
    </div>
    <button
      onClick={onSortDirectionChange}
      className="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-md transition-colors text-sm"
    >
      {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
    </button>
  </div>
); 
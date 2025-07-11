import React from 'react';

// Define a minimal Match type for this component
interface Match {
  id: string;
  opponentTeamName: string;
  win: boolean;
  date: string;
}

interface RecentMatchesProps {
  recentMatches: Match[];
  onAddMatch?: () => void;
  onViewAll?: () => void;
}

export const RecentMatches: React.FC<RecentMatchesProps> = ({ recentMatches, onAddMatch, onViewAll }) => {
  if (!recentMatches || recentMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No matches found. Add your first match to get started!</p>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          onClick={onAddMatch}
        >
          Add Match
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Matches</h3>
        <button
          className="text-blue-600 hover:underline text-sm font-medium"
          onClick={onViewAll}
        >
          View All Matches
        </button>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {recentMatches.slice(0, 5).map((match) => (
          <li key={match.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span
                className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  match.win
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
                aria-label={match.win ? 'Win' : 'Loss'}
              >
                {match.win ? 'W' : 'L'}
              </span>
              <span className="text-gray-900 dark:text-white font-medium">{match.opponentTeamName}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{new Date(match.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
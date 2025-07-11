import React from 'react';

interface Match {
  id: string;
  win: boolean;
}

export const RecentPerformance: React.FC<{ matches?: Match[] }> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No recent matches</p>;
  }
  return (
    <div className="flex space-x-2">
      {matches.slice(0, 5).map((match) => (
        <div
          key={match.id}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            match.win
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {match.win ? 'W' : 'L'}
        </div>
      ))}
    </div>
  );
}; 
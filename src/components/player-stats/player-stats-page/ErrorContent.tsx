import React from 'react';

interface ErrorContentProps {
  error: string;
}

export const ErrorContent: React.FC<ErrorContentProps> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Error Loading Player Data
    </h2>
    <p className="text-red-600 dark:text-red-300">
      {error}
    </p>
  </div>
); 
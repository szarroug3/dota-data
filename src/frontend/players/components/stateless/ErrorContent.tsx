import React from 'react';

interface ErrorContentProps {
  error: string;
}

export const ErrorContent: React.FC<ErrorContentProps> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-destructive dark:text-destructive mb-2">Error Loading Player Data</h2>
    <p className="text-destructive dark:text-red-300">{error}</p>
  </div>
);

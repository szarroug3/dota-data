import React from 'react';

interface OverallStatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export const OverallStatCard: React.FC<OverallStatCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{value}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}; 
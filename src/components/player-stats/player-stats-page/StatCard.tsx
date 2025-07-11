import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
  </div>
); 
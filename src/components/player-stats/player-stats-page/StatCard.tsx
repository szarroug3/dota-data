import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <div className="bg-muted dark:bg-muted rounded-lg p-4 text-center">
    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">{title}</div>
    <div className="text-2xl font-bold text-foreground dark:text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{subtitle}</div>
  </div>
); 
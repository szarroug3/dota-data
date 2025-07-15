import React from 'react';

interface OverallStatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export const OverallStatCard: React.FC<OverallStatCardProps> = ({ title, value, subtitle }) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow p-4 text-center">
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}; 
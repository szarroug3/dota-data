import React from 'react';

interface DateDurationProps {
  date: string;
  duration: number;
  breakpoints?: {
    showDateAndDuration?: string;
    showDateOnly?: string;
    showDateOnlySmall?: string;
    showDateOnlyVerySmall?: string;
  };
  className?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const DateDuration: React.FC<DateDurationProps> = ({ 
  date, 
  duration, 
  breakpoints = {
    showDateAndDuration: '350px',
    showDateOnly: '280px',
    showDateOnlySmall: '220px',
    showDateOnlyVerySmall: '220px'
  },
  className = ''
}) => {
  return (
    <div className={`text-sm text-muted-foreground truncate ${className}`}>
      {/* Show date and duration on larger containers */}
      <span className={`@[${breakpoints.showDateAndDuration}]:inline hidden`}>
        {formatDate(date)} • {formatDuration(duration)}
      </span>
      
      {/* Show only date on medium containers (prioritize date over duration) */}
      <span className={`@[${breakpoints.showDateOnly}]:inline @[${breakpoints.showDateAndDuration}]:hidden hidden`}>
        {formatDate(date)}
      </span>
      
      {/* Show only date on smaller containers */}
      <span className={`@[${breakpoints.showDateOnlySmall}]:inline @[${breakpoints.showDateOnly}]:hidden hidden`}>
        {formatDate(date)}
      </span>
      
      {/* Show only date on very small containers */}
      <span className={`@[${breakpoints.showDateOnlyVerySmall}]:hidden`}>
        {formatDate(date)}
      </span>
    </div>
  );
}; 
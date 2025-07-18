import React from 'react';

import { Badge } from '@/components/ui/badge';

interface ResponsiveBadgeProps {
  fullText: string;
  shortText: string;
  breakpoint: string;
  hideBreakpoint: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  className?: string;
}

export const ResponsiveBadge: React.FC<ResponsiveBadgeProps> = ({
  fullText,
  shortText,
  breakpoint,
  hideBreakpoint,
  variant = 'default',
  className = 'text-xs'
}) => {
  return (
    <Badge variant={variant} className={`${className} w-fit @[${hideBreakpoint}]:block hidden`}>
      <span className={`@[${breakpoint}]:block hidden`}>{fullText}</span>
      <span className={`@[${breakpoint}]:hidden block`}>{shortText}</span>
    </Badge>
  );
}; 
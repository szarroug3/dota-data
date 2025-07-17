import React from 'react';

import { Badge } from '@/components/ui/badge';

interface ResponsiveBadgeProps {
  fullText: string;
  shortText: string;
  breakpoint: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  className?: string;
}

export const ResponsiveBadge: React.FC<ResponsiveBadgeProps> = ({
  fullText,
  shortText,
  breakpoint,
  variant = 'default',
  className = 'text-xs'
}) => {
  return (
    <Badge variant={variant} className={className}>
      <span className={`@[${breakpoint}]:inline hidden`}>{fullText}</span>
      <span className={`@[${breakpoint}]:hidden`}>{shortText}</span>
    </Badge>
  );
}; 
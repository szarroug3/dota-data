import { RefreshCw } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export const RefreshButton: React.FC<{ onClick: () => void; className?: string; ariaLabel?: string }> = ({
  onClick,
  className,
  ariaLabel,
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel || 'Refresh match'}
    className={className}
  >
    <RefreshCw className="h-4 w-4" />
  </Button>
);

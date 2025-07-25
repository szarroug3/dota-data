import { RefreshCw } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, loading = false, ariaLabel = 'Refresh match', className }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel}
    className={className}
    disabled={loading}
  >
    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
  </Button>
); 
import { Play } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface ParseButtonProps {
  onClick: () => void;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const ParseButton: React.FC<ParseButtonProps> = ({ onClick, loading = false, ariaLabel = 'Parse match', className }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel}
    className={className}
    disabled={loading}
  >
    <Play className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
  </Button>
); 
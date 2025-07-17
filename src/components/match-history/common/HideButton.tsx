import { EyeOff } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface HideButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export const HideButton: React.FC<HideButtonProps> = ({ onClick, ariaLabel = 'Hide match', className }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel}
    className={className}
  >
    <EyeOff className="h-4 w-4" />
  </Button>
); 
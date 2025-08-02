import { Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface RemoveManualMatchButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export const RemoveManualMatchButton: React.FC<RemoveManualMatchButtonProps> = ({ 
  onClick, 
  ariaLabel = 'Remove manual match', 
  className 
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel}
    className={className}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
); 
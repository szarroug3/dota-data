import { Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export const RemoveManualMatchButton: React.FC<{ onClick: () => void; className?: string; ariaLabel?: string }> = ({ onClick, className, ariaLabel }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={ariaLabel || 'Remove manual match'}
    className={`text-destructive hover:text-destructive ${className || ''}`}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
);



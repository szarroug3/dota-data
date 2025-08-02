import { Edit } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface EditManualMatchButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export const EditManualMatchButton: React.FC<EditManualMatchButtonProps> = ({ 
  onClick, 
  ariaLabel = 'Edit manual match', 
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
    <Edit className="h-4 w-4" />
  </Button>
); 
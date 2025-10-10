import { FileCode } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export const ParseButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <Button type="button" variant="ghost" size="sm" onClick={onClick} aria-label="Parse match" className={className}>
    <FileCode className="h-4 w-4" />
  </Button>
);

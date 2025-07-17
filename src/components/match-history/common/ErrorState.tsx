/**
 * Error State Component
 * 
 * Stateless component for displaying error states in match history.
 * Shows error messages with retry functionality.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';


import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Match History
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {error}
          </p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 
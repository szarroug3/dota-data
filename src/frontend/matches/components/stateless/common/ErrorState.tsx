import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';



export const ErrorState: React.FC<{ message?: string }> = ({ message }) => (
  <Card>
    <CardContent className="flex items-center justify-center py-12">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Error
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {message || 'Something went wrong. Please try again.'}
        </p>
      </div>
    </CardContent>
  </Card>
);



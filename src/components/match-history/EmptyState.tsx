/**
 * Empty State Component
 * 
 * Stateless component for displaying empty states in match history.
 * Shows appropriate messages when there are no teams or no team selected.
 */

import { AlertCircle, Users } from 'lucide-react';
import React from 'react';


import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface EmptyStateProps {
  type: 'no-teams' | 'no-selection';
  onAddTeam?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAddTeam }) => {
  const content = {
    'no-teams': {
      title: 'No Teams Added',
      description: 'Add your first team to start viewing match history.',
      icon: Users,
      action: 'Add Team',
      actionHandler: onAddTeam
    },
    'no-selection': {
      title: 'Select a Team',
      description: 'Choose a team from the sidebar to view their match history.',
      icon: AlertCircle,
      action: null,
      actionHandler: null
    }
  };

  const { title, description, icon: Icon, action, actionHandler } = content[type];

  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {description}
          </p>
          {action && actionHandler && (
            <Button onClick={actionHandler}>
              {action}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 
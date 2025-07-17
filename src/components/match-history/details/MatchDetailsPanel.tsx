import { BarChart3, FileText, List, PieChart } from 'lucide-react';
import React from 'react';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MatchDetails } from '@/types/contexts/match-context-value';

import { MatchDetailsPanelAnalytics } from './MatchDetailsPanelAnalytics';
import { MatchDetailsPanelDetailed } from './MatchDetailsPanelDetailed';
import { MatchDetailsPanelMinimal } from './MatchDetailsPanelMinimal';
import { MatchDetailsPanelSummary } from './MatchDetailsPanelSummary';

export type MatchDetailsPanelMode = 'detailed' | 'minimal' | 'summary' | 'analytics';

interface MatchDetailsPanelProps {
  match: MatchDetails | null;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange?: (mode: MatchDetailsPanelMode) => void;
  className?: string;
}

export const MatchDetailsPanel: React.FC<MatchDetailsPanelProps> = ({
  match,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  const renderContent = () => {
    if (viewMode === 'detailed') {
      return <MatchDetailsPanelDetailed match={match} />;
    }
    if (viewMode === 'minimal') {
      return <MatchDetailsPanelMinimal match={match} />;
    }
    if (viewMode === 'summary') {
      return <MatchDetailsPanelSummary match={match} />;
    }
    if (viewMode === 'analytics') {
      return <MatchDetailsPanelAnalytics match={match} />;
    }
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">This details view mode is not yet implemented.</div>
          <div className="text-sm">Try switching to detailed, minimal, summary, or analytics view.</div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`flex flex-col max-h-[calc(100vh-14rem)] ${className}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Match Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {match ? `vs ${match.opponent}` : 'No match selected'}
            </p>
          </div>
          {onViewModeChange && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('summary')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
              </Button>
              <Button
                variant={viewMode === 'minimal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('minimal')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Minimal</span>
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('detailed')}
                className="flex items-center gap-2"
              >
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Detailed</span>
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange('analytics')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelAnalyticsProps {
  match: Match;
  className?: string;
}

// Mock analytics data
const mockAnalytics = {
  performanceMetrics: {
    damageDealt: 45000,
    damageTaken: 32000,
    healingProvided: 8500,
    visionScore: 75,
    objectiveParticipation: 0.85
  },
  comparativeAnalysis: {
    heroPerformance: {
      playerKDA: '8.5/2.1/12.3',
      averageKDA: '6.2/3.8/8.9',
      percentile: 85
    },
    teamComposition: {
      synergy: 0.78,
      counter: 0.65,
      metaAlignment: 0.82
    },
    draftEvaluation: {
      pickOrder: 0.72,
      heroSynergy: 0.81,
      counterPicks: 0.68
    }
  },
  timelineAnalysis: {
    netWorthProgression: [
      { time: 300, value: 15000 },
      { time: 600, value: 28000 },
      { time: 900, value: 42000 },
      { time: 1200, value: 55000 },
      { time: 1500, value: 68000 }
    ],
    experienceCurves: {
      radiant: [1200, 2800, 4500, 6200, 7800],
      dire: [1100, 2600, 4200, 5800, 7200]
    },
    teamFightWinRates: {
      radiant: 0.65,
      dire: 0.35
    }
  },
  advancedStats: {
    csPerMinute: 8.5,
    deniesPerMinute: 2.1,
    heroDamagePerMinute: 450,
    towerDamagePerMinute: 120,
    roshanKills: 2,
    buybackUsage: 1,
    wardPlaced: 12,
    wardDestroyed: 8,
    observerWards: 6,
    sentryWards: 4
  }
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

// Extracted component for Performance Metrics tab
const PerformanceMetricsTab = () => (
  <TabsContent value="performance" className="space-y-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Damage Dealt</span>
              <span className="font-mono">{formatNumber(mockAnalytics.performanceMetrics.damageDealt)}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Damage Taken</span>
              <span className="font-mono">{formatNumber(mockAnalytics.performanceMetrics.damageTaken)}</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatNumber(mockAnalytics.performanceMetrics.healingProvided)}
            </div>
            <div className="text-xs text-muted-foreground">Healing</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {mockAnalytics.performanceMetrics.visionScore}
            </div>
            <div className="text-xs text-muted-foreground">Vision Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatPercentage(mockAnalytics.performanceMetrics.objectiveParticipation)}
            </div>
            <div className="text-xs text-muted-foreground">Objective Participation</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);

// Extracted component for Comparative Analysis tab
const ComparativeAnalysisTab = () => (
  <TabsContent value="comparative" className="space-y-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hero Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>KDA Ratio</span>
            <span className="font-mono">{mockAnalytics.comparativeAnalysis.heroPerformance.playerKDA}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average KDA</span>
            <span className="font-mono">{mockAnalytics.comparativeAnalysis.heroPerformance.averageKDA}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Percentile</span>
            <span className="font-mono">{mockAnalytics.comparativeAnalysis.heroPerformance.percentile}%</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Team Composition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Synergy</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.teamComposition.synergy)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Counter</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.teamComposition.counter)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Meta Alignment</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.teamComposition.metaAlignment)}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Draft Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Pick Order</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.draftEvaluation.pickOrder)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Hero Synergy</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.draftEvaluation.heroSynergy)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Counter Picks</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.comparativeAnalysis.draftEvaluation.counterPicks)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);

// Extracted component for Timeline Analysis tab
const TimelineAnalysisTab = () => (
  <TabsContent value="timeline" className="space-y-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Net Worth Progression</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mockAnalytics.timelineAnalysis.netWorthProgression.map((point, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{formatDuration(point.time)}</span>
              <span className="font-mono">{formatNumber(point.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Experience Curves</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Radiant Peak</span>
            <span className="font-mono">{formatNumber(Math.max(...mockAnalytics.timelineAnalysis.experienceCurves.radiant))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dire Peak</span>
            <span className="font-mono">{formatNumber(Math.max(...mockAnalytics.timelineAnalysis.experienceCurves.dire))}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Team Fight Win Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Radiant</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.timelineAnalysis.teamFightWinRates.radiant)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dire</span>
            <span className="font-mono">{formatPercentage(mockAnalytics.timelineAnalysis.teamFightWinRates.dire)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);

// Extracted component for Advanced Stats tab
const AdvancedStatsTab = () => (
  <TabsContent value="advanced" className="space-y-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Advanced Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CS/min</span>
              <span className="font-mono">{mockAnalytics.advancedStats.csPerMinute}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Denies/min</span>
              <span className="font-mono">{mockAnalytics.advancedStats.deniesPerMinute}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hero Damage/min</span>
              <span className="font-mono">{mockAnalytics.advancedStats.heroDamagePerMinute}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tower Damage/min</span>
              <span className="font-mono">{mockAnalytics.advancedStats.towerDamagePerMinute}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Roshan Kills</span>
              <span className="font-mono">{mockAnalytics.advancedStats.roshanKills}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Buybacks</span>
              <span className="font-mono">{mockAnalytics.advancedStats.buybackUsage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wards Placed</span>
              <span className="font-mono">{mockAnalytics.advancedStats.wardPlaced}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wards Destroyed</span>
              <span className="font-mono">{mockAnalytics.advancedStats.wardDestroyed}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Vision Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {mockAnalytics.advancedStats.observerWards}
            </div>
            <div className="text-xs text-muted-foreground">Observer Wards</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {mockAnalytics.advancedStats.sentryWards}
            </div>
            <div className="text-xs text-muted-foreground">Sentry Wards</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);

export const MatchDetailsPanelAnalytics: React.FC<MatchDetailsPanelAnalyticsProps> = ({
  match,
  className = ''
}) => {
  const isWin = match.result === 'win';
  const duration = formatDuration(match.duration);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analytics Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isWin ? 'success' : 'destructive'}
                className="text-sm font-medium"
              >
                {isWin ? 'Victory' : 'Defeat'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Analytics
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-muted-foreground">
                {duration}
              </div>
              <div className="text-sm text-muted-foreground">
                Match #{match.id}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="comparative">Comparative</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <PerformanceMetricsTab />
        <ComparativeAnalysisTab />
        <TimelineAnalysisTab />
        <AdvancedStatsTab />
      </Tabs>
    </div>
  );
}; 
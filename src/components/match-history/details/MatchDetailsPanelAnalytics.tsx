import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelAnalyticsProps {
  match: Match;
  className?: string;
}

// Mock analytics data for demonstration
const mockAnalytics = {
  performanceMetrics: {
    damageDealt: 85000,
    damageTaken: 72000,
    healingProvided: 15000,
    visionScore: 85,
    objectiveParticipation: 0.8,
    teamFightParticipation: 0.9
  },
  comparativeAnalysis: {
    heroPerformance: {
      averageKDA: 2.8,
      playerKDA: 3.2,
      percentile: 75
    },
    teamComposition: {
      synergy: 0.85,
      counter: 0.7,
      metaAlignment: 0.9
    },
    draftEvaluation: {
      pickOrder: 0.8,
      heroSynergy: 0.85,
      counterPicks: 0.7
    }
  },
  timelineAnalysis: {
    netWorthProgression: [
      { time: 0, value: 0 },
      { time: 300, value: 5000 },
      { time: 600, value: 12000 },
      { time: 900, value: 20000 },
      { time: 1200, value: 28000 },
      { time: 1500, value: 35000 },
      { time: 1800, value: 42000 },
      { time: 2100, value: 48000 },
      { time: 2400, value: 55000 },
      { time: 2700, value: 62000 }
    ],
    experienceCurves: {
      radiant: [0, 1000, 2500, 4500, 7000, 10000, 13500, 17500, 22000, 27000],
      dire: [0, 800, 2000, 3800, 6000, 8500, 11500, 15000, 19000, 23500]
    },
    teamFightWinRates: {
      radiant: 0.75,
      dire: 0.25
    }
  },
  advancedStats: {
    csPerMinute: 8.5,
    deniesPerMinute: 1.2,
    heroDamagePerMinute: 850,
    towerDamagePerMinute: 120,
    roshanKills: 2,
    buybackUsage: 1,
    wardPlaced: 12,
    wardDestroyed: 8,
    observerWards: 8,
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

        {/* Performance Metrics */}
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

        {/* Comparative Analysis */}
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

        {/* Timeline Analysis */}
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

        {/* Advanced Stats */}
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
      </Tabs>
    </div>
  );
}; 
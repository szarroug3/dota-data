import React from 'react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelTimingsProps {
  match: Match;
}

interface TimingData {
  time: number;
  radiantNetWorth: number;
  direNetWorth: number;
  radiantXP: number;
  direXP: number;
  radiantTowers: number;
  direTowers: number;
}

export const MatchDetailsPanelTimings: React.FC<MatchDetailsPanelTimingsProps> = ({ match: _match }) => {
  // Mock timing data - in real implementation this would come from the match data
  const timingData: TimingData[] = [
    { time: 0, radiantNetWorth: 0, direNetWorth: 0, radiantXP: 0, direXP: 0, radiantTowers: 11, direTowers: 11 },
    { time: 300, radiantNetWorth: 15000, direNetWorth: 14000, radiantXP: 8000, direXP: 7500, radiantTowers: 11, direTowers: 11 },
    { time: 600, radiantNetWorth: 32000, direNetWorth: 30000, radiantXP: 18000, direXP: 17000, radiantTowers: 11, direTowers: 11 },
    { time: 900, radiantNetWorth: 52000, direNetWorth: 48000, radiantXP: 32000, direXP: 29000, radiantTowers: 11, direTowers: 10 },
    { time: 1200, radiantNetWorth: 75000, direNetWorth: 72000, radiantXP: 48000, direXP: 45000, radiantTowers: 10, direTowers: 10 },
    { time: 1500, radiantNetWorth: 98000, direNetWorth: 95000, radiantXP: 65000, direXP: 62000, radiantTowers: 10, direTowers: 9 },
    { time: 1800, radiantNetWorth: 125000, direNetWorth: 120000, radiantXP: 82000, direXP: 78000, radiantTowers: 9, direTowers: 9 },
    { time: 2100, radiantNetWorth: 155000, direNetWorth: 150000, radiantXP: 98000, direXP: 94000, radiantTowers: 9, direTowers: 8 },
    { time: 2400, radiantNetWorth: 185000, direNetWorth: 175000, radiantXP: 115000, direXP: 108000, radiantTowers: 8, direTowers: 8 },
    { time: 2700, radiantNetWorth: 220000, direNetWorth: 200000, radiantXP: 135000, direXP: 125000, radiantTowers: 8, direTowers: 7 },
    { time: 3000, radiantNetWorth: 250000, direNetWorth: 220000, radiantXP: 150000, direXP: 135000, radiantTowers: 7, direTowers: 6 },
  ];

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Prepare chart data
  const chartData = timingData.map(data => ({
    time: formatTime(data.time),
    radiantNetWorth: data.radiantNetWorth,
    direNetWorth: data.direNetWorth,
    radiantXP: data.radiantXP,
    direXP: data.direXP,
    radiantTowers: data.radiantTowers,
    direTowers: data.direTowers,
  }));

  const netWorthConfig = {
    radiantNetWorth: {
      label: "Radiant Net Worth",
      color: "#3b82f6",
    },
    direNetWorth: {
      label: "Dire Net Worth", 
      color: "#ef4444",
    },
  };

  const xpConfig = {
    radiantXP: {
      label: "Radiant XP",
      color: "#10b981",
    },
    direXP: {
      label: "Dire XP",
      color: "#f59e0b",
    },
  };

  const towerConfig = {
    radiantTowers: {
      label: "Radiant Towers",
      color: "#8b5cf6",
    },
    direTowers: {
      label: "Dire Towers",
      color: "#ec4899",
    },
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Net Worth Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={netWorthConfig}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="radiantNetWorth"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="direNetWorth"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* XP Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Experience Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={xpConfig}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="radiantXP"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="direXP"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tower Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tower Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={towerConfig}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" />
              <YAxis domain={[0, 11]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="radiantTowers"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="direTowers"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Key Timings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Timings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Radiant</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>First Tower:</span>
                    <span className="font-medium">9:00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Net Worth Lead Peak:</span>
                    <span className="font-medium">50:00 (+30K)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>XP Lead Peak:</span>
                    <span className="font-medium">50:00 (+15K)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Barracks Destroyed:</span>
                    <span className="font-medium">40:00</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-4">Dire</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>First Tower:</span>
                    <span className="font-medium">12:00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Net Worth Lead Peak:</span>
                    <span className="font-medium">25:00 (+5K)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>XP Lead Peak:</span>
                    <span className="font-medium">20:00 (+3K)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Barracks Destroyed:</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>The Radiant team maintained a consistent lead throughout the game, with their biggest advantage coming at the 50-minute mark.</p>
              <p>Key turning points occurred at 9:00 (first tower), 25:00 (Dire&apos;s brief lead), and 40:00 (Radiant barracks destruction).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">9:00</div>
                <div className="text-sm text-muted-foreground">Early Game</div>
                <div className="text-xs">Radiant takes first tower</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">25:00</div>
                <div className="text-sm text-muted-foreground">Mid Game</div>
                <div className="text-xs">Dire briefly leads</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">40:00</div>
                <div className="text-sm text-muted-foreground">Late Game</div>
                <div className="text-xs">Radiant destroys barracks</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>The game followed a typical pattern where Radiant established early control and maintained their advantage through superior team fighting and objective control.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
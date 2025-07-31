import React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GameEvent, Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelEventsProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

interface ChartDataPoint {
  time: number;
  goldAdvantage: number;
  xpAdvantage: number;
  radiantGold: number;
  direGold: number;
  radiantXP: number;
  direXP: number;
  // Add event data for dots
  goldEvent?: GameEvent;
  xpEvent?: GameEvent;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getEventDisplayName = (event: GameEvent): string => {
  switch (event.type) {
    case 'roshan':
      return 'Roshan Kill';
    case 'aegis':
      return 'Aegis Pickup';
    case 'tower':
      return 'Tower Destroyed';
    case 'barracks':
      return 'Barracks Destroyed';
    case 'teamfight':
      return 'Team Fight';
    case 'first_blood':
      return 'First Blood';
    default:
      return 'Event';
  }
};

const createChartData = (goldData: any, experienceAdvantage: any, events: GameEvent[]): ChartDataPoint[] => {
  return goldData.times.map((time: number, index: number) => {
    const radiantGold = goldData.radiantGold[index] || 0;
    const direGold = goldData.direGold[index] || 0;
    const radiantXP = experienceAdvantage.radiantExperience[index] || 0;
    const direXP = experienceAdvantage.direExperience[index] || 0;
    
    // Calculate advantages (positive = Radiant advantage, negative = Dire advantage)
    const goldAdvantageValue = radiantGold - direGold;
    const xpAdvantageValue = radiantXP - direXP;
    
    // Find events at this exact time point
    const timeEvents = events.filter(event => event.time === time);
    const goldEvent = timeEvents.find(event => event.type === 'tower' || event.type === 'barracks' || event.type === 'roshan');
    const xpEvent = timeEvents.find(event => event.type === 'teamfight' || event.type === 'first_blood');
    
    return {
      time,
      goldAdvantage: goldAdvantageValue,
      xpAdvantage: xpAdvantageValue,
      // Keep these for tooltip display
      radiantGold,
      direGold,
      radiantXP,
      direXP,
      goldEvent,
      xpEvent,
    };
  });
};

const createTooltipFormatter = () => {
  return (value: number, name: string, props: any) => {
    const dataPoint = props.payload as ChartDataPoint;
    const formattedValue = Math.round(value / 1000);
    const team = value > 0 ? 'Radiant' : 'Dire';
    const advantage = Math.abs(formattedValue);
    
    if (name === 'goldAdvantage') {
      return [
        `${team} +${advantage}k Gold (${Math.round(dataPoint.radiantGold / 1000)}k vs ${Math.round(dataPoint.direGold / 1000)}k)`,
        'Gold Advantage'
      ];
    } else if (name === 'xpAdvantage') {
      return [
        `${team} +${advantage}k XP (${Math.round(dataPoint.radiantXP / 1000)}k vs ${Math.round(dataPoint.direXP / 1000)}k)`,
        'XP Advantage'
      ];
    }
    return [formattedValue, name];
  };
};

const createDotRenderer = (lineColor: string) => {
  return (props: any) => {
    const dataPoint = props.payload as ChartDataPoint;
    const hasEvent = dataPoint.goldEvent || dataPoint.xpEvent;
    const event = dataPoint.goldEvent || dataPoint.xpEvent;
    
    if (!hasEvent || !event) {
      return (
        <circle
          cx={props.cx}
          cy={props.cy}
          r={0}
          fill="transparent"
        />
      );
    }
    
    return (
      <g>
        <circle
          cx={props.cx}
          cy={props.cy}
          r={6}
          fill={lineColor}
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
        />
        <title>
          {getEventDisplayName(event)} - {formatTime(event.time)}
          {event.team && ` (${event.team === 'radiant' ? 'Radiant' : 'Dire'})`}
          {event.description && ` - ${event.description}`}
        </title>
      </g>
    );
  };
};

const PerformanceChart: React.FC<{ match?: Match }> = ({ match }) => {
  if (!match?.statistics?.goldAdvantage || !match?.statistics?.experienceAdvantage) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No performance data available
      </div>
    );
  }

  const { goldAdvantage: goldData, experienceAdvantage } = match.statistics;
  const events = match.processedEvents || [];

  // Create chart data points with advantage calculations and event mapping
  const chartData = createChartData(goldData, experienceAdvantage, events);

  const maxTime = Math.max(...chartData.map(d => d.time));
  const maxAdvantage = Math.max(...chartData.flatMap(d => [Math.abs(d.goldAdvantage), Math.abs(d.xpAdvantage)]));

  const tooltipFormatter = createTooltipFormatter();
  const goldDotRenderer = createDotRenderer("#3b82f6");
  const xpDotRenderer = createDotRenderer("#8b5cf6");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Timeline</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Gold Advantage</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-green-600">Radiant</span>
              <span>|</span>
              <span className="text-red-600">Dire</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>XP Advantage</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-green-600">Radiant</span>
              <span>|</span>
              <span className="text-red-600">Dire</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tickFormatter={(value) => formatTime(value)}
              domain={[0, maxTime]}
            />
            <YAxis 
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              domain={[-maxAdvantage, maxAdvantage]}
            />
            <Tooltip 
              labelFormatter={(value) => `Time: ${formatTime(value)}`}
              formatter={tooltipFormatter}
            />
            
            {/* Reference line at 0 */}
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            
            {/* Gold Advantage Line */}
            <Line 
              type="monotone" 
              dataKey="goldAdvantage" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={goldDotRenderer}
              activeDot={{
                r: 6,
                fill: "#3b82f6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              name="Gold Advantage"
            />
            
            {/* XP Advantage Line */}
            <Line 
              type="monotone" 
              dataKey="xpAdvantage" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={xpDotRenderer}
              activeDot={{
                r: 6,
                fill: "#8b5cf6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              name="XP Advantage"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

PerformanceChart.displayName = 'PerformanceChart';

const KeyMetrics: React.FC<{ match?: Match }> = ({ match }) => {
  if (!match?.statistics) {
    return null;
  }

  const { goldAdvantage, experienceAdvantage } = match.statistics;
  const maxGoldIndex = goldAdvantage.radiantGold.indexOf(Math.max(...goldAdvantage.radiantGold));
  const maxXPIndex = experienceAdvantage.radiantExperience.indexOf(Math.max(...experienceAdvantage.radiantExperience));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gold Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Peak Radiant Gold:</span>
              <span className="font-mono">{Math.round(goldAdvantage.radiantGold[maxGoldIndex] / 1000)}k</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Dire Gold:</span>
              <span className="font-mono">{Math.round(Math.max(...goldAdvantage.direGold) / 1000)}k</span>
            </div>
            <div className="flex justify-between">
              <span>Biggest Gold Lead:</span>
              <span className="font-mono">{Math.round(Math.max(...goldAdvantage.radiantGold) / 1000)}k</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experience Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Peak Radiant XP:</span>
              <span className="font-mono">{Math.round(experienceAdvantage.radiantExperience[maxXPIndex] / 1000)}k</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Dire XP:</span>
              <span className="font-mono">{Math.round(Math.max(...experienceAdvantage.direExperience) / 1000)}k</span>
            </div>
            <div className="flex justify-between">
              <span>Biggest XP Lead:</span>
              <span className="font-mono">{Math.round(Math.max(...experienceAdvantage.radiantExperience) / 1000)}k</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

KeyMetrics.displayName = 'KeyMetrics';

export const MatchDetailsPanelEvents: React.FC<MatchDetailsPanelEventsProps> = ({ match, teamMatch: _teamMatch, className }) => {
  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No match data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <PerformanceChart match={match} />
      
      <Separator />
      
      <KeyMetrics match={match} />
    </div>
  );
};

MatchDetailsPanelEvents.displayName = 'MatchDetailsPanelEvents'; 
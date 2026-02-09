import React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import type { DefaultLegendContentProps } from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from '@/components/ui/chart';
import { useAppData } from '@/frontend/contexts/app-data-context';
import type { Match } from '@/frontend/lib/app-data/app-data-types';
import type { ChartDataPoint } from '@/frontend/lib/match/match-performance-timeline';

import {
  formatTime,
  formatYAxisTick,
  PerformanceTooltip as PartsPerformanceTooltip,
  renderEventDot,
} from './MatchDetailsPanelEventsParts';

interface MatchDetailsPanelEventsProps {
  match?: Match;
  className?: string;
}

const generateTimeTicks = (minTime: number, maxTime: number): number[] => {
  const ticks: number[] = [];
  const startMinute = Math.floor(minTime / 60) * 60;
  const endMinute = Math.ceil(maxTime / 60) * 60;
  for (let time = startMinute; time <= endMinute; time += 60) ticks.push(time);
  return ticks;
};

const chartConfig = {
  goldAdvantage: { label: 'Gold Advantage', color: '#3b82f6' },
  xpAdvantage: { label: 'XP Advantage', color: '#8b5cf6' },
} as const;

interface PerformanceTimelineChartProps {
  chartData: ChartDataPoint[];
  minTime: number;
  maxTime: number;
  chartMinAdvantage: number;
  chartMaxAdvantage: number;
  match?: Match;
}

function NoPerformanceData({ onParse, isParsing }: { onParse?: () => void; isParsing?: boolean }) {
  return (
    <div className="text-center text-muted-foreground py-8">
      <div className="text-lg font-medium mb-2">No Performance Data</div>
      <div className="text-sm">This match doesn&apos;t have detailed performance statistics available.</div>
      {onParse && (
        <div className="mt-4">
          <Button type="button" onClick={onParse} disabled={Boolean(isParsing)} aria-label="Parse Match">
            Parse Match
          </Button>
        </div>
      )}
    </div>
  );
}

function NoChartData({ onParse, isParsing }: { onParse?: () => void; isParsing?: boolean }) {
  return (
    <div className="text-center text-muted-foreground py-8">
      <div className="text-lg font-medium mb-2">No Chart Data</div>
      <div className="text-sm">Unable to generate performance timeline for this match.</div>
      {onParse && (
        <div className="mt-4">
          <Button type="button" onClick={onParse} disabled={Boolean(isParsing)} aria-label="Parse Match">
            Parse Match
          </Button>
        </div>
      )}
    </div>
  );
}

function PerformanceTimelineChart({
  chartData,
  minTime,
  maxTime,
  chartMinAdvantage,
  chartMaxAdvantage,
  match,
}: PerformanceTimelineChartProps) {
  const yTickFormatter = React.useCallback((value: number) => formatYAxisTick(value), []);
  return (
    <ChartContainer config={chartConfig} className="h-[650px] w-full">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          type="number"
          tickFormatter={(value) => formatTime(value)}
          domain={[minTime - 90, maxTime]}
          ticks={generateTimeTicks(minTime - 90, maxTime)}
          allowDataOverflow={false}
        />
        <YAxis
          tickFormatter={yTickFormatter}
          domain={[chartMinAdvantage - 1000, chartMaxAdvantage + 1000]}
          tickCount={10}
        />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
        <ChartTooltip content={<PartsPerformanceTooltip match={match} />} />
        <Line
          key="gold-advantage"
          type="monotone"
          dataKey="goldAdvantage"
          stroke="var(--color-goldAdvantage)"
          strokeWidth={2}
          dot={false}
          connectNulls
          name="Gold Advantage"
        />
        <Line
          key="xp-advantage"
          type="monotone"
          dataKey="xpAdvantage"
          stroke="var(--color-xpAdvantage)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls
          name="XP Advantage"
        />
        <Line
          key="events"
          type="monotone"
          dataKey="eventLine"
          stroke="transparent"
          strokeWidth={0}
          dot={renderEventDot}
          name="Events"
        />
        <ChartLegend
          content={(props: DefaultLegendContentProps) => (
            <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />
          )}
          verticalAlign="bottom"
        />
      </LineChart>
    </ChartContainer>
  );
}

function PerformanceChart({
  match,
  onParse,
  isParsing,
  appData,
}: {
  match?: Match;
  onParse?: () => void;
  isParsing?: boolean;
  appData: ReturnType<typeof useAppData>;
}) {
  const chartData = match ? appData.getMatchPerformanceTimelineChartData(match.id) : null;
  if (!match) return null;
  if (!chartData) return <NoPerformanceData onParse={onParse} isParsing={isParsing} />;
  if (chartData.length === 0) return <NoChartData onParse={onParse} isParsing={isParsing} />;
  const { minTime, maxTime, chartMaxAdvantage, chartMinAdvantage } =
    appData.getMatchPerformanceTimelineBounds(chartData);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold truncate">Performance Timeline</h3>
      </div>
      <div className="text-xs text-muted-foreground flex">
        <span className="truncate flex-1">
          Advantage: Positive values (top) show Radiant advantage, negative values (bottom) show Dire advantage
        </span>
      </div>
      <div className="relative">
        <PerformanceTimelineChart
          chartData={chartData}
          minTime={minTime}
          maxTime={maxTime}
          chartMinAdvantage={chartMinAdvantage}
          chartMaxAdvantage={chartMaxAdvantage}
          match={match}
        />
      </div>
    </div>
  );
}

PerformanceChart.displayName = 'PerformanceChart';

export const MatchDetailsPanelEvents: React.FC<MatchDetailsPanelEventsProps> = ({ match, className }) => {
  const appData = useAppData();
  const [isParsing, setIsParsing] = React.useState(false);

  const handleParse = React.useCallback(async () => {
    if (!match) return;
    try {
      setIsParsing(true);
      await appData.parseMatchAndUpdate(match.id);
    } finally {
      setIsParsing(false);
    }
  }, [match, appData]);

  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-lg font-medium mb-2">No Match Data</div>
        <div className="text-sm">Select a match to view performance events and analysis.</div>
      </div>
    );
  }
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <PerformanceChart match={match} onParse={handleParse} isParsing={isParsing} appData={appData} />
    </div>
  );
};

MatchDetailsPanelEvents.displayName = 'MatchDetailsPanelEvents';

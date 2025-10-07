import React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from '@/components/ui/chart';
import { useAppData } from '@/contexts/app-data-context';
import { GameEvent, Match } from '@/frontend/lib/app-data-types';
import { processMatchData } from '@/frontend/lib/match-loader';
import { parseMatch as apiParseMatch } from '@/frontend/matches/api/matches';

import {
  ChartDataPoint,
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

type GoldAdvantageData = { times: number[]; radiantGold: number[]; direGold: number[] };
type ExperienceAdvantageData = { radiantExperience: number[]; direExperience: number[] };

function buildPerformanceData(goldData: GoldAdvantageData, experience: ExperienceAdvantageData): ChartDataPoint[] {
  return goldData.times.map((time: number, index: number) => {
    const radiantGold = goldData.radiantGold[index] || 0;
    const direGold = goldData.direGold[index] || 0;
    const radiantXP = experience.radiantExperience[index] || 0;
    const direXP = experience.direExperience[index] || 0;
    return {
      time,
      goldAdvantage: radiantGold - direGold,
      xpAdvantage: radiantXP - direXP,
      radiantGold,
      direGold,
      radiantXP,
      direXP,
      event: undefined,
    };
  });
}

function calculateMaxAdvantage(performanceData: ChartDataPoint[]): number {
  return Math.max(...performanceData.flatMap((d) => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
}

function filterImportantEvents(events: GameEvent[]): GameEvent[] {
  const isImportant = (event: GameEvent) =>
    event.type === 'CHAT_MESSAGE_FIRSTBLOOD' || event.type === 'CHAT_MESSAGE_AEGIS' || event.type === 'team_fight';
  return events.filter(isImportant);
}

function seedTimeline(performanceData: ChartDataPoint[]): Map<number, ChartDataPoint> {
  const timeline = new Map<number, ChartDataPoint>();
  performanceData.forEach((point) => timeline.set(point.time, point));
  return timeline;
}

function addEventsToTimeline(timeline: Map<number, ChartDataPoint>, events: GameEvent[], eventLineValue: number): void {
  events.forEach((event) => {
    const existingPoint = timeline.get(event.time);
    if (existingPoint) {
      existingPoint.event = event;
      existingPoint.eventLine = eventLineValue;
      return;
    }
    timeline.set(event.time, {
      time: event.time,
      goldAdvantage: null,
      xpAdvantage: null,
      radiantGold: 0,
      direGold: 0,
      radiantXP: 0,
      direXP: 0,
      eventLine: eventLineValue,
      event,
    });
  });
}

function toSortedArrayByTime(timeline: Map<number, ChartDataPoint>): ChartDataPoint[] {
  return Array.from(timeline.values()).sort((a, b) => a.time - b.time);
}

function prependFirstNegativeTickIfNeeded(data: ChartDataPoint[]): ChartDataPoint[] {
  const minTime = Math.min(...data.map((d) => d.time));
  if (minTime >= 0) return data;
  const firstNegativeTick = Math.floor(minTime / 60) * 60;
  if (firstNegativeTick >= minTime || data.some((d) => d.time === firstNegativeTick)) return data;
  return [
    {
      time: firstNegativeTick,
      goldAdvantage: 0,
      xpAdvantage: 0,
      radiantGold: 0,
      direGold: 0,
      radiantXP: 0,
      direXP: 0,
      event: undefined,
    },
    ...data,
  ];
}

function createChartData(
  goldData: GoldAdvantageData,
  experienceAdvantage: ExperienceAdvantageData,
  events: GameEvent[],
): ChartDataPoint[] {
  const performanceData = buildPerformanceData(goldData, experienceAdvantage);
  const maxAdvantage = calculateMaxAdvantage(performanceData);
  const importantEvents = filterImportantEvents(events);
  const timeline = seedTimeline(performanceData);
  addEventsToTimeline(timeline, importantEvents, maxAdvantage + 1000);
  const combined = toSortedArrayByTime(timeline);
  return prependFirstNegativeTickIfNeeded(combined);
}

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

function computeChartBounds(chartData: ChartDataPoint[]) {
  const minTime = Math.min(...chartData.map((d) => d.time));
  const maxTime = Math.max(...chartData.map((d) => d.time));
  const chartMaxAdvantage = Math.max(...chartData.flatMap((d) => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  const chartMinAdvantage = Math.min(...chartData.flatMap((d) => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  return { minTime, maxTime, chartMaxAdvantage, chartMinAdvantage };
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
    <ChartContainer config={chartConfig} className="h-[650px] w-full hidden @[350px]:block">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(value) => formatTime(value)}
          domain={[minTime - 90, maxTime]}
          ticks={generateTimeTicks(minTime - 90, maxTime)}
          allowDataOverflow={false}
          scale="time"
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
        <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
      </LineChart>
    </ChartContainer>
  );
}

function PerformanceChart({ match, onParse, isParsing }: { match?: Match; onParse?: () => void; isParsing?: boolean }) {
  const hasGold = Boolean(match?.statistics?.goldAdvantage);
  const hasXp = Boolean(match?.statistics?.experienceAdvantage);
  if (!hasGold || !hasXp) return <NoPerformanceData onParse={onParse} isParsing={isParsing} />;
  const { goldAdvantage: goldData, experienceAdvantage } = match!.statistics!;
  const events = match!.processedEvents || [];
  const chartData = createChartData(goldData, experienceAdvantage, events);
  if (chartData.length === 0) return <NoChartData onParse={onParse} isParsing={isParsing} />;
  const { minTime, maxTime, chartMaxAdvantage, chartMinAdvantage } = computeChartBounds(chartData);
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
      // Parse match and get the updated data from OpenDota
      const parsedMatchData = await apiParseMatch(match.id);
      // Process the raw match data and update it in appData
      const processedMatch = processMatchData(parsedMatchData, appData.heroes, appData.items);
      // Update the match in appData (this triggers React re-render)
      appData.addMatch(processedMatch);
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
      <PerformanceChart match={match} onParse={handleParse} isParsing={isParsing} />
    </div>
  );
};

MatchDetailsPanelEvents.displayName = 'MatchDetailsPanelEvents';

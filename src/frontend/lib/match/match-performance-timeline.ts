/**
 * Match performance timeline – pure data derivation for the events chart.
 * Builds chart-ready data from match statistics and processed events.
 */

import type { GameEvent, Match } from '@/frontend/lib/app-data/app-data-types';

export interface ChartDataPoint {
  time: number;
  goldAdvantage: number | null;
  xpAdvantage: number | null;
  radiantGold: number;
  direGold: number;
  radiantXP: number;
  direXP: number;
  eventLine?: number;
  event?: GameEvent;
}

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

function isValidPerformancePoint(point: ChartDataPoint): boolean {
  return point.goldAdvantage !== null && point.xpAdvantage !== null;
}

function findNearestPerformancePoints(timeline: Map<number, ChartDataPoint>, time: number) {
  let before: ChartDataPoint | null = null;
  let after: ChartDataPoint | null = null;

  for (const [pointTime, point] of timeline.entries()) {
    if (!isValidPerformancePoint(point)) continue;
    if (pointTime < time && (!before || pointTime > before.time)) {
      before = point;
      continue;
    }
    if (pointTime > time && (!after || pointTime < after.time)) {
      after = point;
    }
  }

  return { before, after };
}

function interpolatePerformancePoint(before: ChartDataPoint, after: ChartDataPoint, time: number): ChartDataPoint {
  const timeDiff = after.time - before.time;
  const timeRatio = (time - before.time) / timeDiff;
  return {
    time,
    goldAdvantage: before.goldAdvantage! + (after.goldAdvantage! - before.goldAdvantage!) * timeRatio,
    xpAdvantage: before.xpAdvantage! + (after.xpAdvantage! - before.xpAdvantage!) * timeRatio,
    radiantGold: before.radiantGold + (after.radiantGold - before.radiantGold) * timeRatio,
    direGold: before.direGold + (after.direGold - before.direGold) * timeRatio,
    radiantXP: before.radiantXP + (after.radiantXP - before.radiantXP) * timeRatio,
    direXP: before.direXP + (after.direXP - before.direXP) * timeRatio,
    event: undefined,
  };
}

function copyPointAtTime(point: ChartDataPoint, time: number): ChartDataPoint {
  return { ...point, time };
}

function findNearestPerformanceData(timeline: Map<number, ChartDataPoint>, time: number): ChartDataPoint | null {
  const { before, after } = findNearestPerformancePoints(timeline, time);

  if (before && after && isValidPerformancePoint(before) && isValidPerformancePoint(after)) {
    return interpolatePerformancePoint(before, after, time);
  }

  if (before && isValidPerformancePoint(before)) {
    return copyPointAtTime(before, time);
  }

  if (after && isValidPerformancePoint(after)) {
    return copyPointAtTime(after, time);
  }

  return null;
}

function addEventsToTimeline(timeline: Map<number, ChartDataPoint>, events: GameEvent[], eventLineValue: number): void {
  const fallbackPoint = {
    goldAdvantage: null,
    xpAdvantage: null,
    radiantGold: 0,
    direGold: 0,
    radiantXP: 0,
    direXP: 0,
  };

  events.forEach((event) => {
    const existingPoint = timeline.get(event.time);
    if (existingPoint) {
      existingPoint.event = event;
      existingPoint.eventLine = eventLineValue;
      return;
    }
    const interpolated = findNearestPerformanceData(timeline, event.time);
    const basePoint = interpolated ?? fallbackPoint;
    timeline.set(event.time, {
      ...basePoint,
      time: event.time,
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

/**
 * Build chart-ready performance timeline data from a match.
 * Returns null if the match has no statistics or gold/XP data.
 */
export function createMatchPerformanceTimelineChartData(match: Match | undefined): ChartDataPoint[] | null {
  if (!match?.statistics) return null;

  const goldData = match.statistics.goldAdvantage;
  if (!goldData || goldData.times.length === 0) return null;

  const experienceAdvantage = match.statistics.experienceAdvantage;
  if (!experienceAdvantage || experienceAdvantage.times.length === 0) return null;

  const events = match.processedEvents ?? [];
  const performanceData = buildPerformanceData(goldData, experienceAdvantage);
  const maxAdvantage = calculateMaxAdvantage(performanceData);
  const importantEvents = filterImportantEvents(events);
  const timeline = seedTimeline(performanceData);
  addEventsToTimeline(timeline, importantEvents, maxAdvantage + 1000);
  const combined = toSortedArrayByTime(timeline);
  return prependFirstNegativeTickIfNeeded(combined);
}

export interface ChartBounds {
  minTime: number;
  maxTime: number;
  chartMaxAdvantage: number;
  chartMinAdvantage: number;
}

/**
 * Compute axis bounds from chart data for the performance timeline chart.
 */
export function computeChartBounds(chartData: ChartDataPoint[]): ChartBounds {
  const minTime = Math.min(...chartData.map((d) => d.time));
  const maxTime = Math.max(...chartData.map((d) => d.time));
  const chartMaxAdvantage = Math.max(...chartData.flatMap((d) => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  const chartMinAdvantage = Math.min(...chartData.flatMap((d) => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  return { minTime, maxTime, chartMaxAdvantage, chartMinAdvantage };
}

import { Building2, Check, Coins, Droplets, Skull, Sword, Zap, Zap as ZapIcon } from 'lucide-react';
import React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from '@/components/ui/chart';
import { GameEvent, Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelEventsProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

interface ChartDataPoint {
  time: number;
  goldAdvantage: number | null;
  xpAdvantage: number | null;
  radiantGold: number;
  direGold: number;
  radiantXP: number;
  direXP: number;
  eventLine?: number; // For event positioning
  // Add event data for dots
  event?: GameEvent;
}

const formatTime = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const minutes = Math.floor(absSeconds / 60);
  const remainingSeconds = Math.floor(absSeconds % 60);
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  return isNegative ? `-${timeString}` : timeString;
};

const generateTimeTicks = (minTime: number, maxTime: number): number[] => {
  const ticks: number[] = [];
  
  // Round down to the nearest minute for start
  const startMinute = Math.floor(minTime / 60) * 60;
  // Round up to the nearest minute for end
  const endMinute = Math.ceil(maxTime / 60) * 60;
  
  // Generate ticks every minute
  for (let time = startMinute; time <= endMinute; time += 60) {
    ticks.push(time);
  }
  
  console.log('Generated ticks:', ticks.map(t => formatTime(t)));
  return ticks;
};



  const renderEventIcon = (event: GameEvent, cx: number, cy: number, color: string) => {
    const size = 16;
    const x = cx - size / 2;
    const y = cy - size / 2;
    
    switch (event.type) {
      case 'CHAT_MESSAGE_FIRSTBLOOD':
        return (
          <Droplets
            key={`${event.time}-${event.type}`}
            x={x}
            y={y}
            width={size}
            height={size}
            fill="hsl(var(--background))"
            stroke={color}
            strokeWidth={2}
          />
        );
      case 'CHAT_MESSAGE_ROSHAN_KILL':
        return (
          <Sword
            key={`${event.time}-${event.type}`}
            x={x}
            y={y}
            width={size}
            height={size}
            fill="hsl(var(--background))"
            stroke={color}
            strokeWidth={2}
          />
        );
      case 'building_kill':
        return (
          <Building2
            key={`${event.time}-${event.type}`}
            x={x}
            y={y}
            width={size}
            height={size}
            fill="hsl(var(--background))"
            stroke={color}
            strokeWidth={2}
          />
        );
      case 'CHAT_MESSAGE_AEGIS':
        return (
          <Zap
            key={`${event.time}-${event.type}`}
            x={x}
            y={y}
            width={size}
            height={size}
            fill="hsl(var(--background))"
            stroke={color}
            strokeWidth={2}
          />
        );
      default:
        // Return a transparent circle for unknown event types
        return (
          <circle
            key={`unknown-icon-${event.time}-${event.type}`}
            cx={cx}
            cy={cy}
            r={0}
            fill="transparent"
          />
        );
    }
  };



  const createChartData = (goldData: any, experienceAdvantage: any, events: GameEvent[]): ChartDataPoint[] => {
    // Create data points for performance data only (gold/XP)
    const performanceData = goldData.times.map((time: number, index: number) => {
      const radiantGold = goldData.radiantGold[index] || 0;
      const direGold = goldData.direGold[index] || 0;
      const radiantXP = experienceAdvantage.radiantExperience[index] || 0;
      const direXP = experienceAdvantage.direExperience[index] || 0;
      
      // Calculate advantages (positive = Radiant advantage, negative = Dire advantage)
      const goldAdvantageValue = radiantGold - direGold;
      const xpAdvantageValue = radiantXP - direXP;
      
      return {
        time,
        goldAdvantage: goldAdvantageValue,
        xpAdvantage: xpAdvantageValue,
        // Keep these for tooltip display
        radiantGold,
        direGold,
        radiantXP,
        direXP,
        event: undefined, // No event for regular time points
      };
    });
    
    // Calculate max advantage for event positioning (filter out null values)
    const maxAdvantage = Math.max(...performanceData.flatMap((d: ChartDataPoint) => [
      d.goldAdvantage ?? 0, 
      d.xpAdvantage ?? 0
    ]));
    
    // Create separate events data
    const significantEvents = events.filter(event => 
      event.type === 'CHAT_MESSAGE_FIRSTBLOOD' || event.type === 'CHAT_MESSAGE_AEGIS'
    );
    const teamFightEvents = events.filter(event => event.type === 'team_fight');
    const allEvents = [...significantEvents, ...teamFightEvents];
    
    // Create a timeline that includes both performance data and events at their correct times
    const timeline = new Map<number, ChartDataPoint>();
    
    // Add all performance data points to the timeline
    performanceData.forEach((point: ChartDataPoint) => {
      timeline.set(point.time, point);
    });
    
    // Add events to the timeline at their correct times
    allEvents.forEach(event => {
      const existingPoint = timeline.get(event.time);
      if (existingPoint) {
        // Add event to existing performance data point
        existingPoint.event = event;
        existingPoint.eventLine = maxAdvantage + 1000;
      } else {
        // Create new point for event-only time
        timeline.set(event.time, {
          time: event.time,
          goldAdvantage: null,
          xpAdvantage: null,
          radiantGold: 0,
          direGold: 0,
          radiantXP: 0,
          direXP: 0,
          eventLine: maxAdvantage + 1000,
          event: event,
        });
      }
    });
    
    // Convert timeline back to array and sort by time
    const combinedData = Array.from(timeline.values()).sort((a, b) => a.time - b.time);
    
    // Add a data point at the first negative tick if needed
    const minTime = Math.min(...combinedData.map(d => d.time));
    console.log('Original minTime:', minTime, 'formatted:', formatTime(minTime));
    
    if (minTime < 0) {
      const firstNegativeTick = Math.floor(minTime / 60) * 60; // Round down to nearest minute
      console.log('First negative tick:', firstNegativeTick, 'formatted:', formatTime(firstNegativeTick));
      
      if (firstNegativeTick < minTime && !combinedData.some(d => d.time === firstNegativeTick)) {
        console.log('Adding negative tick data point at:', formatTime(firstNegativeTick));
        combinedData.unshift({
          time: firstNegativeTick,
          goldAdvantage: 0,
          xpAdvantage: 0,
          radiantGold: 0,
          direGold: 0,
          radiantXP: 0,
          direXP: 0,
          event: undefined,
        });
      } else {
        console.log('Not adding negative tick - already exists or not needed');
      }
    }
    
    console.log('Final combinedData times:', combinedData.map(d => formatTime(d.time)));
    
    return combinedData;
  };

  const createEventData = (events: GameEvent[], maxTime: number, maxAdvantage: number): ChartDataPoint[] => {
    const significantEvents = events.filter(event => 
      event.type === 'CHAT_MESSAGE_FIRSTBLOOD' || event.type === 'CHAT_MESSAGE_AEGIS'
    );

    // Create a data point for each event at its correct time
    return significantEvents.map(event => ({
      time: event.time,
      goldAdvantage: maxAdvantage * 1.2, // Position above all other data
      xpAdvantage: 0,
      radiantGold: 0,
      direGold: 0,
      radiantXP: 0,
      direXP: 0,
      event: event,
    }));
  };

const chartConfig = {
  goldAdvantage: {
    label: "Gold Advantage",
    color: "#3b82f6",
  },
  xpAdvantage: {
    label: "XP Advantage", 
    color: "#8b5cf6",
  },
} as const;

const PerformanceChart: React.FC<{ match?: Match }> = ({ match }) => {
  if (!match?.statistics?.goldAdvantage || !match?.statistics?.experienceAdvantage) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-lg font-medium mb-2">No Performance Data</div>
        <div className="text-sm">This match doesn't have detailed performance statistics available.</div>
      </div>
    );
  }

  const { goldAdvantage: goldData, experienceAdvantage } = match.statistics;
  const events = match.processedEvents || [];
  
  console.log('PerformanceChart - match.processedEvents:', JSON.stringify(events.slice(0, 3), null, 2));

  // Create chart data points with advantage calculations
  const chartData = createChartData(goldData, experienceAdvantage, events);

  // Check if we have any meaningful data
  if (chartData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-lg font-medium mb-2">No Chart Data</div>
        <div className="text-sm">Unable to generate performance timeline for this match.</div>
      </div>
    );
  }

  const minTime = Math.min(...chartData.map(d => d.time));
  const maxTime = Math.max(...chartData.map(d => d.time));
  const chartMaxAdvantage = Math.max(...chartData.flatMap(d => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  const chartMinAdvantage = Math.min(...chartData.flatMap(d => [d.goldAdvantage ?? 0, d.xpAdvantage ?? 0]));
  console.log('Chart time range:', formatTime(minTime), 'to', formatTime(maxTime));
  console.log('Domain range:', formatTime(minTime - 90), 'to', formatTime(maxTime));

  // Filter significant events for overlay
  const significantEvents = events.filter(event => 
    event.type === 'CHAT_MESSAGE_FIRSTBLOOD' || 
    event.type === 'CHAT_MESSAGE_AEGIS'
  );

  return (
    <div className="space-y-4">
              <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold truncate">Performance Timeline</h3>
        </div>
        <div className="text-xs text-muted-foreground flex">
          <span className="truncate flex-1">Advantage: Positive values (top) show Radiant advantage, negative values (bottom) show Dire advantage</span>
        </div>

      <div className="relative">
        <ChartContainer config={chartConfig} className="h-[650px] w-full hidden @[350px]:block">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
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
              tickFormatter={(value) => {
              const absValue = Math.abs(value);
              if (absValue >= 1000) {
                return `${Math.round(value / 1000)}k`;
              }
              return value.toString();
            }}
              domain={[chartMinAdvantage - 1000, chartMaxAdvantage + 1000]}
              tickCount={10}
            />
            
            {/* Reference line at 0 */}
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }
                
                const dataPoint = payload[0].payload as ChartDataPoint;
                const time = formatTime(dataPoint.time);
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Time: {time}
                        </span>
                      </div>
                      
                      {/* Show gold/XP data only if they have meaningful values */}
                      {payload.filter(entry => entry.dataKey === 'goldAdvantage' || entry.dataKey === 'xpAdvantage').map((entry, index) => {
                        const numValue = Number(entry.value);
                        // Only show if the value is not 0 (which would be event-only data points)
                        if (numValue === 0) return null;
                        
                        const team = numValue > 0 ? 'Radiant' : 'Dire';
                        const advantage = Math.abs(numValue);
                        const absValue = Math.abs(advantage);
                        const formattedValue = absValue >= 1000 ? Math.round(advantage / 1000) : advantage;
                        
                        return (
                          <div key={index} className="flex items-center gap-2 min-w-0">
                            <div 
                              className="h-2 w-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium truncate min-w-0">
                              {team} advantage: {formattedValue}{absValue >= 1000 ? 'k' : ''} {entry.name}
                            </span>
                          </div>
                        );
                      })}
                      
                                                {/* Show event info if present */}
                          {dataPoint.event && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                <span className="text-sm font-medium">
                                  {dataPoint.event.type === 'CHAT_MESSAGE_FIRSTBLOOD' ? (
                                    <span className="flex items-center gap-2">
                                      <span>First Blood:</span>
                                      {dataPoint.event.details?.killerHero && (
                                        <img 
                                          src={dataPoint.event.details.killerHero.imageUrl} 
                                          alt={dataPoint.event.details.killer}
                                          className="w-4 h-4 rounded"
                                        />
                                      )}
                                      <span>{dataPoint.event.details?.killer || 'unknown player'}</span>
                                      <span>killed</span>
                                      {dataPoint.event.details?.victimHero && (
                                        <img 
                                          src={dataPoint.event.details.victimHero.imageUrl} 
                                          alt={dataPoint.event.details.victim}
                                          className="w-4 h-4 rounded"
                                        />
                                      )}
                                      <span>{dataPoint.event.details?.victim || 'unknown player'}</span>
                                    </span>
                                                                      ) : dataPoint.event.type === 'CHAT_MESSAGE_AEGIS' ? (
                                      <span className="flex items-center gap-2">
                                      <span>Aegis picked up by</span>
                                      {dataPoint.event.details?.aegisHolderHero && (
                                        <img 
                                          src={dataPoint.event.details.aegisHolderHero.imageUrl} 
                                          alt={dataPoint.event.details.aegisHolder}
                                          className="w-4 h-4 rounded"
                                        />
                                      )}
                                      <span>{dataPoint.event.details?.aegisHolder || 'unknown player'}</span>
                                    </span>
                                  ) : (
                                    dataPoint.event.description
                                  )}
                                </span>
                              </div>
                              

                          
                          {/* Show detailed teamfight info */}
                          {dataPoint.event.type === 'team_fight' && dataPoint.event.details?.playerDetails && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Duration: {formatTime(dataPoint.event.details.duration || 0)}
                              </div>
                              
                              {/* Team Summary */}
                              {(() => {
                                const radiantPlayers = dataPoint.event.details.playerDetails.filter(p => p.playerIndex < 5);
                                const direPlayers = dataPoint.event.details.playerDetails.filter(p => p.playerIndex >= 5);
                                
                                const radiantGoldTotal = radiantPlayers.reduce((sum, p) => sum + p.goldDelta, 0);
                                const radiantXpTotal = radiantPlayers.reduce((sum, p) => sum + p.xpDelta, 0);
                                const direGoldTotal = direPlayers.reduce((sum, p) => sum + p.goldDelta, 0);
                                const direXpTotal = direPlayers.reduce((sum, p) => sum + p.xpDelta, 0);
                                
                                const formatValue = (value: number) => {
                                  return Math.abs(value) >= 1000 
                                    ? `${(value / 1000).toFixed(1)}k` 
                                    : value.toString();
                                };
                                
                                                                                                    return (
                                    <div className="text-xs space-y-1 mb-2">
                                      <div className="flex justify-center">
                                        <div className="inline-block">
                                        <div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-0">
                                        {/* Header row with merged columns */}
                                        <div className="col-span-3 text-center">
                                          <div className="font-medium text-primary">Radiant</div>
                                        </div>
                                        <div className="col-span-1"></div>
                                        <div className="col-span-3 text-center">
                                          <div className="font-medium text-blue-600">Dire</div>
                                        </div>
                                        {/* Column 1: Icons (Radiant) */}
                                        <div className="flex flex-col justify-end items-end w-auto">
                                          <div className="text-white flex justify-end pr-1">
                                            <Coins className="w-4 h-4" />
                                          </div>
                                          <div className="text-white flex justify-end pr-1">
                                            <ZapIcon className="w-4 h-4" />
                                          </div>
                                        </div>
                                        
                                        {/* Column 2: Numbers (Radiant) */}
                                        <div className="text-center w-auto">
                                          <div className="text-white text-right">
                                            <span>{formatValue(radiantGoldTotal)}</span>
                                          </div>
                                          <div className="text-white text-right">
                                            <span>{formatValue(radiantXpTotal)}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Column 3: Triangles (Radiant) */}
                                        <div className="flex flex-col justify-start items-start w-auto">
                                          <div className="text-white pl-1">
                                            <span className={radiantGoldTotal >= 0 ? 'text-blue-600' : 'text-primary'}>{radiantGoldTotal >= 0 ? '▲' : '▼'}</span>
                                          </div>
                                          <div className="text-white">
                                            {/* Empty for XP row */}
                                          </div>
                                        </div>
                                        
                                        {/* Column 4: Spacer */}
                                        <div className="w-8"></div>
                                        
                                        {/* Column 4: Icons (Dire) */}
                                        <div className="flex flex-col justify-end items-end w-auto">
                                          <div className="text-white flex justify-end pr-1">
                                            <Coins className="w-4 h-4" />
                                          </div>
                                          <div className="text-white flex justify-end pr-1">
                                            <ZapIcon className="w-4 h-4" />
                                          </div>
                                        </div>
                                        
                                        {/* Column 5: Numbers (Dire) */}
                                        <div className="text-center w-auto">
                                          <div className="text-white text-right">
                                            <span>{formatValue(direGoldTotal)}</span>
                                          </div>
                                          <div className="text-white text-right">
                                            <span>{formatValue(direXpTotal)}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Column 6: Triangles (Dire) */}
                                        <div className="flex flex-col justify-start items-start w-auto">
                                          <div className="text-white pl-1">
                                            <span className={direGoldTotal >= 0 ? 'text-blue-600' : 'text-primary'}>{direGoldTotal >= 0 ? '▲' : '▼'}</span>
                                          </div>
                                          <div className="text-white">
                                            {/* Empty for XP row */}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                );
                              })()}
                              
                              <div className="text-xs">
                                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 font-medium text-muted-foreground mb-1">
                                    <div></div>
                                    <div className="text-center"><span className="inline-block w-12 text-left">Hero</span></div>
                                    <div className="text-center"><span className="inline-block w-12 text-left">Status</span></div>
                                    <div className="text-right"><span className="inline-block w-12 text-right">Damage</span></div>
                                    <div className="text-center"><span className="inline-block w-12 text-right">Gold</span></div>
                                    <div className="text-center"><span className="inline-block w-12 text-right">XP</span></div>
                                  </div>
                                {dataPoint.event.details.playerDetails.map((player, index) => {
                                  const hero = match?.players?.radiant?.[player.playerIndex]?.hero || 
                                             match?.players?.dire?.[player.playerIndex - 5]?.hero;
                                  const heroName = hero?.localizedName || `Player ${player.playerIndex}`;
                                  const isDead = player.deaths > 0;
                                  
                                  // Status logic based on deaths and buybacks
                                  const getStatusIcon = () => {
                                    if (player.deaths === 0 && player.buybacks === 0) {
                                      return <Check className="w-4 h-4 text-green-500" />; // Lives
                                    } else if (player.deaths > 0 && player.buybacks === 0) {
                                      return <Skull className="w-4 h-4 text-red-500" />; // Normal death
                                    } else if (player.deaths <= 1 && player.buybacks >= 1) {
                                      return <Coins className="w-4 h-4 text-yellow-500" />; // Buyback
                                    } else if (player.deaths >= 2 && player.buybacks >= 1) {
                                      return (
                                        <div className="flex items-center justify-center gap-1">
                                          <Skull className="w-3 h-3 text-red-500" />
                                          <Coins className="w-3 h-3 text-yellow-500" />
                                        </div>
                                      ); // Dieback
                                    } else {
                                      // Fallback for any other combination
                                      return <span className="text-gray-400">?</span>;
                                    }
                                  };
                                  const goldFormatted = Math.abs(player.goldDelta) >= 1000 
                                    ? `${(player.goldDelta / 1000).toFixed(1)}k` 
                                    : player.goldDelta.toString();
                                  const xpFormatted = Math.abs(player.xpDelta) >= 1000 
                                    ? `${(player.xpDelta / 1000).toFixed(1)}k` 
                                    : player.xpDelta.toString();
                                  const damageFormatted = Math.abs(player.damage) >= 1000 
                                    ? `${(player.damage / 1000).toFixed(1)}k` 
                                    : player.damage.toString();
                                  
                                  return (
                                    <div key={player.playerIndex} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 text-xs items-center">
                                      <div className="flex justify-center">
                                        {hero && (
                                          <img 
                                            src={hero.imageUrl} 
                                            alt={hero.localizedName}
                                            className="w-4 h-4 rounded"
                                          />
                                        )}
                                      </div>
                                      <div className="font-medium">{heroName}</div>
                                      <div className="text-center">
                                        <span className="inline-block w-12 text-center">
                                          {getStatusIcon()}
                                          </span>
                                      </div>
                                      <div className="text-center text-white">
                                        <span className="inline-block w-12 text-right">{damageFormatted}</span>
                                      </div>
                                      <div className="text-center text-white">
                                        <span className="inline-block w-12 text-right">{goldFormatted}</span> <span className={player.goldDelta >= 0 ? 'text-blue-600' : 'text-primary'}>{player.goldDelta >= 0 ? '▲' : '▼'}</span>
                                      </div>
                                      <div className="text-center text-white">
                                        <span className="inline-block w-12 text-right">{xpFormatted}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            
            {/* Gold Advantage Line */}
            <Line 
              key="gold-advantage"
              type="monotone" 
              dataKey="goldAdvantage" 
              stroke="var(--color-goldAdvantage)" 
              strokeWidth={2}
              dot={false}
              connectNulls={true}
              name="Gold Advantage"
            />
            
            {/* XP Advantage Line */}
            <Line 
              key="xp-advantage"
              type="monotone" 
              dataKey="xpAdvantage" 
              stroke="var(--color-xpAdvantage)" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={true}
              name="XP Advantage"
            />
            
            {/* Events Line */}
            <Line 
              key="events"
              type="monotone" 
              dataKey="eventLine" 
              stroke="transparent" 
              strokeWidth={0}
              dot={({ cx, cy, payload }) => {
                if (!payload.event) {
                  return (
                    <circle
                      key={`empty-${payload.time}`}
                      cx={cx}
                      cy={cy}
                      r={0}
                      fill="transparent"
                    />
                  );
                }
                
                return (
                  <g key={`event-${payload.time}-${payload.event.type}`}>
                    {payload.event.type === 'CHAT_MESSAGE_FIRSTBLOOD' ? (
                      <Droplets
                        key={`firstblood-${payload.time}`}
                        x={cx - 12}
                        y={cy - 12}
                        width={24}
                        height={24}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                    ) : payload.event.type === 'CHAT_MESSAGE_AEGIS' ? (
                      <Zap
                        key={`aegis-${payload.time}`}
                        x={cx - 12}
                        y={cy - 12}
                        width={24}
                        height={24}
                        fill="transparent"
                        stroke="#eab308"
                        strokeWidth={2}
                      />
                    ) : payload.event.type === 'team_fight' ? (
                      <Sword
                        key={`teamfight-${payload.time}`}
                        x={cx - 12}
                        y={cy - 12}
                        width={24}
                        height={24}
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    ) : (
                      <circle
                        key={`unknown-event-${payload.time}`}
                        cx={cx}
                        cy={cy}
                        r={0}
                        fill="transparent"
                      />
                    )}
                  </g>
                );
              }}
              name="Events"
            />
            <ChartLegend 
              content={<ChartLegendContent />}
              verticalAlign="bottom"
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};

PerformanceChart.displayName = 'PerformanceChart';



export const MatchDetailsPanelEvents: React.FC<MatchDetailsPanelEventsProps> = ({ match, teamMatch: _teamMatch, className }) => {
  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-lg font-medium mb-2">No Match Data</div>
        <div className="text-sm">Select a match to view performance events and analysis.</div>
      </div>
    );
  }

  // Check if we have valid performance data
  const hasValidPerformanceData = match?.statistics?.goldAdvantage?.radiantGold?.length && 
                                 match?.statistics?.experienceAdvantage?.radiantExperience?.length;

  if (!hasValidPerformanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No Performance Data</div>
          <div className="text-sm">This match isn't parsed for performance analysis.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <PerformanceChart match={match} />
    </div>
  );
};

MatchDetailsPanelEvents.displayName = 'MatchDetailsPanelEvents'; 
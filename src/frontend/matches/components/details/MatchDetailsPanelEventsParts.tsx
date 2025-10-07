import { Check, Coins, Skull, Zap } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { EventDetails, GameEvent, Match } from '@/frontend/lib/app-data-types';

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

export const formatTime = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const minutes = Math.floor(absSeconds / 60);
  const remainingSeconds = Math.floor(absSeconds % 60);
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  return isNegative ? `-${timeString}` : timeString;
};

export type TooltipEntry = {
  dataKey?: string;
  value?: number | string | null | undefined;
  name?: string;
  color?: string;
  payload: ChartDataPoint;
};

export function TooltipHeader({ time }: { time: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.70rem] uppercase text-muted-foreground">Time: {time}</span>
    </div>
  );
}

export function AdvantageItem({ entry }: { entry: TooltipEntry }) {
  const numValue = Number(entry.value);
  if (numValue === 0) return null;
  const team = numValue > 0 ? 'Radiant' : 'Dire';
  const advantage = Math.abs(numValue);
  const absValue = Math.abs(advantage);
  const formattedValue = absValue >= 1000 ? Math.round(advantage / 1000) : advantage;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
      <span className="text-sm font-medium truncate min-w-0">
        {team} advantage: {formattedValue}
        {absValue >= 1000 ? 'k' : ''} {entry.name}
      </span>
    </div>
  );
}

export function AdvantagesList({ payload }: { payload: TooltipEntry[] }) {
  const advantageKeys = new Set(['goldAdvantage', 'xpAdvantage']);
  const items = (payload ?? []).filter((entry) => advantageKeys.has(entry.dataKey ?? '') && Number(entry.value) !== 0);
  if (items.length === 0) return null;
  return (
    <div className="grid gap-1">
      {items.map((entry, index) => (
        <AdvantageItem key={index} entry={entry} />
      ))}
    </div>
  );
}

export function FirstBloodDescription({ details }: { details?: EventDetails }) {
  const killerName = details?.killer ?? 'unknown player';
  const victimName = details?.victim ?? 'unknown player';
  const killerImageUrl = details?.killerHero?.imageUrl;
  const victimImageUrl = details?.victimHero?.imageUrl;
  return (
    <span className="flex items-center gap-2">
      <span>First Blood:</span>
      <NameWithInlineHeroImage imageUrl={killerImageUrl} name={killerName} />
      <span>killed</span>
      <NameWithInlineHeroImage imageUrl={victimImageUrl} name={victimName} />
    </span>
  );
}

export function AegisDescription({ details }: { details?: EventDetails }) {
  const aegisHolderName = details?.aegisHolder ?? 'unknown player';
  const aegisHolderImageUrl = details?.aegisHolderHero?.imageUrl;
  return (
    <span className="flex items-center gap-2">
      <span>Aegis picked up by</span>
      <InlineHeroImage imageUrl={aegisHolderImageUrl} altText={aegisHolderName} />
      <span>{aegisHolderName}</span>
    </span>
  );
}

function InlineHeroImage({ imageUrl, altText }: { imageUrl?: string; altText: string }) {
  if (!imageUrl) return null;
  return <Image src={imageUrl} alt={altText} width={16} height={16} className="w-4 h-4 rounded" />;
}

function NameWithInlineHeroImage({ imageUrl, name }: { imageUrl?: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <InlineHeroImage imageUrl={imageUrl} altText={name} />
      <span>{name}</span>
    </span>
  );
}

const eventDescriptionByType: Record<string, (details?: EventDetails) => React.ReactNode> = {
  CHAT_MESSAGE_FIRSTBLOOD: (details) => <FirstBloodDescription details={details} />,
  CHAT_MESSAGE_AEGIS: (details) => <AegisDescription details={details} />,
};

export function renderEventDescription(event: GameEvent) {
  const renderer = eventDescriptionByType[event.type];
  return renderer ? renderer(event.details) : event.description;
}

export function EventInfo({ event }: { event: GameEvent }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-yellow-500" />
      <span className="text-sm font-medium">{renderEventDescription(event)}</span>
    </div>
  );
}

export function TeamfightSummary({
  radiantGoldTotal,
  radiantXpTotal,
  direGoldTotal,
  direXpTotal,
}: {
  radiantGoldTotal: number;
  radiantXpTotal: number;
  direGoldTotal: number;
  direXpTotal: number;
}) {
  const formatValue = (value: number) => (Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString());
  return (
    <div className="text-xs space-y-1 mb-2">
      <div className="flex justify-center">
        <div className="inline-block">
          <div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-0">
            <div className="col-span-3 text-center">
              <div className="font-medium text-primary">Radiant</div>
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-3 text-center">
              <div className="font-medium text-blue-600">Dire</div>
            </div>
            <div className="flex flex-col justify-end items-end w-auto">
              <div className="text-white flex justify-end pr-1">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-white flex justify-end pr-1">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-center w-auto">
              <div className="text-white text-right">
                <span>{formatValue(radiantGoldTotal)}</span>
              </div>
              <div className="text-white text-right">
                <span>{formatValue(radiantXpTotal)}</span>
              </div>
            </div>
            <div className="flex flex-col justify-start items-start w-auto">
              <div className="text-white pl-1">
                <span className={radiantGoldTotal >= 0 ? 'text-blue-600' : 'text-primary'}>
                  {radiantGoldTotal >= 0 ? '▲' : '▼'}
                </span>
              </div>
              <div className="text-white"></div>
            </div>
            <div className="w-8"></div>
            <div className="flex flex-col justify-end items-end w-auto">
              <div className="text-white flex justify-end pr-1">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-white flex justify-end pr-1">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-center w-auto">
              <div className="text-white text-right">
                <span>{formatValue(direGoldTotal)}</span>
              </div>
              <div className="text-white text-right">
                <span>{formatValue(direXpTotal)}</span>
              </div>
            </div>
            <div className="flex flex-col justify-start items-start w-auto">
              <div className="text-white pl-1">
                <span className={direGoldTotal >= 0 ? 'text-blue-600' : 'text-primary'}>
                  {direGoldTotal >= 0 ? '▲' : '▼'}
                </span>
              </div>
              <div className="text-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamfightPlayersTable({ details, match }: { details: NonNullable<EventDetails>; match?: Match }) {
  return (
    <div className="text-xs">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 font-medium text-muted-foreground mb-1">
        <div></div>
        <div className="text-center">
          <span className="inline-block w-12 text-left">Hero</span>
        </div>
        <div className="text-center">
          <span className="inline-block w-12 text-left">Status</span>
        </div>
        <div className="text-right">
          <span className="inline-block w-12 text-right">Damage</span>
        </div>
        <div className="text-center">
          <span className="inline-block w-12 text-right">Gold</span>
        </div>
        <div className="text-center">
          <span className="inline-block w-12 text-right">XP</span>
        </div>
      </div>
      {details.playerDetails?.map((player, index: number) => {
        const data = deriveTeamfightRowData(player, match);
        return <TeamfightPlayerRowSimple key={index} data={data} />;
      })}
    </div>
  );
}

export function PerformanceTooltip({
  active,
  payload,
  match,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  match?: Match;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0].payload as ChartDataPoint;
  const time = formatTime(dataPoint.time);
  const showTeamfight = dataPoint.event?.type === 'team_fight' && Boolean(dataPoint.event.details?.playerDetails);
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <TooltipHeader time={time} />
        <AdvantagesList payload={payload} />
        {dataPoint.event && <EventInfo event={dataPoint.event} />}
        {showTeamfight && <TeamfightDetailsSection details={dataPoint.event!.details!} match={match} />}
      </div>
    </div>
  );
}

function computeTeamfightTotals(playerDetails: NonNullable<EventDetails['playerDetails']> | undefined) {
  const initial = { gold: 0, xp: 0 } as { gold: number; xp: number };
  if (!playerDetails || playerDetails.length === 0) return { radiant: initial, dire: initial };
  const radiant = playerDetails
    .filter((p: { playerIndex: number }) => p.playerIndex < 5)
    .reduce(
      (acc: { gold: number; xp: number }, p: { goldDelta: number; xpDelta: number }) => ({
        gold: acc.gold + p.goldDelta,
        xp: acc.xp + p.xpDelta,
      }),
      initial,
    );
  const dire = playerDetails
    .filter((p: { playerIndex: number }) => p.playerIndex >= 5)
    .reduce(
      (acc: { gold: number; xp: number }, p: { goldDelta: number; xpDelta: number }) => ({
        gold: acc.gold + p.goldDelta,
        xp: acc.xp + p.xpDelta,
      }),
      initial,
    );
  return { radiant, dire };
}

export function TeamfightDetailsSection({ details, match }: { details: NonNullable<EventDetails>; match?: Match }) {
  const { radiant, dire } = computeTeamfightTotals(details.playerDetails);

  return (
    <div className="grid gap-2">
      <TeamfightSummary
        radiantGoldTotal={radiant.gold}
        radiantXpTotal={radiant.xp}
        direGoldTotal={dire.gold}
        direXpTotal={dire.xp}
      />
      <TeamfightPlayersTable details={details} match={match} />
    </div>
  );
}

type TeamfightRowData = {
  heroImageUrl?: string;
  heroName: string;
  isDead: boolean;
  damageText: string | number;
  goldDelta: number;
  xpDelta: number;
};
type TeamfightPlayerDetails = NonNullable<EventDetails['playerDetails']>[number];

function deriveTeamfightRowData(player: TeamfightPlayerDetails, match?: Match): TeamfightRowData {
  const hero = getHeroForPlayer(match, player.playerIndex);
  const heroName = getHeroName(hero, player.playerIndex);
  return {
    heroImageUrl: hero?.imageUrl,
    heroName,
    isDead: player.deaths > 0,
    damageText: typeof player.damage === 'number' ? (player.damage.toLocaleString?.() ?? player.damage) : 0,
    goldDelta: player.goldDelta,
    xpDelta: player.xpDelta,
  };
}

function getHeroForPlayer(match: Match | undefined, playerIndex: number) {
  if (!match?.players) return undefined;
  const isRadiant = playerIndex < 5;
  if (isRadiant) return match.players.radiant?.[playerIndex]?.hero;
  const direIndex = playerIndex - 5;
  return match.players.dire?.[direIndex]?.hero;
}

function getHeroName(hero: { localizedName?: string } | undefined, fallbackIndex: number): string {
  return hero?.localizedName ?? `Player ${fallbackIndex}`;
}

function TeamfightPlayerRowSimple({ data }: { data: TeamfightRowData }) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 items-center">
      <HeroCell imageUrl={data.heroImageUrl} heroName={data.heroName} />
      <div className="truncate">{data.heroName}</div>
      <StatusCell isDead={data.isDead} />
      <div className="text-right">{data.damageText}</div>
      <DeltaCell value={data.goldDelta} />
      <DeltaCell value={data.xpDelta} />
    </div>
  );
}

function HeroCell({ imageUrl, heroName }: { imageUrl?: string; heroName: string }) {
  return (
    <div className="flex items-center gap-1">
      {imageUrl ? (
        <Image src={imageUrl} alt={heroName} width={16} height={16} className="w-4 h-4 rounded" />
      ) : (
        <div className="w-4 h-4 bg-muted rounded" />
      )}
    </div>
  );
}

function StatusCell({ isDead }: { isDead: boolean }) {
  if (isDead) {
    return (
      <div className="flex items-center gap-1">
        <Skull className="w-3 h-3 text-destructive" />
        <span className="text-destructive">Dead</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Check className="w-3 h-3 text-green-500" />
      <span className="text-green-500">Alive</span>
    </div>
  );
}

function DeltaCell({ value }: { value: number }) {
  const isPositive = value >= 0;
  const abs = Math.abs(value);
  const arrow = isPositive ? '▲' : '▼';
  const className = isPositive ? 'text-blue-600' : 'text-primary';
  return (
    <div className="text-center">
      <span className={className}>
        {arrow} {abs}
      </span>
    </div>
  );
}

export function renderEventDot({ cx, cy, payload }: { cx?: number; cy?: number; payload: ChartDataPoint }) {
  const key = payload && typeof payload.time === 'number' ? `dot-${payload.time}` : `dot-${cx}-${cy}`;
  if (typeof cx !== 'number' || typeof cy !== 'number') {
    return <circle key={key} cx={cx} cy={cy} r={0} fill="transparent" />;
  }
  // Minimal dot renderer for events; icons removed to avoid heavy SVGs in tests
  return <circle key={key} cx={cx} cy={cy} r={3} fill="#eab308" />;
}

export function formatYAxisTick(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000) return `${Math.round(value / 1000)}k`;
  return value.toString();
}

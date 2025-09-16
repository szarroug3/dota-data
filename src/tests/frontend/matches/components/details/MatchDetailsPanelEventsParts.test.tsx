import { render } from '@testing-library/react';

import {
  AdvantagesList,
  formatTime,
  formatYAxisTick,
  PerformanceTooltip,
  renderEventDescription,
  renderEventDot,
  type TooltipEntry,
} from '@/frontend/matches/components/details/MatchDetailsPanelEventsParts';
import type { GameEvent } from '@/types/contexts/match-context-value';

describe('MatchDetailsPanelEventsParts helpers', () => {
  it('formatTime formats negative and positive seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(-75)).toBe('-1:15');
  });

  it('formatYAxisTick abbreviates thousands with k', () => {
    expect(formatYAxisTick(999)).toBe('999');
    expect(formatYAxisTick(1000)).toBe('1k');
    expect(formatYAxisTick(-2000)).toBe('-2k');
  });
});

describe('Event descriptions and tooltip items', () => {
  const fbEvent: GameEvent = {
    type: 'CHAT_MESSAGE_FIRSTBLOOD',
    time: 10,
    description: 'First blood',
    details: { killer: 'A', victim: 'B' } as any,
  };
  const aegisEvent: GameEvent = {
    type: 'CHAT_MESSAGE_AEGIS',
    time: 20,
    description: 'Aegis',
    details: { aegisHolder: 'C' } as any,
  };
  const otherEvent: GameEvent = { type: 'OTHER', time: 30, description: 'Other event' } as any;

  it('renderEventDescription returns specialized renderers or fallback', () => {
    const fb = render(<>{renderEventDescription(fbEvent)}</>);
    expect(fb.container.textContent).toContain('First Blood');

    const aeg = render(<>{renderEventDescription(aegisEvent)}</>);
    expect(aeg.container.textContent).toContain('Aegis picked up');

    const other = render(<>{renderEventDescription(otherEvent)}</>);
    expect(other.container.textContent).toContain('Other event');
  });

  it('AdvantagesList filters to advantage keys only', () => {
    const payload: TooltipEntry[] = [
      {
        dataKey: 'goldAdvantage',
        value: 500,
        name: 'gold',
        color: '#000',
        payload: { time: 0, goldAdvantage: 500, xpAdvantage: 0, radiantGold: 0, direGold: 0, radiantXP: 0, direXP: 0 },
      },
      {
        dataKey: 'xpAdvantage',
        value: -200,
        name: 'xp',
        color: '#000',
        payload: { time: 0, goldAdvantage: 0, xpAdvantage: -200, radiantGold: 0, direGold: 0, radiantXP: 0, direXP: 0 },
      },
      {
        dataKey: 'other',
        value: 1,
        name: 'other',
        color: '#000',
        payload: { time: 0, goldAdvantage: 0, xpAdvantage: 0, radiantGold: 0, direGold: 0, radiantXP: 0, direXP: 0 },
      },
    ];
    const { container } = render(<AdvantagesList payload={payload} />);
    expect(container.textContent).toContain('advantage');
    expect(container.textContent).not.toContain('other');
  });
});

describe('renderEventDot', () => {
  const basePayload = {
    time: 100,
    goldAdvantage: 0,
    xpAdvantage: 0,
    radiantGold: 0,
    direGold: 0,
    radiantXP: 0,
    direXP: 0,
  } as const;

  it('renders transparent circle for missing coords or event', () => {
    const el1 = renderEventDot({ cx: undefined, cy: 10, payload: { ...basePayload } as any });
    const el2 = renderEventDot({ cx: 10, cy: 10, payload: { ...basePayload, event: undefined } as any });
    expect(el1).toBeTruthy();
    expect(el2).toBeTruthy();
  });

  it('renders icon for known event types, circle for unknown', () => {
    const known = renderEventDot({
      cx: 10,
      cy: 10,
      payload: { ...basePayload, event: { type: 'CHAT_MESSAGE_AEGIS', time: 100 } as any } as any,
    });
    const unknown = renderEventDot({
      cx: 10,
      cy: 10,
      payload: { ...basePayload, event: { type: 'SOMETHING_ELSE', time: 100 } as any } as any,
    });
    expect(known).toBeTruthy();
    expect(unknown).toBeTruthy();
  });
});

describe('PerformanceTooltip rendering', () => {
  it('renders null when inactive or no payload', () => {
    const { container: c1 } = render(<PerformanceTooltip active={false} payload={[]} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<PerformanceTooltip active payload={[]} />);
    expect(c2.firstChild).toBeNull();
  });
});

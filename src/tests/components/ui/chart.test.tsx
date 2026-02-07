import { render, screen, waitFor } from '@testing-library/react';

import { ChartContainer } from '@/components/ui/chart';

const chartConfig = {
  metric: { label: 'Metric', color: '#111111' },
};

describe('ChartContainer', () => {
  const originalResizeObserver = window.ResizeObserver;
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    HTMLElement.prototype.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 240,
        top: 0,
        left: 0,
        bottom: 240,
        right: 320,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      }) as DOMRect;
  });

  afterEach(() => {
    if (originalResizeObserver) {
      window.ResizeObserver = originalResizeObserver;
    } else {
      delete (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    }
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it('renders chart content once container has size', async () => {
    render(
      <ChartContainer config={chartConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>,
    );

    await waitFor(() => expect(screen.getByTestId('chart-child')).toBeInTheDocument());
  });
});

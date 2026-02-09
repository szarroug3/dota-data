import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';

import { ShareProvider, useShareContext } from '@/frontend/contexts/share-context';
import type { SharePayload } from '@/frontend/contexts/share-context';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const TestConsumer: React.FC = () => {
  const { payload } = useShareContext();
  const activeTeamLabel = payload?.activeTeam ? `${payload.activeTeam.teamId}-${payload.activeTeam.leagueId}` : 'none';

  return <div data-testid="active-team">{activeTeamLabel}</div>;
};

describe('ShareProvider', () => {
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const originalFetch = globalThis.fetch;
  let currentConfig: string | null = 'first';

  beforeAll(() => {
    globalThis.fetch = jest.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentConfig = 'first';
    mockUseSearchParams.mockImplementation(
      () => new URLSearchParams(currentConfig ? `config=${currentConfig}` : '') as ReturnType<typeof useSearchParams>,
    );
  });

  it('updates payload when the share key changes', async () => {
    const payloadFirst: SharePayload = {
      teams: { '1-1': { id: '1-1', teamId: 1, leagueId: 1 } },
      activeTeam: { teamId: 1, leagueId: 1 },
      globalManualMatches: [],
      globalManualPlayers: [],
    };
    const payloadSecond: SharePayload = {
      teams: { '2-2': { id: '2-2', teamId: 2, leagueId: 2 } },
      activeTeam: { teamId: 2, leagueId: 2 },
      globalManualMatches: [],
      globalManualPlayers: [],
    };

    const mockFetch = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/api/share/first')) {
        return { ok: true, json: async () => payloadFirst } as Response;
      }
      if (url.includes('/api/share/second')) {
        return { ok: true, json: async () => payloadSecond } as Response;
      }
      return { ok: false, json: async () => null } as Response;
    });

    const { rerender } = render(
      <ShareProvider>
        <TestConsumer />
      </ShareProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-team')).toHaveTextContent('1-1');
    });

    currentConfig = 'second';
    rerender(
      <ShareProvider>
        <TestConsumer />
      </ShareProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-team')).toHaveTextContent('2-2');
    });
  });
});

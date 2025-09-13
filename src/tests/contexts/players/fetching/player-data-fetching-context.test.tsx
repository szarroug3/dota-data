import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { PlayerDataFetchingProvider, usePlayerDataFetching } from '@/frontend/players/contexts/fetching/player-data-fetching-context';

jest.mock('@/frontend/players/api/players', () => {
  return {
    getPlayer: jest.fn(async () => ({}) as never),
  };
});

describe('PlayerDataFetchingProvider cache integration', () => {
  const { getPlayer } = jest.requireMock('@/frontend/players/api/players') as { getPlayer: jest.Mock };

  const TestComponent: React.FC = () => {
    const { fetchPlayerData } = usePlayerDataFetching();
    const [status, setStatus] = React.useState<string>('');
    React.useEffect(() => {
      fetchPlayerData(123).then((res) => {
        if (res && typeof res === 'object' && 'error' in res) setStatus('error');
        else setStatus('ok');
      });
    }, [fetchPlayerData]);
    return <div data-testid="status">{status}</div>;
  };

  afterEach(() => {
    cleanup();
    getPlayer.mockReset();
    // keep localStorage to test persisted cache across mounts inside a single test when desired
  });

  test('uses network on first fetch and persists to cache; second mount returns from persisted cache without network', async () => {
    // Ensure clean storage
    localStorage.clear();

    // First mount: should call network and store in cache
    render(
      <PlayerDataFetchingProvider>
        <TestComponent />
      </PlayerDataFetchingProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ok'));
    expect(getPlayer).toHaveBeenCalledTimes(1);

    // Unmount and remount: memory cache is gone but persisted cache should be used
    cleanup();
    getPlayer.mockClear();

    render(
      <PlayerDataFetchingProvider>
        <TestComponent />
      </PlayerDataFetchingProvider>
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ok'));
    expect(getPlayer).toHaveBeenCalledTimes(0);
  });
});



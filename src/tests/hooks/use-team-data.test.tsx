import { act, renderHook } from '@testing-library/react';

import { TeamProvider } from '@/contexts/team-context';
import { useTeamData } from '@/hooks/use-team-data';

describe('useTeamData', () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <TeamProvider>{children}</TeamProvider>;
  }

  it('returns initial team data state', () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(result.current.activeTeam).toBeNull();
    expect(result.current.activeTeamId).toBeNull();
    expect(result.current.teamData).toBeNull();
    expect(result.current.teamStats).toBeNull();
    expect(typeof result.current.isLoadingTeams).toBe('boolean');
    expect(typeof result.current.isLoadingTeamData).toBe('boolean');
    expect(typeof result.current.isLoadingTeamStats).toBe('boolean');
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
    expect(result.current.teamStatsError).toBeNull();
  });

  it('can add, set, refresh, update, and remove a team', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    
    // Wait for initial data to load
    await act(async () => {
      // Wait a bit for initial teams to load
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Add a team
    await act(async () => {
      await result.current.addTeam('t3', 'l1');
    });
    expect(result.current.teams).toHaveLength(3);
    // Set active team
    act(() => {
      result.current.setActiveTeam('1');
    });
    expect(result.current.activeTeamId).toBe('1');
    // Refresh team
    await act(async () => {
      await result.current.refreshTeam('1');
    });
    // Update team
    await act(async () => {
      await result.current.updateTeam('1');
    });
    // Remove team
    await act(async () => {
      await result.current.removeTeam('1');
    });
    expect(result.current.teams).toHaveLength(2);
  });

  it('clears errors', async () => {
    const { result } = renderHook(() => useTeamData(), { wrapper });
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.teamsError).toBeNull();
    expect(result.current.teamDataError).toBeNull();
    expect(result.current.teamStatsError).toBeNull();
  });

  it('supports auto-refresh', async () => {
    const { result } = renderHook(() => useTeamData({ autoRefresh: true, refreshInterval: 1 }), { wrapper });
    
    // Wait for initial data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    // Test that the hook accepts options and returns data
    expect(result.current.teams).toBeInstanceOf(Array);
    expect(typeof result.current.setActiveTeam).toBe('function');
  });
}); 
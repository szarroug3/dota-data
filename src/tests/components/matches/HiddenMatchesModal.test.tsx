import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AppDataProvider } from '@/contexts/app-data-context';
import { HiddenMatchesModal } from '@/frontend/matches/components/stateless/HiddenMatchesModal';

jest.mock('@/contexts/app-data-context', () => ({
  AppDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAppData: () => ({
    getMatchResultLabel: () => 'Victory',
    getMatchPickOrderLabel: () => null,
    getMatchHeroesForTeam: () => [],
    isHighPerformingHero: () => false,
  }),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/frontend/matches/components/stateless/common/HeroAvatar', () => ({
  HeroAvatar: () => <div data-testid="hero-avatar" />,
}));

describe('HiddenMatchesModal', () => {
  const mockMatch = {
    id: 1,
    date: new Date('2024-01-01T00:00:00Z').toISOString(),
    duration: 1800,
    players: { radiant: [], dire: [] },
  } as any;

  it('renders list of hidden matches and calls unhide', () => {
    const onUnhide = jest.fn();
    const onClose = jest.fn();
    render(
      <AppDataProvider>
        <HiddenMatchesModal
          hiddenMatches={[mockMatch]}
          onUnhide={onUnhide}
          onClose={onClose}
          teamMatches={new Map()}
          selectedTeamId="1-1"
        />
      </AppDataProvider>,
    );

    expect(screen.getByText('Hidden Matches')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Unhide'));
    expect(onUnhide).toHaveBeenCalledWith(1);
  });

  it('closes when there are no hidden matches', async () => {
    const onClose = jest.fn();
    render(
      <AppDataProvider>
        <HiddenMatchesModal
          hiddenMatches={[]}
          onUnhide={() => {}}
          onClose={onClose}
          teamMatches={new Map()}
          selectedTeamId="1-1"
        />
      </AppDataProvider>,
    );
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});

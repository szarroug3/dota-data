import { fireEvent, render, screen } from '@testing-library/react';

import { HiddenMatchesModal } from '@/frontend/matches/components/stateless/HiddenMatchesModal';

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
    const teamMatches = new Map<number, any>([
      [
        mockMatch.id,
        {
          matchId: mockMatch.id,
          side: 'radiant',
          result: 'won',
          opponentName: 'Dire Dynasty',
          isManual: false,
          isHidden: true,
          pickOrder: 'first',
          heroes: [],
          duration: mockMatch.duration,
          date: mockMatch.date,
        },
      ],
    ]);

    render(
      <HiddenMatchesModal
        hiddenMatches={[mockMatch]}
        onUnhide={onUnhide}
        onClose={onClose}
        teamMatches={teamMatches}
      />,
    );

    expect(screen.getByText('Hidden Matches')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Unhide'));
    expect(onUnhide).toHaveBeenCalledWith(1);
  });

  it('closes when there are no hidden matches', () => {
    const onClose = jest.fn();
    render(
      <HiddenMatchesModal
        hiddenMatches={[]}
        onUnhide={() => {}}
        onClose={onClose}
        teamMatches={new Map()}
      />,
    );
    expect(onClose).toHaveBeenCalled();
  });
});

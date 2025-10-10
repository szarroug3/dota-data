import { fireEvent, render, screen } from '@testing-library/react';

import { HiddenMatchesModal } from '@/components/match-history/list/HiddenMatchesModal';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

const match = (id: number): Match => ({
  id,
  date: new Date().toISOString(),
  duration: 1200,
  result: 'radiant',
  players: { radiant: [], dire: [] },
  draft: undefined,
});

describe('HiddenMatchesModal', () => {
  it('renders hidden matches and closes when clicking overlay or close button', () => {
    const onUnhide = jest.fn();
    const onClose = jest.fn();
    const teamMatches: Record<number, TeamMatchParticipation> = {
      1: {
        matchId: 1,
        result: 'won',
        duration: 1200,
        opponentName: 'Opponent A',
        leagueId: '123',
        startTime: Date.now(),
        side: 'radiant',
        pickOrder: 'first',
      },
    };

    render(
      <HiddenMatchesModal
        hiddenMatches={[match(1)]}
        onUnhide={onUnhide}
        onClose={onClose}
        teamMatches={teamMatches}
      />
    );

    // Title and opponent
    expect(screen.getByText(/Hidden Matches/i)).toBeInTheDocument();
    expect(screen.getByText(/Opponent A/i)).toBeInTheDocument();

    // Unhide action
    fireEvent.click(screen.getByText(/Unhide/i));
    expect(onUnhide).toHaveBeenCalledWith(1);

    // Close via X button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-closes when no hidden matches', () => {
    const onUnhide = jest.fn();
    const onClose = jest.fn();
    render(
      <HiddenMatchesModal
        hiddenMatches={[]}
        onUnhide={onUnhide}
        onClose={onClose}
      />
    );

    // Effect should call onClose immediately
    expect(onClose).toHaveBeenCalled();
  });
});



import { fireEvent, render, screen } from '@testing-library/react';

import { ExternalSiteButton } from '@/components/match-history/common/ExternalSiteButton';

describe('ExternalSiteButton', () => {
  const originalOpen = window.open;
  beforeEach(() => {
    window.open = jest.fn();
  });
  afterEach(() => {
    window.open = originalOpen;
  });

  it('opens Dotabuff by default', () => {
    render(<ExternalSiteButton matchId={123} preferredSite="dotabuff" />);
    const btn = screen.getByRole('button', { name: /open match on dotabuff/i });
    fireEvent.click(btn);
    expect(window.open).toHaveBeenCalledWith(
      'https://www.dotabuff.com/matches/123',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens OpenDota when preferred', () => {
    render(<ExternalSiteButton matchId={456} preferredSite="opendota" />);
    const btn = screen.getByRole('button', { name: /open match on opendota/i });
    fireEvent.click(btn);
    expect(window.open).toHaveBeenCalledWith(
      'https://www.opendota.com/matches/456',
      '_blank',
      'noopener,noreferrer'
    );
  });
});



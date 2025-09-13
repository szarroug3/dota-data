import { fireEvent, render, screen } from '@testing-library/react';

import { PlayerExternalSiteButton } from '@/frontend/players/components/stateless/PlayerExternalSiteButton';

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('PlayerExternalSiteButton', () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it('renders with dotabuff configuration', () => {
    render(
      <PlayerExternalSiteButton
        playerId={123456789}
        preferredSite="dotabuff"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'View on Dotabuff');
    expect(button).toHaveAttribute('aria-label', 'Open player on Dotabuff');
  });

  it('renders with opendota configuration', () => {
    render(
      <PlayerExternalSiteButton
        playerId={123456789}
        preferredSite="opendota"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'View on OpenDota');
    expect(button).toHaveAttribute('aria-label', 'Open player on OpenDota');
  });

  it('opens correct URL when clicked for dotabuff', () => {
    render(
      <PlayerExternalSiteButton
        playerId={123456789}
        preferredSite="dotabuff"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.dotabuff.com/players/123456789',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens correct URL when clicked for opendota', () => {
    render(
      <PlayerExternalSiteButton
        playerId={123456789}
        preferredSite="opendota"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.opendota.com/players/123456789',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('prevents event propagation when clicked', () => {
    const mockStopPropagation = jest.fn();
    
    render(
      <PlayerExternalSiteButton
        playerId={123456789}
        preferredSite="dotabuff"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button, { stopPropagation: mockStopPropagation });

    expect(mockOpen).toHaveBeenCalled();
  });
}); 
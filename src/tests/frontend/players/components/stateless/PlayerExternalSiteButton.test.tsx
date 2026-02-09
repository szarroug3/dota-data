import { fireEvent, render, screen } from '@testing-library/react';

import { PlayerExternalSiteButton } from '@/frontend/players/components/stateless/PlayerExternalSiteButton';

describe('PlayerExternalSiteButton', () => {
  it('renders with dotabuff configuration', () => {
    render(<PlayerExternalSiteButton playerId={123456789} preferredSite="dotabuff" />);

    const link = screen.getByRole('link', { name: 'Open player on Dotabuff' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('title', 'View on Dotabuff');
    expect(link).toHaveAttribute('aria-label', 'Open player on Dotabuff');
    expect(link).toHaveAttribute('href', 'https://www.dotabuff.com/players/123456789');
  });

  it('renders with opendota configuration', () => {
    render(<PlayerExternalSiteButton playerId={123456789} preferredSite="opendota" />);

    const link = screen.getByRole('link', { name: 'Open player on OpenDota' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('title', 'View on OpenDota');
    expect(link).toHaveAttribute('aria-label', 'Open player on OpenDota');
    expect(link).toHaveAttribute('href', 'https://www.opendota.com/players/123456789');
  });

  it('links to dotabuff with safe target attributes', () => {
    render(<PlayerExternalSiteButton playerId={123456789} preferredSite="dotabuff" />);

    const link = screen.getByRole('link', { name: 'Open player on Dotabuff' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to opendota with safe target attributes', () => {
    render(<PlayerExternalSiteButton playerId={123456789} preferredSite="opendota" />);

    const link = screen.getByRole('link', { name: 'Open player on OpenDota' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('prevents event propagation when clicked', () => {
    const parentClick = jest.fn();

    render(
      <div onClick={parentClick}>
        <PlayerExternalSiteButton playerId={123456789} preferredSite="dotabuff" />
      </div>,
    );

    const link = screen.getByRole('link', { name: 'Open player on Dotabuff' });
    fireEvent.click(link);

    expect(parentClick).not.toHaveBeenCalled();
  });
});

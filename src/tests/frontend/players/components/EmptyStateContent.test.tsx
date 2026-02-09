import { render, screen } from '@testing-library/react';

import { EmptyStateContent } from '@/frontend/players/components/stateless/EmptyStateContent';

describe('EmptyStateContent', () => {
  it('renders no-teams state', () => {
    render(<EmptyStateContent type="no-teams" />);
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
    expect(screen.getByText(/Add a team first/i)).toBeInTheDocument();
  });

  it('renders no-selection state', () => {
    render(<EmptyStateContent type="no-selection" />);
    expect(screen.getByText('Select a Team')).toBeInTheDocument();
    expect(screen.getByText(/Choose a team from the sidebar/i)).toBeInTheDocument();
  });
});

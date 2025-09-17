import { render, screen } from '@testing-library/react';

import { ErrorContent } from '@/frontend/players/components/stateless/ErrorContent';

describe('ErrorContent', () => {
  it('renders provided error message', () => {
    render(<ErrorContent error="Something went wrong" />);
    expect(screen.getByText('Error Loading Player Data')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});



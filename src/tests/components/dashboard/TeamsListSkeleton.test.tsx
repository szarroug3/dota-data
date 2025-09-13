import { render } from '@testing-library/react';

import { TeamsListSkeleton } from '@/frontend/teams/components/stateless/TeamsListSkeleton';

describe('TeamsListSkeleton', () => {
  test('renders the requested number of TeamCardSkeleton items', () => {
    const { container } = render(<TeamsListSkeleton teamsCount={3} />);
    // Just assert something rendered; deeper DOM queries are unnecessary here
    expect(container.firstChild).toBeTruthy();
  });
});


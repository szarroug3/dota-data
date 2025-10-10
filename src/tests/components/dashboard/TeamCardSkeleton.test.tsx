import { render } from '@testing-library/react';

import { TeamCardSkeleton } from '@/frontend/teams/components/stateless/TeamCardSkeleton';

describe('TeamCardSkeleton', () => {
  test('renders without crashing', () => {
    const { container } = render(<TeamCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });
});

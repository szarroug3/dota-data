import { fireEvent, render, screen } from '@testing-library/react';

import { RefreshButton } from '@/components/match-history/common/RefreshButton';

describe('RefreshButton', () => {
  it('renders with default aria-label and triggers onClick (stopping propagation)', () => {
    const onClick = jest.fn();
    render(<RefreshButton onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /refresh match/i });
    const stopPropagation = jest.fn();
    fireEvent.click(btn, { stopPropagation });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables when loading', () => {
    const onClick = jest.fn();
    render(<RefreshButton onClick={onClick} loading />);
    const btn = screen.getByRole('button', { name: /refresh match/i });
    expect(btn).toBeDisabled();
  });
});



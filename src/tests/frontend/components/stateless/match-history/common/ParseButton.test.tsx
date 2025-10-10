import { fireEvent, render, screen } from '@testing-library/react';

import { ParseButton } from '@/components/match-history/common/ParseButton';

describe('ParseButton', () => {
  it('renders with default aria-label and triggers onClick', () => {
    const onClick = jest.fn();
    render(<ParseButton onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /parse match/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables when loading', () => {
    const onClick = jest.fn();
    render(<ParseButton onClick={onClick} loading />);
    const btn = screen.getByRole('button', { name: /parse match/i });
    expect(btn).toBeDisabled();
  });
});



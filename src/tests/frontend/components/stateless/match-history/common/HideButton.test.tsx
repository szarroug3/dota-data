import { fireEvent, render, screen } from '@testing-library/react';

import { HideButton } from '@/components/match-history/common/HideButton';

describe('HideButton', () => {
  it('renders with default aria-label and triggers onClick', () => {
    const onClick = jest.fn();
    render(<HideButton onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /hide match/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports custom aria-label and className', () => {
    const onClick = jest.fn();
    render(
      <HideButton onClick={onClick} ariaLabel="Hide it" className="custom-class" />
    );
    const btn = screen.getByRole('button', { name: /hide it/i });
    expect(btn).toHaveClass('custom-class');
  });
});



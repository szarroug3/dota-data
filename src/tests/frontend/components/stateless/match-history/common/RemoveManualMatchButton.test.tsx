import { fireEvent, render, screen } from '@testing-library/react';

import { RemoveManualMatchButton } from '@/components/match-history/common/RemoveManualMatchButton';

describe('RemoveManualMatchButton', () => {
  it('renders with default aria-label and triggers onClick', () => {
    const onClick = jest.fn();
    render(<RemoveManualMatchButton onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /remove manual match/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports custom aria-label and className', () => {
    const onClick = jest.fn();
    render(
      <RemoveManualMatchButton onClick={onClick} ariaLabel="Remove it" className="custom-class" />
    );
    const btn = screen.getByRole('button', { name: /remove it/i });
    expect(btn).toHaveClass('custom-class');
  });
});



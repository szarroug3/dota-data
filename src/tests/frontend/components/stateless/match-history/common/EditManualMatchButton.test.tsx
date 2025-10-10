import { fireEvent, render, screen } from '@testing-library/react';

import { EditManualMatchButton } from '@/components/match-history/common/EditManualMatchButton';

describe('EditManualMatchButton', () => {
  it('renders with default aria-label and triggers onClick', () => {
    const onClick = jest.fn();
    render(<EditManualMatchButton onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /edit manual match/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports custom aria-label and className', () => {
    const onClick = jest.fn();
    render(
      <EditManualMatchButton onClick={onClick} ariaLabel="Edit match now" className="custom-class" />
    );
    const btn = screen.getByRole('button', { name: /edit match now/i });
    expect(btn).toHaveClass('custom-class');
  });
});



import { fireEvent, render, screen } from '@testing-library/react';

import { AddPlayerSheet } from '@/frontend/players/components/stateless/AddPlayerSheet';

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, onOpenChange, children }: any) => (
    <div data-testid="sheet" data-open={open} onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ),
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
  SheetFooter: ({ children }: any) => <div>{children}</div>,
  SheetClose: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  FormField: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...rest }: any) => (
    <input aria-label="player-id" value={value} onChange={onChange} {...rest} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type = 'button', className }: any) => (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

describe('AddPlayerSheet', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    playerId: '',
    onChangePlayerId: () => {},
    onSubmit: () => {},
    isValid: true,
  };

  it('renders title and description', () => {
    render(<AddPlayerSheet {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Add New Player' })).toBeInTheDocument();
    expect(screen.getByText(/Add a player to track/i)).toBeInTheDocument();
  });

  it('disables submit when invalid or duplicate', () => {
    const { rerender } = render(<AddPlayerSheet {...baseProps} isValid={false} />);
    expect(screen.getByRole('button', { name: /Add Player/i })).toBeDisabled();

    rerender(<AddPlayerSheet {...baseProps} playerId={'101'} isValid={true} isDuplicate={true} />);
    expect(screen.getByRole('button', { name: 'Player Already Added' })).toBeDisabled();
  });

  it('calls onSubmit when valid and clicked', async () => {
    const onSubmit = jest.fn();
    render(<AddPlayerSheet {...baseProps} playerId={'101'} onSubmit={onSubmit} isValid={true} />);
    const btn = screen.getByRole('button', { name: 'Add Player' });
    fireEvent.click(btn);
    expect(onSubmit).toHaveBeenCalled();
  });
});

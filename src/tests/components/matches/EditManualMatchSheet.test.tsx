import { fireEvent, render, screen } from '@testing-library/react';

import { EditManualMatchSheet } from '@/frontend/matches/components/stateless/EditManualMatchSheet';

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
  FormField: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...rest }: any) => (
    <input aria-label="match-id" value={value} onChange={onChange} {...rest} />
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children, disabled }: any) => (
    <select aria-label="team-side" value={value} onChange={(e) => onValueChange?.(e.target.value)} disabled={disabled}>
      <option value="">Select team side</option>
      <option value="radiant">Radiant</option>
      <option value="dire">Dire</option>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

describe('EditManualMatchSheet', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    matchIdString: '',
    teamSide: '',
    onChangeMatchId: () => {},
    onChangeTeamSide: () => {},
    onSubmit: () => {},
    isFormValid: false,
  } as any;

  it('renders title and description', () => {
    render(<EditManualMatchSheet {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Edit Match' })).toBeInTheDocument();
    expect(screen.getByText(/Update the match ID or team side/i)).toBeInTheDocument();
  });

  it('disables submit when form invalid and shows proper label when duplicate', () => {
    const { rerender } = render(<EditManualMatchSheet {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Select Team Side' })).toBeDisabled();

    rerender(<EditManualMatchSheet {...baseProps} isFormValid={true} teamSide="radiant" duplicateError={'Dupe'} />);
    expect(screen.getByRole('button', { name: 'Match Already Exists' })).toBeInTheDocument();
  });

  it('calls onSubmit when valid and clicked', () => {
    const onSubmit = jest.fn();
    render(
      <EditManualMatchSheet
        {...baseProps}
        matchIdString={'123'}
        teamSide={'radiant'}
        isFormValid={true}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update Match' }));
    expect(onSubmit).toHaveBeenCalled();
  });
});

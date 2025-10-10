import { fireEvent, render, screen } from '@testing-library/react';

import { AddMatchForm } from '@/frontend/matches/components/stateless/AddMatchForm';

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
  Form: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
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

describe('AddMatchForm', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    matchId: '',
    teamSide: '' as '' | 'radiant' | 'dire',
    onMatchIdChange: () => {},
    onTeamSideChange: () => {},
    onSubmit: () => {},
    matchExists: () => false,
    isValid: true,
  };

  it('renders title and description', () => {
    render(<AddMatchForm {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Add New Match' })).toBeInTheDocument();
    expect(screen.getByText(/Add a match to analyze/i)).toBeInTheDocument();
  });

  it('disables submit only when invalid id or duplicate', () => {
    const { rerender } = render(<AddMatchForm {...baseProps} matchId="123" teamSide="" isValid={false} />);
    expect(screen.getByRole('button', { name: 'Invalid Match ID' })).toBeDisabled();

    rerender(<AddMatchForm {...baseProps} matchId="123" teamSide="" isValid={true} />);
    expect(screen.getByRole('button', { name: 'Add Match' })).toBeDisabled();

    rerender(<AddMatchForm {...baseProps} matchId="123" teamSide="radiant" isValid={true} />);
    expect(screen.getByRole('button', { name: 'Add Match' })).toBeEnabled();
  });

  it('shows duplicate text when match already exists', () => {
    render(<AddMatchForm {...baseProps} matchId="123" teamSide="radiant" isValid={true} matchExists={() => true} />);
    expect(screen.getByRole('button', { name: 'Match Already Added' })).toBeDisabled();
  });

  it('calls onSubmit when valid and clicked', () => {
    const onSubmit = jest.fn();
    const onMatchIdChange = jest.fn();
    const onTeamSideChange = jest.fn();
    render(
      <AddMatchForm
        {...baseProps}
        matchId="123"
        teamSide="radiant"
        isValid={true}
        onSubmit={onSubmit}
        onMatchIdChange={onMatchIdChange}
        onTeamSideChange={onTeamSideChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Match' }));
    expect(onSubmit).toHaveBeenCalled();
  });
});

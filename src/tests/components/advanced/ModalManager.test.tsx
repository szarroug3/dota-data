import { fireEvent, render, screen } from '@testing-library/react';

import { ConfirmModal, ModalManager, useModal, type ModalProps } from '@/components/advanced/ModalManager';

const mockModals: ModalProps[] = [
  {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  },
  {
    isOpen: false,
    onClose: jest.fn(),
    title: 'Hidden Modal',
    children: <div>Hidden content</div>
  }
];

describe('ModalManager', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <ModalManager
          modals={[mockModals[0]]}
        />
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <ModalManager
          modals={[mockModals[1]]}
        />
      );

      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });

    it('should render multiple modals', () => {
      render(
        <ModalManager
          modals={mockModals}
        />
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
    });
  });

  describe('Modal Sizes', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(
        <ModalManager
          modals={[{ ...mockModals[0], size: 'sm' }]}
        />
      );

      let modal = screen.getByRole('dialog');
      expect(modal.querySelector('.max-w-sm')).toBeInTheDocument();

      rerender(
        <ModalManager
          modals={[{ ...mockModals[0], size: 'lg' }]}
        />
      );

      modal = screen.getByRole('dialog');
      expect(modal.querySelector('.max-w-lg')).toBeInTheDocument();

      rerender(
        <ModalManager
          modals={[{ ...mockModals[0], size: 'xl' }]}
        />
      );

      modal = screen.getByRole('dialog');
      expect(modal.querySelector('.max-w-xl')).toBeInTheDocument();

      rerender(
        <ModalManager
          modals={[{ ...mockModals[0], size: 'full' }]}
        />
      );

      modal = screen.getByRole('dialog');
      expect(modal.querySelector('.max-w-full')).toBeInTheDocument();
    });
  });

  describe('Modal Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose }]}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose }]}
        />
      );

      const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose }]}
        />
      );

      const modalContent = screen.getByText('Modal content');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose }]}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape key is pressed if closeOnEscape is false', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose, closeOnEscape: false }]}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when backdrop is clicked if closeOnBackdrop is false', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], onClose: mockOnClose, closeOnBackdrop: false }]}
        />
      );

      const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal without Title', () => {
    it('should render modal without title', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], title: undefined }]}
        />
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should focus first focusable element when modal opens', () => {
      render(
        <ModalManager
          modals={[{
            ...mockModals[0],
            children: (
              <div>
                <button>First Button</button>
                <button>Second Button</button>
              </div>
            )
          }]}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open', () => {
      render(
        <ModalManager
          modals={[mockModals[0]]}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(
        <ModalManager
          modals={[mockModals[0]]}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <ModalManager
          modals={[{ ...mockModals[0], isOpen: false }]}
        />
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ModalManager
          modals={[mockModals[0]]}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have proper title association', () => {
      render(
        <ModalManager
          modals={[mockModals[0]]}
        />
      );

      const title = screen.getByText('Test Modal');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should not have aria-labelledby when no title', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], title: undefined }]}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <ModalManager
          modals={[{ ...mockModals[0], className: 'custom-modal' }]}
        />
      );

      const modalContainer = screen.getByRole('dialog').querySelector('[role="document"]');
      expect(modalContainer).toHaveClass('custom-modal');
    });
  });
});

describe('ConfirmModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render confirm modal with title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should render default button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should render custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        confirmText="Yes, proceed"
        cancelText="No, cancel"
      />
    );

    expect(screen.getByText('No, cancel')).toBeInTheDocument();
    expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('Confirm'));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('ConfirmModal Variants', () => {
    it('should apply danger variant styles', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          title="Delete Item"
          message="This action cannot be undone."
          onConfirm={mockOnConfirm}
          variant="danger"
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
    });

    it('should apply warning variant styles', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          title="Warning"
          message="This action may have consequences."
          onConfirm={mockOnConfirm}
          variant="warning"
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-yellow-600', 'hover:bg-yellow-700');
    });

    it('should apply info variant styles by default', () => {
      render(
        <ConfirmModal
          isOpen={true}
          onClose={mockOnClose}
          title="Info"
          message="Please confirm this action."
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    });
  });
});

describe('useModal Hook', () => {
  const TestComponent = () => {
    const { modals, openModal, closeModal, closeAllModals } = useModal();

    return (
      <div>
        <button onClick={() => openModal({
          title: 'Test Modal',
          children: <div>Modal content</div>
        })}>
          Open Modal
        </button>
        <button onClick={() => closeModal('modal-1')}>
          Close Modal
        </button>
        <button onClick={closeAllModals}>
          Close All Modals
        </button>
        <ModalManager modals={modals} />
      </div>
    );
  };

  it('should open modal', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Open Modal'));

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should close specific modal', () => {
    render(<TestComponent />);

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('Test Modal')).toBeInTheDocument();

    // Close modal using the close button
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should close all modals', () => {
    render(<TestComponent />);

    // Open multiple modals
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.click(screen.getByText('Open Modal'));

    expect(screen.getAllByText('Test Modal')).toHaveLength(2);

    // Close all modals
    fireEvent.click(screen.getByText('Close All Modals'));
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });
}); 
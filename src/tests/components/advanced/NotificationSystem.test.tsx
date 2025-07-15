import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NotificationSystem, useNotifications, type Notification } from '@/components/advanced/NotificationSystem';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Success!',
    message: 'Operation completed successfully.',
    duration: 5000
  },
  {
    id: '2',
    type: 'error',
    title: 'Error!',
    message: 'Something went wrong.',
    duration: 0
  },
  {
    id: '3',
    type: 'warning',
    title: 'Warning!',
    message: 'Please check your input.',
    duration: 3000
  },
  {
    id: '4',
    type: 'info',
    title: 'Info',
    message: 'Here is some information.',
    action: {
      label: 'View Details',
      onClick: jest.fn()
    }
  }
];

describe('NotificationSystem', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Notification Types', () => {
    it('should render success notification', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
    });

    it('should render error notification', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[1]]}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
    });

    it('should render warning notification', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[2]]}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByText('Please check your input.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
    });

    it('should render info notification', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[3]]}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Here is some information.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-accent');
    });
  });

  describe('Notification Icons', () => {
    it('should render success icon', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-success');
    });

    it('should render error icon', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[1]]}
          onDismiss={mockOnDismiss}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-destructive');
    });

    it('should render warning icon', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[2]]}
          onDismiss={mockOnDismiss}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-yellow-500');
    });

    it('should render info icon', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[3]]}
          onDismiss={mockOnDismiss}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-primary');
    });
  });

  describe('Notification Actions', () => {
    it('should render action button when provided', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[3]]}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call action onClick when action button is clicked', () => {
      const mockActionClick = jest.fn();
      const notificationWithAction: Notification = {
        ...mockNotifications[3],
        action: {
          label: 'View Details',
          onClick: mockActionClick
        }
      };

      render(
        <NotificationSystem
          notifications={[notificationWithAction]}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.click(screen.getByText('View Details'));
      expect(mockActionClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call onDismiss when dismiss button is clicked', async () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('1');
      }, { timeout: 1000 });
    });

    it('should auto-dismiss notification after duration', async () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      // Fast-forward time to trigger auto-dismiss
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('1');
      });
    });

    it('should not auto-dismiss notification with duration 0', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[1]]}
          onDismiss={mockOnDismiss}
        />
      );

      // Fast-forward time
      jest.advanceTimersByTime(10000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Notifications', () => {
    it('should render multiple notifications', () => {
      render(
        <NotificationSystem
          notifications={mockNotifications}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should call onDismiss with correct ID for each notification', async () => {
      render(
        <NotificationSystem
          notifications={mockNotifications}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButtons = screen.getAllByLabelText('Dismiss notification');
      
      fireEvent.click(dismissButtons[0]);
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('1');
      }, { timeout: 1000 });

      fireEvent.click(dismissButtons[1]);
      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('2');
      }, { timeout: 1000 });
    });
  });

  describe('Animation', () => {
    it('should have proper animation classes', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      const notification = screen.getByRole('alert');
      expect(notification).toHaveClass('transform', 'transition-all', 'duration-300');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      const notification = screen.getByRole('alert');
      expect(notification).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper dismiss button accessibility', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onDismiss={mockOnDismiss}
          className="custom-notifications"
        />
      );

      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveClass('custom-notifications');
    });
  });
});

describe('useNotifications Hook', () => {
  const TestComponent = () => {
    const { notifications, addNotification, removeNotification, clearAll } = useNotifications();

    return (
      <div>
        <button onClick={() => addNotification({
          type: 'success',
          title: 'Test',
          message: 'Test message'
        })}>
          Add Notification
        </button>
        <button onClick={() => removeNotification('1')}>
          Remove Notification
        </button>
        <button onClick={clearAll}>
          Clear All
        </button>
        <NotificationSystem
          notifications={notifications}
          onDismiss={removeNotification}
        />
      </div>
    );
  };

  it('should add notification', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Add Notification'));

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should remove notification', async () => {
    render(<TestComponent />);

    // Add notification first
    fireEvent.click(screen.getByText('Add Notification'));
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Remove notification by clicking the dismiss button
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should clear all notifications', () => {
    render(<TestComponent />);

    // Add multiple notifications
    fireEvent.click(screen.getByText('Add Notification'));
    fireEvent.click(screen.getByText('Add Notification'));

    expect(screen.getAllByText('Test')).toHaveLength(2);

    // Clear all
    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
}); 
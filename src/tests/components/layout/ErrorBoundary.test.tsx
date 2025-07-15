import { fireEvent, render, screen } from '@testing-library/react';
import { Component } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

// Helpers
class ThrowError extends Component<{ shouldThrow?: boolean }> {
  constructor(props: { shouldThrow?: boolean }) {
    super(props);
    if (props.shouldThrow) {
      throw new Error('Test error');
    }
  }
  render() { return <div>Normal content</div>; }
}
class NormalComponent extends Component { render() { return <div>Normal content</div>; } }
const suppressConsoleError = () => jest.spyOn(console, 'error').mockImplementation(() => {});

// Normal operation
describe('ErrorBoundary - Normal operation', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
  it('should render children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});

// Error handling
describe('ErrorBoundary - Error handling', () => {
  it('should catch errors and render fallback UI', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. Please try again or contact support if the problem persists.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });
  it('should call onError callback when error occurs', () => {
    const onErrorMock = jest.fn();
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    consoleSpy.mockRestore();
  });
});

// Error recovery
describe('ErrorBoundary - Error recovery', () => {
  it('should reset error state and render children after retry', () => {
    const consoleSpy = suppressConsoleError();
    let key = 0;
    const { rerender } = render(
      <ErrorBoundary key={key}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    key++;
    rerender(
      <ErrorBoundary key={key}>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});

// Development mode
describe('ErrorBoundary - Development mode', () => {
  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const detailsElement = screen.getByText('Error Details (Development)');
    expect(detailsElement).toBeInTheDocument();
    fireEvent.click(detailsElement);
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    consoleSpy.mockRestore();
  });
  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const detailsElement = screen.queryByText('Error Details (Development)');
    expect(detailsElement).not.toBeInTheDocument();
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    consoleSpy.mockRestore();
  });
});

// Accessibility
describe('ErrorBoundary - Accessibility', () => {
  it('should have proper button roles', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    const reportButton = screen.getByRole('button', { name: 'Report Error' });
    expect(retryButton).toBeInTheDocument();
    expect(reportButton).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
  it('should have proper heading structure', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const heading = screen.getByText('Something went wrong');
    expect(heading).toHaveClass('text-lg', 'font-medium');
    consoleSpy.mockRestore();
  });
});

// Styling and layout
describe('ErrorBoundary - Styling and layout', () => {
  it('should have proper error UI styling', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
    const errorCard = document.querySelector('.max-w-md');
    expect(errorCard).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
  it('should have proper button styling', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const retryButton = screen.getByText('Try Again');
    const reportButton = screen.getByText('Report Error');
    expect(retryButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white');
    expect(reportButton).toHaveClass('bg-muted', 'hover:bg-accent');
    consoleSpy.mockRestore();
  });
});

// Dark mode support
describe('ErrorBoundary - Dark mode support', () => {
  it('should have dark mode classes', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const container = document.querySelector('.bg-muted');
    expect(container).toBeInTheDocument();
    const errorCard = document.querySelector('.bg-card');
    expect(errorCard).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
  it('should have dark mode text classes', () => {
    const consoleSpy = suppressConsoleError();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    const heading = screen.getByText('Something went wrong');
    const description = screen.getByText(/We encountered an unexpected error/);
    expect(heading).toHaveClass('text-foreground');
    expect(description).toHaveClass('text-muted-foreground');
    consoleSpy.mockRestore();
  });
}); 
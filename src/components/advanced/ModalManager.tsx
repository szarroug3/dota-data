import React, { useCallback, useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export interface ModalManagerProps {
  modals: ModalProps[];
  className?: string;
}

// Extended modal props with ID for internal use
interface ModalWithId extends ModalProps {
  id?: string;
}

// Helper function to get size classes
const getSizeClasses = (size: ModalProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'max-w-sm';
    case 'md':
      return 'max-w-md';
    case 'lg':
      return 'max-w-lg';
    case 'xl':
      return 'max-w-xl';
    case 'full':
      return 'max-w-full mx-4';
    default:
      return 'max-w-md';
  }
};

// Helper function to render modal header
const renderModalHeader = (title: string, onClose: () => void) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
    <h2
      id="modal-title"
      className="text-lg font-medium text-gray-900 dark:text-white"
    >
      {title}
    </h2>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      aria-label="Close modal"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// Helper function to render modal backdrop
const renderModalBackdrop = (closeOnBackdrop: boolean, onClose: () => void) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
    onClick={(event) => {
      if (event.target === event.currentTarget && closeOnBackdrop) {
        onClose();
      }
    }}
    aria-hidden="true"
  />
);

// Individual modal component
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      {renderModalBackdrop(closeOnBackdrop, onClose)}

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative bg-white dark:bg-gray-800 rounded-lg shadow-xl
            transform transition-all duration-300 ease-in-out
            w-full ${getSizeClasses(size)} ${className}
          `}
          role="document"
        >
          {/* Header */}
          {title && renderModalHeader(title, onClose)}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalManager: React.FC<ModalManagerProps> = ({ modals, className = '' }) => {
  return (
    <div className={className}>
      {modals.map((modal, index) => (
        <Modal key={index} {...modal} />
      ))}
    </div>
  );
};

// Hook for managing modals
export const useModal = () => {
  const [modals, setModals] = React.useState<ModalWithId[]>([]);

  const closeModal = useCallback((modalId: string) => {
    setModals(prev => prev.filter(modal => modal.id !== modalId));
  }, []);

  const openModal = useCallback((modalProps: Omit<ModalProps, 'isOpen' | 'onClose'>) => {
    const modalId = Math.random().toString(36).substr(2, 9);
    const newModal: ModalWithId = {
      ...modalProps,
      isOpen: true,
      onClose: () => closeModal(modalId),
      id: modalId
    };
    setModals(prev => [...prev, newModal]);
    return modalId;
  }, [closeModal]);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals
  };
};

// Helper function to get variant classes
const getVariantClasses = (variant: 'danger' | 'warning' | 'info'): string => {
  switch (variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    case 'info':
    default:
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
  }
};

// Convenience components for common modal types
export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantClasses(variant)}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}; 
import React from 'react';

interface MobileSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const MobileSidebarToggle: React.FC<MobileSidebarToggleProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 bg-card dark:bg-card border border-border dark:border-border rounded-lg shadow-lg text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      title={isOpen ? 'Close menu' : 'Open menu'}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span
          className={`block w-5 h-0.5 bg-current transform transition-all duration-200 ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-current transform transition-all duration-200 mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-current transform transition-all duration-200 mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
        />
      </div>
    </button>
  );
}; 
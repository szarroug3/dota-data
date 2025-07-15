import React, { useRef } from 'react';

interface SidebarToggleSwitchProps {
  leftIcon: React.ReactNode; // ON/active state icon
  rightIcon: React.ReactNode; // OFF/inactive state icon
  isCollapsed: boolean;
  isActive: boolean;
  onClick: () => void;
  ariaLabel?: string;
  iconColor?: string;
}

const ANIMATION_DURATION = 300; // Match sidebar transition duration

// Common button styles
const buttonStyles = "w-full h-12 flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-transparent";

// Common icon styles
const iconStyles = (iconColor: string) => `w-8 h-8 flex justify-center items-center ${iconColor}`;

// Helper function to handle keyboard events
const handleKeyDown = (event: React.KeyboardEvent, onClick: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
};

// Switch component
const ToggleSwitch: React.FC<{
  isActive: boolean;
  switchRef: React.RefObject<HTMLDivElement>;
}> = ({ isActive, switchRef }) => (
  <div
    ref={switchRef}
    className={`w-10 h-6 rounded-full flex items-center relative transition-colors duration-200 ${isActive ? 'bg-blue-700 dark:bg-blue-500' : 'bg-muted-foreground/60 dark:bg-muted-foreground/60'}`}
    aria-hidden="true"
  >
    <div
      className="w-4 h-4 bg-background rounded-full absolute transition-all duration-200 ease-in-out shadow"
      style={{
        left: isActive ? '20px' : '2px',
        transition: 'left 200ms ease-in-out',
      }}
    />
  </div>
);

export const SidebarToggleSwitch: React.FC<SidebarToggleSwitchProps> = ({
  leftIcon,
  rightIcon,
  isCollapsed,
  isActive,
  onClick,
  ariaLabel,
  iconColor = 'text-muted-foreground',
}) => {
  const switchRef = useRef<HTMLDivElement>(null!);

  // Determine which icon is active
  const activeIcon = isActive ? rightIcon : leftIcon;

  if (isCollapsed) {
    // Collapsed state - show only the active icon centered
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(e) => handleKeyDown(e, onClick)}
        className={buttonStyles}
        aria-label={ariaLabel}
        title={ariaLabel}
        style={{ minHeight: 48 }}
      >
        <span
          className={iconStyles(iconColor)}
          style={{
            transition: `all ${ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
          }}
        >
          {activeIcon}
        </span>
      </button>
    );
  }

  // Expanded state - show both icons with switch
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => handleKeyDown(e, onClick)}
      className={buttonStyles}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{ minHeight: 48 }}
    >
      <div className="flex items-center gap-3 mx-auto relative">
        <span
          className={iconStyles(iconColor)}
          style={{
            transition: `all ${ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
          }}
        >
          {leftIcon}
        </span>
        
        <div className="relative w-10 h-6">
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: 1,
              transform: 'scale(1)',
            }}
          >
            <ToggleSwitch isActive={isActive} switchRef={switchRef} />
          </div>
        </div>
        
        <span
          className={iconStyles(iconColor)}
          style={{
            transition: `all ${ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
          }}
        >
          {rightIcon}
        </span>
      </div>
    </button>
  );
}; 
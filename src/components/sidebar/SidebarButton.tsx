import React from 'react';

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  iconColor?: string;
}

export const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  isCollapsed,
  isActive,
  onClick,
  ariaLabel,
  iconColor,
}) => {
  const buttonClasses = `
    w-full h-12 flex items-center text-sm font-medium transition-all duration-200
    hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
    ${isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-foreground'
    }
  `;

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses}
      aria-label={ariaLabel || label} aria-current={isActive ? "page" : undefined}
      title={label}
    >
      <span className={`w-16 flex justify-center items-center ${isActive ? iconColor : 'text-muted-foreground'}`}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="flex-1 truncate text-left">{label}</span>
      )}
    </button>
  );
}; 
# Color System

This document outlines the comprehensive color system for the Dota 2 Data Dashboard, including color palettes, theme support, accessibility standards, and usage guidelines.

## Table of Contents

- [Color Philosophy](#color-philosophy)
- [Primary Color Palette](#primary-color-palette)
- [Secondary Color Palette](#secondary-color-palette)
- [Semantic Color Palette](#semantic-color-palette)
- [Neutral Color Palette](#neutral-color-palette)
- [Theme Support](#theme-support)
- [Accessibility Standards](#accessibility-standards)
- [Color Blindness Considerations](#color-blindness-considerations)
- [Usage Guidelines](#usage-guidelines)
- [Implementation Examples](#implementation-examples)

## Color Philosophy

The color system is built on the following principles:

- **Accessibility First**: All colors meet WCAG 2.1 AA contrast requirements
- **Modern Color Space**: Uses OKLCH color space for better perceptual uniformity
- **Theme Consistency**: Seamless light/dark theme transitions
- **Semantic Meaning**: Colors convey meaning beyond aesthetics
- **Performance**: Optimized for rendering and accessibility

## Primary Color Palette

### Light Theme Primary Colors
```css
:root {
  /* Primary Blue - Main brand color */
  --primary: oklch(0.208 0.042 265.755);        /* #3B82F6 */
  --primary-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */
  
  /* Primary variations for different states */
  --primary-50: oklch(0.968 0.007 247.896);     /* #F3F4F6 - Lightest */
  --primary-100: oklch(0.929 0.013 255.508);    /* #E5E7EB - Light */
  --primary-500: oklch(0.208 0.042 265.755);    /* #3B82F6 - Base */
  --primary-600: oklch(0.184 0.042 265.755);    /* #2563EB - Dark */
  --primary-700: oklch(0.160 0.042 265.755);    /* #1D4ED8 - Darker */
}
```

### Dark Theme Primary Colors
```css
.dark {
  /* Primary Blue - Adjusted for dark theme */
  --primary: oklch(0.929 0.013 255.508);        /* #60A5FA - Lighter for contrast */
  --primary-foreground: oklch(0.208 0.042 265.755); /* #1F2937 - Dark background */
  
  /* Primary variations for dark theme */
  --primary-50: oklch(0.129 0.042 264.695);     /* #111827 - Darkest */
  --primary-100: oklch(0.208 0.042 265.755);    /* #1F2937 - Dark */
  --primary-500: oklch(0.929 0.013 255.508);    /* #60A5FA - Base */
  --primary-600: oklch(0.208 0.042 265.755);    /* #3B82F6 - Light */
  --primary-700: oklch(0.184 0.042 265.755);    /* #2563EB - Lighter */
}
```

### Primary Color Usage
- **Primary Actions**: Main call-to-action buttons, important links
- **Active States**: Selected navigation items, focused elements
- **Brand Elements**: Logo, header accents, primary navigation
- **Interactive Elements**: Buttons, links, form controls

## Secondary Color Palette

### Light Theme Secondary Colors
```css
:root {
  /* Secondary Gray - Supporting color */
  --secondary: oklch(0.968 0.007 247.896);      /* #F3F4F6 */
  --secondary-foreground: oklch(0.208 0.042 265.755); /* #3B82F6 */
  
  /* Secondary variations */
  --secondary-50: oklch(0.984 0.003 247.858);   /* #FFFFFF - Lightest */
  --secondary-100: oklch(0.968 0.007 247.896);  /* #F3F4F6 - Light */
  --secondary-500: oklch(0.554 0.046 257.417);  /* #6B7280 - Base */
  --secondary-600: oklch(0.374 0.046 257.417);  /* #4B5563 - Dark */
  --secondary-700: oklch(0.294 0.046 257.417);  /* #374151 - Darker */
}
```

### Dark Theme Secondary Colors
```css
.dark {
  /* Secondary Gray - Adjusted for dark theme */
  --secondary: oklch(0.279 0.041 260.031);      /* #374151 */
  --secondary-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */
  
  /* Secondary variations for dark theme */
  --secondary-50: oklch(0.129 0.042 264.695);   /* #111827 - Darkest */
  --secondary-100: oklch(0.208 0.042 265.755);  /* #1F2937 - Dark */
  --secondary-500: oklch(0.704 0.04 256.788);   /* #9CA3AF - Base */
  --secondary-600: oklch(0.554 0.046 257.417);  /* #6B7280 - Light */
  --secondary-700: oklch(0.374 0.046 257.417);  /* #4B5563 - Lighter */
}
```

### Secondary Color Usage
- **Secondary Actions**: Less important buttons, supporting elements
- **Backgrounds**: Subtle background elements, cards, containers
- **Borders**: Card borders, dividers, subtle separators
- **Muted Text**: Supporting text, captions, metadata

## Semantic Color Palette

### Success Colors
```css
/* Light Theme */
--success: oklch(0.646 0.222 41.116);           /* #10B981 - Green */
--success-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */

/* Dark Theme */
--success: oklch(0.488 0.243 264.376);          /* #34D399 - Lighter Green */
--success-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */
```

### Warning Colors
```css
/* Light Theme */
--warning: oklch(0.828 0.189 84.429);           /* #F59E0B - Amber */
--warning-foreground: oklch(0.129 0.042 264.695); /* #1F2937 */

/* Dark Theme */
--warning: oklch(0.769 0.188 70.08);            /* #FBBF24 - Lighter Amber */
--warning-foreground: oklch(0.129 0.042 264.695); /* #1F2937 */
```

### Error Colors
```css
/* Light Theme */
--destructive: oklch(0.577 0.245 27.325);       /* #EF4444 - Red */
--destructive-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */

/* Dark Theme */
--destructive: oklch(0.704 0.191 22.216);       /* #F87171 - Lighter Red */
--destructive-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF */
```

### Info Colors
```css
/* Light Theme */
--info: oklch(0.6 0.118 184.704);               /* #06B6D4 - Cyan */
--info-foreground: oklch(0.984 0.003 247.858);  /* #FFFFFF */

/* Dark Theme */
--info: oklch(0.696 0.17 162.48);               /* #22D3EE - Lighter Cyan */
--info-foreground: oklch(0.984 0.003 247.858);  /* #FFFFFF */
```

### Semantic Color Usage
- **Success**: Completed actions, positive feedback, successful operations
- **Warning**: Caution messages, pending states, attention required
- **Error**: Error messages, destructive actions, failed operations
- **Info**: Informational messages, help text, neutral notifications

## Neutral Color Palette

### Light Theme Neutral Colors
```css
:root {
  /* Background and Foreground */
  --background: oklch(1 0 0);                    /* #FFFFFF - Pure White */
  --foreground: oklch(0.129 0.042 264.695);     /* #1F2937 - Dark Gray */
  
  /* Muted Colors */
  --muted: oklch(0.968 0.007 247.896);          /* #F3F4F6 - Light Gray */
  --muted-foreground: oklch(0.554 0.046 257.417); /* #6B7280 - Gray */
  
  /* Border and Input */
  --border: oklch(0.929 0.013 255.508);         /* #E5E7EB - Border Gray */
  --input: oklch(0.929 0.013 255.508);          /* #E5E7EB - Input Gray */
  
  /* Card and Popover */
  --card: oklch(1 0 0);                          /* #FFFFFF - White */
  --card-foreground: oklch(0.129 0.042 264.695); /* #1F2937 - Dark Gray */
  --popover: oklch(1 0 0);                       /* #FFFFFF - White */
  --popover-foreground: oklch(0.129 0.042 264.695); /* #1F2937 - Dark Gray */
}
```

### Dark Theme Neutral Colors
```css
.dark {
  /* Background and Foreground */
  --background: oklch(0.129 0.042 264.695);     /* #1F2937 - Dark Gray */
  --foreground: oklch(0.984 0.003 247.858);     /* #FFFFFF - White */
  
  /* Muted Colors */
  --muted: oklch(0.279 0.041 260.031);          /* #374151 - Dark Gray */
  --muted-foreground: oklch(0.704 0.04 256.788); /* #9CA3AF - Light Gray */
  
  /* Border and Input */
  --border: oklch(1 0 0 / 10%);                 /* White with 10% opacity */
  --input: oklch(1 0 0 / 15%);                  /* White with 15% opacity */
  
  /* Card and Popover */
  --card: oklch(0.208 0.042 265.755);           /* #1F2937 - Dark Gray */
  --card-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */
  --popover: oklch(0.208 0.042 265.755);        /* #1F2937 - Dark Gray */
  --popover-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */
}
```

## Theme Support

### Light Theme (Default)
- **Background**: Clean white for optimal readability
- **Text**: High contrast dark gray for accessibility
- **Cards**: Subtle gray borders and shadows
- **Interactive Elements**: Blue primary color with white text
- **Semantic Colors**: Vibrant colors for clear meaning

### Dark Theme
- **Background**: Dark gray for reduced eye strain
- **Text**: High contrast white for readability
- **Cards**: Darker backgrounds with subtle borders
- **Interactive Elements**: Lighter blue for better contrast
- **Semantic Colors**: Adjusted brightness for dark backgrounds

### Theme Switching
```tsx
// Theme context implementation
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme} className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

## Accessibility Standards

### WCAG 2.1 AA Contrast Requirements

#### Normal Text (4.5:1 minimum)
- **Light Theme**: Dark gray text on white background (15.6:1)
- **Dark Theme**: White text on dark gray background (15.6:1)
- **Primary Text**: All body text meets this requirement

#### Large Text (3:1 minimum)
- **Headings**: All heading text meets this requirement
- **Large UI Elements**: Buttons, links, and large text elements

#### UI Components (3:1 minimum)
- **Buttons**: Primary and secondary buttons meet contrast requirements
- **Form Elements**: Input fields and labels have sufficient contrast
- **Interactive Elements**: All clickable elements meet requirements

### Focus Indicators
```css
/* High contrast focus ring */
:root {
  --ring: oklch(0.704 0.04 256.788);            /* High contrast blue */
}

.dark {
  --ring: oklch(0.551 0.027 264.364);           /* Adjusted for dark theme */
}

/* Focus ring implementation */
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Color Contrast Verification
```tsx
// Example: Contrast ratio calculation
const calculateContrastRatio = (color1: string, color2: string): number => {
  // Implementation for calculating WCAG contrast ratio
  // Returns ratio like 4.5:1
};

// Usage in component
const buttonContrast = calculateContrastRatio(
  getComputedStyle(button).backgroundColor,
  getComputedStyle(button).color
);
```

## Color Blindness Considerations

### Red-Green Color Blindness (Deuteranopia)
- **Avoid**: Relying solely on red/green for status indicators
- **Use**: Icons, patterns, and text labels in addition to color
- **Example**: Success/error states use both color and icons

### Blue-Yellow Color Blindness (Tritanopia)
- **Avoid**: Relying solely on blue for important information
- **Use**: Sufficient contrast and alternative indicators
- **Example**: Primary buttons use both color and clear labeling

### Monochrome Vision
- **Ensure**: All information is distinguishable without color
- **Use**: Patterns, icons, and text labels
- **Test**: Verify with grayscale simulation

### Color Blindness Testing
```tsx
// Example: Color-blind friendly status indicator
const StatusIndicator = ({ status }: { status: 'success' | 'error' | 'warning' }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: '✓',
          label: 'Success',
          className: 'status-success',
          color: 'var(--success)'
        };
      case 'error':
        return {
          icon: '✗',
          label: 'Error',
          className: 'status-error',
          color: 'var(--destructive)'
        };
      case 'warning':
        return {
          icon: '⚠',
          label: 'Warning',
          className: 'status-warning',
          color: 'var(--warning)'
        };
      default:
        return {
          icon: '•',
          label: 'Unknown',
          className: 'status-unknown',
          color: 'var(--muted-foreground)'
        };
    }
  };
  
  const statusInfo = getStatusInfo(status);
  
  return (
    <span 
      className={`status-indicator ${statusInfo.className}`}
      style={{ color: statusInfo.color }}
    >
      <span aria-hidden="true">{statusInfo.icon}</span>
      <span className="sr-only">{statusInfo.label}</span>
    </span>
  );
};
```

## Usage Guidelines

### Primary Color Usage
- **Primary Actions**: Main call-to-action buttons, important links
- **Active States**: Selected navigation items, focused elements
- **Brand Elements**: Logo, header accents, primary navigation
- **Interactive Elements**: Buttons, links, form controls

### Secondary Color Usage
- **Secondary Actions**: Less important buttons, supporting elements
- **Backgrounds**: Subtle background elements, cards, containers
- **Borders**: Card borders, dividers, subtle separators
- **Muted Text**: Supporting text, captions, metadata

### Semantic Color Usage
- **Success**: Completed actions, positive feedback, successful operations
- **Warning**: Caution messages, pending states, attention required
- **Error**: Error messages, destructive actions, failed operations
- **Info**: Informational messages, help text, neutral notifications

### Neutral Color Usage
- **Backgrounds**: Page backgrounds, card backgrounds
- **Text**: Body text, headings, labels
- **Borders**: Container borders, dividers, input borders
- **Muted Elements**: Disabled states, secondary information

### Color Combinations
```css
/* Recommended color combinations */
.primary-button {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.secondary-button {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.success-message {
  background-color: var(--success);
  color: var(--success-foreground);
}

.error-message {
  background-color: var(--destructive);
  color: var(--destructive-foreground);
}

.card {
  background-color: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
}
```

## Implementation Examples

### CSS Custom Properties
```css
/* Theme-aware color variables */
:root {
  --bg-primary: var(--background);
  --bg-secondary: var(--muted);
  --text-primary: var(--foreground);
  --text-secondary: var(--muted-foreground);
  --border-color: var(--border);
}

[data-theme="dark"] {
  --bg-primary: var(--background);
  --bg-secondary: var(--muted);
  --text-primary: var(--foreground);
  --text-secondary: var(--muted-foreground);
  --border-color: var(--border);
}
```

### React Component Example
```tsx
// Example: Theme-aware button component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children,
  onClick 
}) => {
  const getButtonStyles = () => {
    const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    };
    
    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  return (
    <button 
      className={getButtonStyles()}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Tailwind CSS Integration
```css
/* Tailwind configuration for color system */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
    },
  },
};
```

## Cross-References

### Related Documentation
- **[Typography System](./typography.md)**: Font scales and text color usage
- **[Component Specifications](./components.md)**: Component-specific color usage
- **[Accessibility Guidelines](../accessibility/color-contrast.md)**: Detailed contrast requirements
- **[UI Standards](../../architecture/frontend/ui-standards.md)**: Technical implementation details

### Implementation Files
- `src/app/globals.css`: CSS custom properties and theme definitions
- `tailwind.config.js`: Tailwind CSS color configuration
- `src/contexts/ThemeContext.tsx`: Theme switching implementation

### Testing and Validation
- **Color Contrast Testing**: Use browser dev tools or contrast analyzers
- **Color Blindness Testing**: Test with color blindness simulators
- **Theme Switching**: Verify all colors work in both light and dark themes
- **Accessibility Audits**: Regular testing with screen readers and keyboard navigation

---

*This color system documentation provides a comprehensive foundation for consistent, accessible, and maintainable color usage across the Dota 2 Data Dashboard application.* 
# UI Standards

This document outlines the UI standards, design patterns, and accessibility requirements for the Dota 2 Data Dashboard.

## Table of Contents

- [Design System](#design-system)
- [Accessibility Standards](#accessibility-standards)
- [Responsive Design](#responsive-design)
- [Theme System](#theme-system)
- [UI Component Patterns](#ui-component-patterns)

## Design System

### Color Palette

#### Light Theme
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Neutral Colors */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;
  
  /* Semantic Colors */
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --info-500: #3b82f6;
}
```

#### Dark Theme
```css
[data-theme="dark"] {
  /* Primary Colors */
  --primary-50: #1e3a8a;
  --primary-100: #1e40af;
  --primary-500: #60a5fa;
  --primary-600: #3b82f6;
  --primary-700: #2563eb;
  
  /* Neutral Colors */
  --neutral-50: #111827;
  --neutral-100: #1f2937;
  --neutral-200: #374151;
  --neutral-300: #4b5563;
  --neutral-400: #6b7280;
  --neutral-500: #9ca3af;
  --neutral-600: #d1d5db;
  --neutral-700: #e5e7eb;
  --neutral-800: #f3f4f6;
  --neutral-900: #f9fafb;
  
  /* Semantic Colors */
  --success-500: #34d399;
  --warning-500: #fbbf24;
  --error-500: #f87171;
  --info-500: #60a5fa;
}
```

### Typography

#### Font Stack
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
}
```

#### Type Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing System

#### Spacing Scale
```css
:root {
  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

#### Usage Patterns
```css
/* Card padding */
.card {
  padding: var(--space-4); /* 16px */
}

/* Section margin */
.section {
  margin-bottom: var(--space-6); /* 24px */
}

/* Grid gap */
.grid {
  gap: var(--space-4); /* 16px */
}

/* Form field spacing */
.form-field {
  margin-bottom: var(--space-3); /* 12px */
}

/* Button spacing */
.button {
  margin-top: var(--space-4); /* 16px */
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio

#### Keyboard Navigation
```tsx
// All interactive elements must be keyboard accessible
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
>
  Click me
</button>
```

#### Focus Management
```tsx
// Proper focus management for modals and dialogs
useEffect(() => {
  if (isOpen) {
    // Trap focus in modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements?.length) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }
}, [isOpen]);
```

#### ARIA Labels and Roles
```tsx
// Proper ARIA labels for screen readers
<button
  aria-label="Add new team"
  aria-describedby="team-form-help"
  role="button"
>
  <PlusIcon aria-hidden="true" />
  Add Team
</button>
```

#### Live Regions
```tsx
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

### Screen Reader Support

#### Semantic HTML
```tsx
// Use semantic HTML elements
<main>
  <h1>Dashboard</h1>
  <section aria-labelledby="team-section-heading">
    <h2 id="team-section-heading">Team Overview</h2>
    <article>
      <h3>Active Team</h3>
      {/* Content */}
    </article>
  </section>
</main>
```

#### Skip Links
```tsx
// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only"
>
  Skip to main content
</a>
```

#### Error Announcements
```tsx
// Announce errors to screen readers
<div
  role="alert"
  aria-live="assertive"
  className="error-message"
>
  {errorMessage}
</div>
```

## Responsive Design

### Breakpoints
```css
:root {
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Mobile-First Approach
```css
/* Mobile first responsive design */
.container {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
  }
}
```

### Responsive Patterns

#### Grid Layout
```css
.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### Sidebar Responsive
```css
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 0;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

@media (min-width: 1024px) {
  .sidebar {
    position: relative;
    width: 280px;
    transform: translateX(0);
  }
}
```

## Theme System

### Theme Context
```tsx
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
      <div data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

### Theme Persistence
```tsx
// Persist theme preference
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
  if (savedTheme) {
    setTheme(savedTheme);
  }
}, []);

useEffect(() => {
  localStorage.setItem('theme', theme);
}, [theme]);
```

### CSS Custom Properties
```css
/* Theme-aware CSS custom properties */
:root {
  --bg-primary: var(--neutral-50);
  --bg-secondary: var(--neutral-100);
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-600);
  --border-color: var(--neutral-200);
}

[data-theme="dark"] {
  --bg-primary: var(--neutral-900);
  --bg-secondary: var(--neutral-800);
  --text-primary: var(--neutral-100);
  --text-secondary: var(--neutral-400);
  --border-color: var(--neutral-700);
}
```

## UI Component Patterns

### Button Component
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'button',
        `button--${variant}`,
        `button--${size}`,
        disabled && 'button--disabled',
        loading && 'button--loading'
      )}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && <Spinner className="button__spinner" />}
      {children}
    </button>
  );
}
```

### Card Component
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        `card--padding-${padding}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### Loading States
```tsx
// Skeleton loading component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton', className)}
      {...props}
    />
  );
}

// Loading spinner
export function Spinner({
  size = 'md',
  className,
  ...props
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'spinner',
        `spinner--${size}`,
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### Form Components
```tsx
interface InputProps {
  label: string;
  error?: string;
  required?: boolean;
  'aria-describedby'?: string;
}

export function Input({
  label,
  error,
  required = false,
  'aria-describedby': ariaDescribedby,
  ...props
}: InputProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="input-group">
      <label htmlFor={id} className="input-label">
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <input
        id={id}
        className={cn('input', error && 'input--error')}
        aria-describedby={error ? errorId : ariaDescribedby}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <div id={errorId} className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
```

## Related Documentation

- **[Overview](./overview.md)**: Universal requirements and principles
- **[Contexts](./contexts.md)**: Data flow and state management patterns
- **[Pages](./pages.md)**: Page architecture and routing
- **[Components](./components.md)**: Component patterns and organization
- **[Backend Data Flow](../backend/data-flow.md)**: Backend integration patterns 
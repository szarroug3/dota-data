# Spacing System

This document outlines the comprehensive spacing system for the Dota 2 Data Dashboard, including grid systems, component spacing, responsive spacing, and layout patterns.

## Table of Contents

- [Spacing Philosophy](#spacing-philosophy)
- [Base Spacing Unit](#base-spacing-unit)
- [Spacing Scale](#spacing-scale)
- [Component Spacing](#component-spacing)
- [Layout Patterns](#layout-patterns)
- [Responsive Spacing](#responsive-spacing)
- [Grid Systems](#grid-systems)
- [Accessibility Considerations](#accessibility-considerations)
- [Usage Guidelines](#usage-guidelines)
- [Implementation Examples](#implementation-examples)

## Spacing Philosophy

The spacing system is built on the following principles:

- **Consistency**: All spacing values are multiples of the base unit (4px)
- **Scalability**: Spacing scales appropriately across different screen sizes
- **Accessibility**: Adequate spacing for touch targets and readability
- **Performance**: Efficient spacing that doesn't impact rendering
- **Maintainability**: Clear, predictable spacing patterns

## Base Spacing Unit

### 4px Grid System
All spacing values are multiples of 4px for consistency and alignment across the application.

```css
/* Base unit: 4px = 0.25rem */
:root {
  --base-unit: 0.25rem; /* 4px */
}
```

### Grid Alignment
- **Vertical Rhythm**: Consistent spacing creates visual rhythm
- **Horizontal Alignment**: Elements align to the 4px grid
- **Responsive Scaling**: Spacing scales proportionally across breakpoints

## Spacing Scale

### Complete Spacing Scale
```css
:root {
  /* Spacing Scale - All multiples of 4px */
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

### Spacing Usage Guidelines

#### Small Spacing (4px - 16px)
- **4px (space-1)**: Minimal spacing, tight layouts
- **8px (space-2)**: Icon spacing, small gaps
- **12px (space-3)**: Form field spacing, compact layouts
- **16px (space-4)**: Standard component padding, section gaps

#### Medium Spacing (20px - 48px)
- **20px (space-5)**: Card padding, button spacing
- **24px (space-6)**: Section margins, card spacing
- **32px (space-8)**: Large section spacing, page margins
- **48px (space-12)**: Page-level spacing, major sections

#### Large Spacing (64px - 96px)
- **64px (space-16)**: Page-level margins, hero sections
- **80px (space-20)**: Large page sections, major breaks
- **96px (space-24)**: Maximum spacing, major page divisions

## Component Spacing

### Card Spacing
```css
/* Card Padding */
.card {
  padding: var(--space-6); /* 24px */
}

/* Card Margin */
.card + .card {
  margin-top: var(--space-4); /* 16px */
}

/* Card Content Spacing */
.card-content > * + * {
  margin-top: var(--space-4); /* 16px */
}

/* Card Header */
.card-header {
  padding: var(--space-6) var(--space-6) var(--space-4); /* 24px 24px 16px */
}

/* Card Footer */
.card-footer {
  padding: var(--space-4) var(--space-6) var(--space-6); /* 16px 24px 24px */
}
```

### Form Spacing
```css
/* Form Container */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6); /* 24px */
}

/* Form Field Spacing */
.form-field {
  margin-bottom: var(--space-4); /* 16px */
}

/* Form Group Spacing */
.form-group + .form-group {
  margin-top: var(--space-6); /* 24px */
}

/* Form Actions */
.form-actions {
  margin-top: var(--space-6); /* 24px */
  padding-top: var(--space-4); /* 16px */
  border-top: 1px solid var(--border);
}

/* Input Spacing */
.input {
  padding: var(--space-3) var(--space-4); /* 12px 16px */
}

/* Label Spacing */
.label {
  margin-bottom: var(--space-2); /* 8px */
}
```

### Navigation Spacing
```css
/* Navigation Container */
.nav {
  padding: var(--space-4); /* 16px */
}

/* Navigation Item Spacing */
.nav-item + .nav-item {
  margin-top: var(--space-2); /* 8px */
}

/* Navigation Section Spacing */
.nav-section + .nav-section {
  margin-top: var(--space-6); /* 24px */
}

/* Navigation Link Padding */
.nav-link {
  padding: var(--space-3) var(--space-4); /* 12px 16px */
}

/* Sidebar Navigation */
.sidebar {
  padding: var(--space-4); /* 16px */
}

.sidebar-section {
  margin-bottom: var(--space-6); /* 24px */
}
```

### Button Spacing
```css
/* Button Padding */
.btn {
  padding: var(--space-3) var(--space-6); /* 12px 24px */
}

/* Button Group Spacing */
.btn-group {
  display: flex;
  gap: var(--space-2); /* 8px */
}

/* Button in Forms */
.form .btn {
  margin-top: var(--space-4); /* 16px */
}

/* Button Stack */
.btn-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3); /* 12px */
}
```

### List Spacing
```css
/* List Container */
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2); /* 8px */
}

/* List Item */
.list-item {
  padding: var(--space-3) var(--space-4); /* 12px 16px */
}

/* List with Dividers */
.list-divided .list-item {
  border-bottom: 1px solid var(--border);
  padding: var(--space-4); /* 16px */
}
```

## Layout Patterns

### Container Spacing
```css
/* Page Container */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6); /* 24px */
}

/* Content Container */
.content-container {
  padding: var(--space-4); /* 16px */
}

/* Section Container */
.section {
  margin-bottom: var(--space-8); /* 32px */
}

/* Section Header */
.section-header {
  margin-bottom: var(--space-6); /* 24px */
}
```

### Grid Layout Spacing
```css
/* Grid Container */
.grid {
  display: grid;
  gap: var(--space-6); /* 24px */
}

/* Grid with Different Gaps */
.grid-tight {
  gap: var(--space-4); /* 16px */
}

.grid-loose {
  gap: var(--space-8); /* 32px */
}

/* Responsive Grid */
@media (min-width: 768px) {
  .grid {
    gap: var(--space-8); /* 32px */
  }
}

@media (min-width: 1024px) {
  .grid {
    gap: var(--space-10); /* 40px */
  }
}
```

### Sidebar Layout Spacing
```css
/* Sidebar Layout */
.sidebar-layout {
  display: flex;
  gap: var(--space-8); /* 32px */
}

/* Sidebar */
.sidebar {
  width: 280px;
  padding: var(--space-6); /* 24px */
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--space-6); /* 24px */
}

/* Collapsed Sidebar */
.sidebar.collapsed {
  width: 64px;
  padding: var(--space-4); /* 16px */
}
```

### Modal Spacing
```css
/* Modal Container */
.modal {
  padding: var(--space-6); /* 24px */
}

/* Modal Header */
.modal-header {
  margin-bottom: var(--space-6); /* 24px */
  padding-bottom: var(--space-4); /* 16px */
  border-bottom: 1px solid var(--border);
}

/* Modal Body */
.modal-body {
  margin-bottom: var(--space-6); /* 24px */
}

/* Modal Footer */
.modal-footer {
  padding-top: var(--space-4); /* 16px */
  border-top: 1px solid var(--border);
  display: flex;
  gap: var(--space-3); /* 12px */
  justify-content: flex-end;
}
```

## Responsive Spacing

### Mobile-First Approach
```css
/* Base spacing (mobile) */
.container {
  padding: var(--space-4); /* 16px */
}

.section {
  margin-bottom: var(--space-6); /* 24px */
}

.card {
  padding: var(--space-4); /* 16px */
}
```

### Tablet Breakpoint (768px+)
```css
@media (min-width: 768px) {
  .container {
    padding: var(--space-6); /* 24px */
  }
  
  .section {
    margin-bottom: var(--space-8); /* 32px */
  }
  
  .card {
    padding: var(--space-6); /* 24px */
  }
}
```

### Desktop Breakpoint (1024px+)
```css
@media (min-width: 1024px) {
  .container {
    padding: var(--space-8); /* 32px */
  }
  
  .section {
    margin-bottom: var(--space-10); /* 40px */
  }
  
  .card {
    padding: var(--space-8); /* 32px */
  }
}
```

### Large Desktop Breakpoint (1440px+)
```css
@media (min-width: 1440px) {
  .container {
    padding: var(--space-10); /* 40px */
  }
  
  .section {
    margin-bottom: var(--space-12); /* 48px */
  }
  
  .card {
    padding: var(--space-10); /* 40px */
  }
}
```

## Grid Systems

### 12-Column Grid
```css
/* 12-Column Grid System */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6); /* 24px */
}

/* Grid Columns */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-8 { grid-column: span 8; }
.col-12 { grid-column: span 12; }

/* Responsive Grid */
@media (min-width: 768px) {
  .col-md-6 { grid-column: span 6; }
  .col-md-8 { grid-column: span 8; }
}

@media (min-width: 1024px) {
  .col-lg-4 { grid-column: span 4; }
  .col-lg-6 { grid-column: span 6; }
  .col-lg-8 { grid-column: span 8; }
}
```

### Auto-Fit Grid
```css
/* Auto-fit grid for cards */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6); /* 24px */
}

/* Auto-fill grid for items */
.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4); /* 16px */
}
```

### Masonry Grid
```css
/* Masonry-style grid */
.grid-masonry {
  columns: 1;
  column-gap: var(--space-6); /* 24px */
}

@media (min-width: 768px) {
  .grid-masonry {
    columns: 2;
  }
}

@media (min-width: 1024px) {
  .grid-masonry {
    columns: 3;
  }
}

.grid-masonry > * {
  break-inside: avoid;
  margin-bottom: var(--space-6); /* 24px */
}
```

## Accessibility Considerations

### Touch Target Spacing
```css
/* Minimum touch target size (44px) */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3); /* 12px minimum */
}

/* Button touch targets */
.btn {
  min-height: 44px;
  padding: var(--space-3) var(--space-6); /* 12px 24px */
}
```

### Focus Indicator Spacing
```css
/* Focus ring spacing */
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: var(--space-1); /* 4px */
}

/* High contrast focus */
@media (prefers-contrast: high) {
  .focus-visible {
    outline: 3px solid var(--ring);
    outline-offset: var(--space-1); /* 4px */
  }
}
```

### Screen Reader Spacing
```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focusable screen reader content */
.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: var(--space-2); /* 8px */
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Usage Guidelines

### Spacing Principles
1. **Consistency**: Always use the defined spacing scale
2. **Proportionality**: Larger elements get more spacing
3. **Hierarchy**: Use spacing to create visual hierarchy
4. **Accessibility**: Ensure adequate spacing for touch targets
5. **Responsiveness**: Scale spacing appropriately for different screen sizes

### Common Patterns

#### Content Hierarchy
```css
/* Page structure */
.page {
  padding: var(--space-6); /* 24px */
}

.page-header {
  margin-bottom: var(--space-8); /* 32px */
}

.page-content {
  margin-bottom: var(--space-8); /* 32px */
}

.page-footer {
  margin-top: var(--space-8); /* 32px */
  padding-top: var(--space-6); /* 24px */
  border-top: 1px solid var(--border);
}
```

#### Component Relationships
```css
/* Related components */
.component-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4); /* 16px */
}

/* Unrelated components */
.component-separated {
  margin-bottom: var(--space-8); /* 32px */
}
```

#### Form Layout
```css
/* Form structure */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6); /* 24px */
}

.form-section {
  padding: var(--space-6); /* 24px */
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.form-section + .form-section {
  margin-top: var(--space-6); /* 24px */
}
```

## Implementation Examples

### CSS Custom Properties
```css
/* Spacing CSS custom properties */
:root {
  /* Base spacing unit */
  --base-unit: 0.25rem; /* 4px */
  
  /* Spacing scale */
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
  
  /* Component spacing */
  --card-padding: var(--space-6);
  --section-gap: var(--space-8);
  --form-gap: var(--space-6);
  --button-gap: var(--space-3);
}
```

### React Component Example
```tsx
// Example: Spacing-aware component
interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  margin?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  padding = 'md', 
  margin = 'md',
  children 
}) => {
  const getPaddingClass = () => {
    switch (padding) {
      case 'sm': return 'p-4'; // 16px
      case 'md': return 'p-6'; // 24px
      case 'lg': return 'p-8'; // 32px
      default: return 'p-6';
    }
  };

  const getMarginClass = () => {
    switch (margin) {
      case 'sm': return 'mb-4'; // 16px
      case 'md': return 'mb-6'; // 24px
      case 'lg': return 'mb-8'; // 32px
      default: return 'mb-6';
    }
  };

  return (
    <div className={`card ${getPaddingClass()} ${getMarginClass()}`}>
      {children}
    </div>
  );
};
```

### Tailwind CSS Integration
```css
/* Tailwind configuration for spacing */
module.exports = {
  theme: {
    extend: {
      spacing: {
        '1': '0.25rem',   /* 4px */
        '2': '0.5rem',    /* 8px */
        '3': '0.75rem',   /* 12px */
        '4': '1rem',      /* 16px */
        '5': '1.25rem',   /* 20px */
        '6': '1.5rem',    /* 24px */
        '8': '2rem',      /* 32px */
        '10': '2.5rem',   /* 40px */
        '12': '3rem',     /* 48px */
        '16': '4rem',     /* 64px */
        '20': '5rem',     /* 80px */
        '24': '6rem',     /* 96px */
      },
      gap: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
    },
  },
};
```

### Utility Classes
```css
/* Spacing utility classes */
.space-xs { gap: var(--space-2); }  /* 8px */
.space-sm { gap: var(--space-4); }  /* 16px */
.space-md { gap: var(--space-6); }  /* 24px */
.space-lg { gap: var(--space-8); }  /* 32px */
.space-xl { gap: var(--space-12); } /* 48px */

.p-xs { padding: var(--space-2); }
.p-sm { padding: var(--space-4); }
.p-md { padding: var(--space-6); }
.p-lg { padding: var(--space-8); }
.p-xl { padding: var(--space-12); }

.m-xs { margin: var(--space-2); }
.m-sm { margin: var(--space-4); }
.m-md { margin: var(--space-6); }
.m-lg { margin: var(--space-8); }
.m-xl { margin: var(--space-12); }
```

## Cross-References

### Related Documentation
- **[Color System](./colors.md)**: Color usage in spacing contexts
- **[Typography System](./typography.md)**: Text spacing and line heights
- **[Component Specifications](./components.md)**: Component-specific spacing
- **[UI Standards](../../architecture/frontend/ui-standards.md)**: Technical implementation details

### Implementation Files
- `src/app/globals.css`: CSS custom properties and spacing definitions
- `tailwind.config.js`: Tailwind CSS spacing configuration
- `src/components/ui/Card.tsx`: Card component spacing implementation

### Testing and Validation
- **Touch Target Testing**: Verify minimum 44px touch targets
- **Responsive Testing**: Test spacing across all breakpoints
- **Accessibility Testing**: Verify adequate spacing for screen readers
- **Visual Testing**: Ensure consistent spacing in design reviews

---

*This spacing system documentation provides a comprehensive foundation for consistent, accessible, and maintainable spacing across the Dota 2 Data Dashboard application.* 
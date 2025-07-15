# Typography System

This document outlines the comprehensive typography system for the Dota 2 Data Dashboard, including font hierarchy, type scales, responsive typography, accessibility guidelines, and usage best practices.

## Table of Contents

- [Typography Philosophy](#typography-philosophy)
- [Font Hierarchy](#font-hierarchy)
- [Type Scale](#type-scale)
- [Font Weights](#font-weights)
- [Line Heights](#line-heights)
- [Responsive Typography](#responsive-typography)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Usage Guidelines](#usage-guidelines)
- [Implementation Examples](#implementation-examples)

## Typography Philosophy

The typography system is built on the following principles:

- **Readability First**: All text is optimized for maximum readability
- **Accessibility Focus**: Typography meets WCAG 2.1 AA standards
- **Responsive Design**: Text scales appropriately across all devices
- **Performance**: Optimized font loading and rendering
- **Consistency**: Unified typography across all components

## Font Hierarchy

### Primary Font Stack
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
}
```

### Font Selection Rationale

#### Primary Font: Inter
- **Purpose**: Primary UI font for all user-facing text
- **Characteristics**: Highly legible, modern, optimized for screens
- **Usage**: Headings, body text, UI elements, navigation
- **Benefits**: Excellent readability, consistent rendering across platforms

#### Monospace Font: JetBrains Mono
- **Purpose**: Code, technical data, tabular information
- **Characteristics**: Fixed-width, developer-friendly
- **Usage**: Code snippets, data tables, technical specifications
- **Benefits**: Clear character distinction, consistent spacing

### Font Loading Strategy
```css
/* Font loading optimization */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Font display swap for performance */
font-display: swap;
```

## Type Scale

### Heading Scale

#### H1 - Page Titles
```css
/* H1 - Page Titles */
h1 {
  font-size: 2.25rem;    /* 36px */
  line-height: 2.5rem;    /* 40px */
  font-weight: 700;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H1 */
@media (min-width: 768px) {
  h1 {
    font-size: 2.5rem;    /* 40px */
    line-height: 2.75rem;  /* 44px */
  }
}

@media (min-width: 1024px) {
  h1 {
    font-size: 3rem;      /* 48px */
    line-height: 3.25rem;  /* 52px */
  }
}
```

#### H2 - Section Headers
```css
/* H2 - Section Headers */
h2 {
  font-size: 1.875rem;    /* 30px */
  line-height: 2.25rem;    /* 36px */
  font-weight: 600;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H2 */
@media (min-width: 768px) {
  h2 {
    font-size: 2rem;       /* 32px */
    line-height: 2.5rem;    /* 40px */
  }
}

@media (min-width: 1024px) {
  h2 {
    font-size: 2.25rem;    /* 36px */
    line-height: 2.75rem;   /* 44px */
  }
}
```

#### H3 - Subsection Headers
```css
/* H3 - Subsection Headers */
h3 {
  font-size: 1.5rem;       /* 24px */
  line-height: 2rem;        /* 32px */
  font-weight: 600;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H3 */
@media (min-width: 768px) {
  h3 {
    font-size: 1.75rem;    /* 28px */
    line-height: 2.25rem;   /* 36px */
  }
}

@media (min-width: 1024px) {
  h3 {
    font-size: 2rem;        /* 32px */
    line-height: 2.5rem;    /* 40px */
  }
}
```

#### H4 - Card Headers
```css
/* H4 - Card Headers */
h4 {
  font-size: 1.25rem;      /* 20px */
  line-height: 1.75rem;     /* 28px */
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H4 */
@media (min-width: 768px) {
  h4 {
    font-size: 1.5rem;     /* 24px */
    line-height: 2rem;      /* 32px */
  }
}

@media (min-width: 1024px) {
  h4 {
    font-size: 1.75rem;    /* 28px */
    line-height: 2.25rem;   /* 36px */
  }
}
```

#### H5 - Small Headers
```css
/* H5 - Small Headers */
h5 {
  font-size: 1.125rem;     /* 18px */
  line-height: 1.75rem;     /* 28px */
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H5 */
@media (min-width: 768px) {
  h5 {
    font-size: 1.25rem;    /* 20px */
    line-height: 1.875rem;  /* 30px */
  }
}

@media (min-width: 1024px) {
  h5 {
    font-size: 1.5rem;     /* 24px */
    line-height: 2rem;      /* 32px */
  }
}
```

#### H6 - Micro Headers
```css
/* H6 - Micro Headers */
h6 {
  font-size: 1rem;         /* 16px */
  line-height: 1.5rem;      /* 24px */
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: -0.025em;
}

/* Responsive H6 */
@media (min-width: 768px) {
  h6 {
    font-size: 1.125rem;   /* 18px */
    line-height: 1.75rem;   /* 28px */
  }
}

@media (min-width: 1024px) {
  h6 {
    font-size: 1.25rem;    /* 20px */
    line-height: 1.875rem;  /* 30px */
  }
}
```

### Body Text Scale

#### Large Body Text
```css
/* Large Body Text */
.body-large {
  font-size: 1.125rem;     /* 18px */
  line-height: 1.75rem;     /* 28px */
  font-weight: 400;
  font-family: var(--font-sans);
  letter-spacing: 0;
}

/* Responsive Large Body */
@media (min-width: 768px) {
  .body-large {
    font-size: 1.25rem;    /* 20px */
    line-height: 1.875rem;  /* 30px */
  }
}

@media (min-width: 1024px) {
  .body-large {
    font-size: 1.375rem;   /* 22px */
    line-height: 2rem;      /* 32px */
  }
}
```

#### Regular Body Text
```css
/* Regular Body Text */
.body {
  font-size: 1rem;         /* 16px */
  line-height: 1.5rem;      /* 24px */
  font-weight: 400;
  font-family: var(--font-sans);
  letter-spacing: 0;
}

/* Responsive Body */
@media (min-width: 768px) {
  .body {
    font-size: 1.125rem;   /* 18px */
    line-height: 1.75rem;   /* 28px */
  }
}

@media (min-width: 1024px) {
  .body {
    font-size: 1.25rem;    /* 20px */
    line-height: 1.875rem;  /* 30px */
  }
}
```

#### Small Body Text
```css
/* Small Body Text */
.body-small {
  font-size: 0.875rem;     /* 14px */
  line-height: 1.25rem;     /* 20px */
  font-weight: 400;
  font-family: var(--font-sans);
  letter-spacing: 0;
}

/* Responsive Small Body */
@media (min-width: 768px) {
  .body-small {
    font-size: 1rem;       /* 16px */
    line-height: 1.5rem;    /* 24px */
  }
}

@media (min-width: 1024px) {
  .body-small {
    font-size: 1.125rem;   /* 18px */
    line-height: 1.75rem;   /* 28px */
  }
}
```

#### Caption Text
```css
/* Caption Text */
.caption {
  font-size: 0.75rem;      /* 12px */
  line-height: 1rem;        /* 16px */
  font-weight: 400;
  font-family: var(--font-sans);
  letter-spacing: 0;
}

/* Responsive Caption */
@media (min-width: 768px) {
  .caption {
    font-size: 0.875rem;   /* 14px */
    line-height: 1.25rem;   /* 20px */
  }
}

@media (min-width: 1024px) {
  .caption {
    font-size: 1rem;       /* 16px */
    line-height: 1.5rem;    /* 24px */
  }
}
```

## Font Weights

### Weight Scale
```css
:root {
  /* Font Weights */
  --font-light: 300;       /* Light - Subtle text, captions */
  --font-normal: 400;      /* Regular - Body text, default weight */
  --font-medium: 500;      /* Medium - Emphasis, subheadings */
  --font-semibold: 600;    /* Semibold - Strong emphasis, buttons */
  --font-bold: 700;        /* Bold - Headings, important text */
}
```

### Weight Usage Guidelines

#### Light (300)
- **Usage**: Subtle text, captions, secondary information
- **Examples**: Image captions, metadata, timestamps
- **Contrast**: Use sparingly, ensure sufficient contrast

#### Regular (400)
- **Usage**: Body text, default weight for most content
- **Examples**: Paragraphs, descriptions, form labels
- **Contrast**: Primary text weight, high readability

#### Medium (500)
- **Usage**: Emphasis, subheadings, important UI elements
- **Examples**: Section headers, form field labels, navigation items
- **Contrast**: Clear emphasis without being overwhelming

#### Semibold (600)
- **Usage**: Strong emphasis, buttons, important actions
- **Examples**: Button text, primary navigation, call-to-actions
- **Contrast**: High visibility for important elements

#### Bold (700)
- **Usage**: Headings, critical information, primary emphasis
- **Examples**: Page titles, section headers, critical alerts
- **Contrast**: Maximum emphasis for most important content

## Line Heights

### Line Height Scale
```css
:root {
  /* Line Heights */
  --leading-tight: 1.25;   /* Tight - Headings, short text */
  --leading-normal: 1.5;    /* Normal - Body text, general content */
  --leading-relaxed: 1.75;  /* Relaxed - Long-form content, descriptions */
}
```

### Line Height Guidelines

#### Tight (1.25)
- **Usage**: Headings, short text, compact layouts
- **Examples**: Page titles, section headers, button text
- **Benefits**: Compact, efficient use of space

#### Normal (1.5)
- **Usage**: Body text, general content, standard reading
- **Examples**: Paragraphs, descriptions, form content
- **Benefits**: Optimal readability for most content

#### Relaxed (1.75)
- **Usage**: Long-form content, descriptions, detailed text
- **Examples**: Blog posts, detailed descriptions, help text
- **Benefits**: Enhanced readability for extended reading

## Responsive Typography

### Mobile-First Approach
```css
/* Base styles (mobile) */
h1 { font-size: 1.875rem; } /* 30px */
h2 { font-size: 1.5rem; }   /* 24px */
h3 { font-size: 1.25rem; }  /* 20px */
h4 { font-size: 1.125rem; } /* 18px */
h5 { font-size: 1rem; }     /* 16px */
h6 { font-size: 0.875rem; } /* 14px */

.body-large { font-size: 1.125rem; } /* 18px */
.body { font-size: 1rem; }           /* 16px */
.body-small { font-size: 0.875rem; } /* 14px */
.caption { font-size: 0.75rem; }     /* 12px */
```

### Tablet Breakpoint (768px+)
```css
@media (min-width: 768px) {
  h1 { font-size: 2.25rem; } /* 36px */
  h2 { font-size: 1.875rem; } /* 30px */
  h3 { font-size: 1.5rem; }   /* 24px */
  h4 { font-size: 1.25rem; }  /* 20px */
  h5 { font-size: 1.125rem; } /* 18px */
  h6 { font-size: 1rem; }     /* 16px */

  .body-large { font-size: 1.25rem; } /* 20px */
  .body { font-size: 1.125rem; }      /* 18px */
  .body-small { font-size: 1rem; }    /* 16px */
  .caption { font-size: 0.875rem; }   /* 14px */
}
```

### Desktop Breakpoint (1024px+)
```css
@media (min-width: 1024px) {
  h1 { font-size: 2.5rem; }   /* 40px */
  h2 { font-size: 2rem; }     /* 32px */
  h3 { font-size: 1.75rem; }  /* 28px */
  h4 { font-size: 1.5rem; }   /* 24px */
  h5 { font-size: 1.25rem; }  /* 20px */
  h6 { font-size: 1.125rem; } /* 18px */

  .body-large { font-size: 1.375rem; } /* 22px */
  .body { font-size: 1.25rem; }        /* 20px */
  .body-small { font-size: 1.125rem; } /* 18px */
  .caption { font-size: 1rem; }        /* 16px */
}
```

### Large Desktop Breakpoint (1440px+)
```css
@media (min-width: 1440px) {
  h1 { font-size: 3rem; }     /* 48px */
  h2 { font-size: 2.25rem; }  /* 36px */
  h3 { font-size: 2rem; }     /* 32px */
  h4 { font-size: 1.75rem; }  /* 28px */
  h5 { font-size: 1.5rem; }   /* 24px */
  h6 { font-size: 1.25rem; }  /* 20px */

  .body-large { font-size: 1.5rem; }   /* 24px */
  .body { font-size: 1.375rem; }       /* 22px */
  .body-small { font-size: 1.25rem; }  /* 20px */
  .caption { font-size: 1.125rem; }    /* 18px */
}
```

## Accessibility Guidelines

### WCAG 2.1 AA Typography Requirements

#### Minimum Font Sizes
- **Body Text**: Minimum 16px on mobile, 18px on desktop
- **Captions**: Minimum 12px on mobile, 14px on desktop
- **Headings**: Scale appropriately with device size

#### Line Length Guidelines
- **Optimal Line Length**: 45-75 characters per line
- **Maximum Line Length**: 80 characters for readability
- **Minimum Line Length**: 30 characters for efficiency

#### Contrast Requirements
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio (18px+ or 14px+ bold)
- **Headings**: Same as normal text requirements

### Screen Reader Support

#### Semantic HTML Structure
```tsx
// Example: Proper heading hierarchy
const PageLayout = () => {
  return (
    <main>
      <h1>Dashboard</h1>
      <section>
        <h2>Team Overview</h2>
        <article>
          <h3>Recent Matches</h3>
          <p>Content here...</p>
        </article>
      </section>
    </main>
  );
};
```

#### ARIA Labels and Descriptions
```tsx
// Example: Accessible typography with ARIA
const AccessibleHeading = ({ level, children, description }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag 
      aria-describedby={description ? `desc-${level}` : undefined}
    >
      {children}
      {description && (
        <span id={`desc-${level}`} className="sr-only">
          {description}
        </span>
      )}
    </Tag>
  );
};
```

### Focus Management
```css
/* Focus indicators for typography */
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: 2px;
}

/* High contrast focus for accessibility */
@media (prefers-contrast: high) {
  .focus-visible {
    outline: 3px solid var(--ring);
    outline-offset: 1px;
  }
}
```

## Usage Guidelines

### Heading Hierarchy

#### Page Structure
```tsx
// Example: Proper page heading structure
const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <h2>Team Performance</h2>
        <div>
          <h3>Recent Matches</h3>
          <h4>Match Details</h4>
          <h5>Player Stats</h5>
          <h6>Individual Performance</h6>
        </div>
      </section>
    </div>
  );
};
```

#### Content Organization
- **H1**: One per page, main page title
- **H2**: Major sections, primary content areas
- **H3**: Subsections within major sections
- **H4**: Card headers, form sections
- **H5**: Small headers, minor sections
- **H6**: Micro headers, fine-grained organization

### Body Text Usage

#### Content Hierarchy
```tsx
// Example: Content hierarchy with typography
const ContentSection = () => {
  return (
    <section>
      <h2>Team Analysis</h2>
      <p className="body-large">
        This section provides comprehensive analysis of team performance.
      </p>
      <p className="body">
        Detailed statistics and metrics are displayed below.
      </p>
      <p className="body-small">
        Data is updated in real-time from official sources.
      </p>
      <span className="caption">
        Last updated: 2 minutes ago
      </span>
    </section>
  );
};
```

#### Text Emphasis
```tsx
// Example: Text emphasis patterns
const EmphasisExample = () => {
  return (
    <div>
      <p className="body">
        Regular body text with <strong>important emphasis</strong> and 
        <em>subtle emphasis</em> for variety.
      </p>
      <p className="body-small">
        Supporting text with <code>technical terms</code> and 
        <span className="font-medium">medium weight</span> for clarity.
      </p>
    </div>
  );
};
```

### Component Typography

#### Button Typography
```tsx
// Example: Button typography patterns
const Button = ({ variant = 'primary', size = 'md', children }) => {
  const sizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold'
  };
  
  return (
    <button className={`${sizeClasses[size]} px-4 py-2 rounded-md`}>
      {children}
    </button>
  );
};
```

#### Form Typography
```tsx
// Example: Form typography patterns
const FormField = ({ label, error, children }) => {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
```

## Implementation Examples

### CSS Custom Properties
```css
/* Typography CSS custom properties */
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  
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

### React Component Example
```tsx
// Example: Typography component system
interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-large' | 'body-small' | 'caption';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
}

const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body', 
  weight = 'normal',
  children,
  className = ''
}) => {
  const getTypographyClasses = () => {
    const baseClasses = 'font-sans';
    const variantClasses = {
      h1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
      h2: 'text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight',
      h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight',
      h4: 'text-xl md:text-2xl lg:text-3xl font-medium leading-tight',
      h5: 'text-lg md:text-xl lg:text-2xl font-medium leading-tight',
      h6: 'text-base md:text-lg lg:text-xl font-medium leading-tight',
      'body-large': 'text-lg md:text-xl lg:text-2xl leading-relaxed',
      body: 'text-base md:text-lg lg:text-xl leading-normal',
      'body-small': 'text-sm md:text-base lg:text-lg leading-normal',
      caption: 'text-xs md:text-sm lg:text-base leading-normal'
    };
    const weightClasses = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${weightClasses[weight]} ${className}`;
  };

  const Tag = variant.startsWith('h') ? variant : 'p';
  
  return (
    <Tag className={getTypographyClasses()}>
      {children}
    </Tag>
  );
};
```

### Tailwind CSS Integration
```css
/* Tailwind configuration for typography */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3.25rem' }],
        '6xl': ['3.75rem', { lineHeight: '4rem' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    },
  },
};
```

## Cross-References

### Related Documentation
- **[Color System](./colors.md)**: Text color usage and contrast
- **[Component Specifications](./components.md)**: Component-specific typography
- **[Accessibility Guidelines](../accessibility/typography.md)**: Detailed accessibility requirements
- **[UI Standards](../../architecture/frontend/ui-standards.md)**: Technical implementation details

### Implementation Files
- `src/app/globals.css`: CSS custom properties and font definitions
- `tailwind.config.js`: Tailwind CSS typography configuration
- `src/components/ui/Typography.tsx`: Typography component implementation

### Testing and Validation
- **Font Loading**: Verify fonts load correctly across browsers
- **Responsive Testing**: Test typography scaling on all devices
- **Accessibility Testing**: Verify contrast ratios and screen reader support
- **Performance Testing**: Monitor font loading performance

---

*This typography system documentation provides a comprehensive foundation for consistent, accessible, and maintainable typography across the Dota 2 Data Dashboard application.* 
# UI Design System

This document outlines the complete UI design system for the Dota 2 data dashboard application, including visual design principles, component specifications, and interaction patterns. This design system works in conjunction with the [Frontend Architecture](./architecture/frontend-architecture.md) to ensure consistent, accessible, and maintainable user interfaces.

## Table of Contents

### [Design Principles](#design-principles)
- [Accessibility First](#accessibility-first)
- [Mobile-First Responsive Design](#mobile-first-responsive-design)
- [Performance-Oriented](#performance-oriented)
- [Data-Driven Design](#data-driven-design)

### [Color System](#color-system)
- [Color Palette](#color-palette)
- [Theme Support](#theme-support)
- [Accessibility Standards](#accessibility-standards)
- [Usage Guidelines](#usage-guidelines)

### [Typography](#typography)
- [Font Hierarchy](#font-hierarchy)
- [Type Scale](#type-scale)
- [Responsive Typography](#responsive-typography)
- [Accessibility Guidelines](#accessibility-guidelines)

### [Spacing System](#spacing-system)
- [Grid System](#grid-system)
- [Component Spacing](#component-spacing)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Layout Patterns](#layout-patterns)

### [Component Library](#component-library)
- [Buttons](#buttons)
- [Forms](#forms)
- [Cards](#cards)
- [Navigation](#navigation)
- [Data Display](#data-display)
- [Feedback](#feedback)

### [Interaction Design](#interaction-design)
- [Micro-interactions](#micro-interactions)
- [Loading States](#loading-states)
- [Error Handling](#error-handling)
- [Success Feedback](#success-feedback)

### [Layout Patterns](#layout-patterns)
- [Page Layouts](#page-layouts)
- [Sidebar Navigation](#sidebar-navigation)
- [Content Areas](#content-areas)
- [Modal Patterns](#modal-patterns)

---

## Design Principles

### Accessibility First
- **WCAG 2.1 AA Compliance:** All components meet accessibility standards
- **Keyboard Navigation:** Full keyboard accessibility for all interactive elements
- **Screen Reader Support:** Proper ARIA labels and semantic HTML
- **Color Contrast:** Minimum 4.5:1 contrast ratio for body text
- **Focus Management:** Clear focus indicators and logical tab order

### Mobile-First Responsive Design
- **Progressive Enhancement:** Start with mobile, enhance for larger screens
- **Touch-Friendly:** Minimum 44px touch targets for mobile interactions
- **Responsive Breakpoints:** 320px, 768px, 1024px, 1440px
- **Flexible Layouts:** Grid systems that adapt to screen size
- **Performance:** Optimized for mobile network conditions

### Performance-Oriented
- **Fast Loading:** <3 second page load times
- **Efficient Rendering:** Optimized component rendering
- **Lazy Loading:** Progressive content loading
- **Caching Strategy:** Intelligent data caching
- **Bundle Optimization:** Minimal JavaScript bundles

### Data-Driven Design
- **Clear Information Hierarchy:** Logical data presentation
- **Progressive Disclosure:** Show essential info first, details on demand
- **Visual Data Patterns:** Consistent charts and graphs
- **Empty States:** Helpful guidance when no data is available
- **Error States:** Clear error messages with recovery options

---

## Color System

### Color Palette

#### Primary Colors
```css
/* Light Theme */
--primary: oklch(0.208 0.042 265.755);        /* #3B82F6 - Blue */
--primary-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */

/* Dark Theme */
--primary: oklch(0.217 0.091 265.755);        /* #60A5FA - Lighter Blue */
--primary-foreground: oklch(0.129 0.042 264.695); /* #1F2937 - Dark Gray */
```

#### Secondary Colors
```css
/* Light Theme */
--secondary: oklch(0.968 0.007 247.896);      /* #F3F4F6 - Light Gray */
--secondary-foreground: oklch(0.208 0.042 265.755); /* #3B82F6 - Blue */

/* Dark Theme */
--secondary: oklch(0.217 0.032 247.896);      /* #374151 - Dark Gray */
--secondary-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */
```

#### Semantic Colors
```css
/* Success */
--success: oklch(0.646 0.222 41.116);         /* #10B981 - Green */
--success-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */

/* Warning */
--warning: oklch(0.828 0.189 84.429);         /* #F59E0B - Amber */
--warning-foreground: oklch(0.129 0.042 264.695); /* #1F2937 - Dark Gray */

/* Error */
--destructive: oklch(0.577 0.245 27.325);     /* #EF4444 - Red */
--destructive-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */

/* Info */
--info: oklch(0.6 0.118 184.704);             /* #06B6D4 - Cyan */
--info-foreground: oklch(0.984 0.003 247.858); /* #FFFFFF - White */
```

#### Neutral Colors
```css
/* Light Theme */
--background: oklch(1 0 0);                    /* #FFFFFF - White */
--foreground: oklch(0.129 0.042 264.695);     /* #1F2937 - Dark Gray */
--muted: oklch(0.968 0.007 247.896);         /* #F3F4F6 - Light Gray */
--muted-foreground: oklch(0.554 0.046 257.417); /* #6B7280 - Gray */
--border: oklch(0.929 0.013 255.508);         /* #E5E7EB - Border Gray */

/* Dark Theme */
--background: oklch(0.129 0.042 264.695);     /* #1F2937 - Dark Gray */
--foreground: oklch(0.984 0.003 247.858);     /* #FFFFFF - White */
--muted: oklch(0.217 0.032 247.896);         /* #374151 - Dark Gray */
--muted-foreground: oklch(0.554 0.046 257.417); /* #9CA3AF - Light Gray */
--border: oklch(0.217 0.032 247.896);         /* #374151 - Border Gray */
```

### Theme Support

#### Light Theme (Default)
- **Background:** Clean white for optimal readability
- **Text:** High contrast dark gray for accessibility
- **Cards:** Subtle gray borders and shadows
- **Interactive Elements:** Blue primary color with white text

#### Dark Theme
- **Background:** Dark gray for reduced eye strain
- **Text:** High contrast white for readability
- **Cards:** Darker backgrounds with subtle borders
- **Interactive Elements:** Lighter blue for better contrast

### Accessibility Standards

#### Color Contrast Requirements
- **Normal Text:** Minimum 4.5:1 contrast ratio
- **Large Text:** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio
- **Focus Indicators:** High contrast focus rings

#### Color Blindness Considerations
- **Red-Green Color Blindness:** Avoid relying solely on color for information
- **Blue-Yellow Color Blindness:** Ensure sufficient contrast for blue elements
- **Monochrome Vision:** All information must be distinguishable without color

### Usage Guidelines

#### Primary Color Usage
- **Primary Actions:** Main call-to-action buttons
- **Active States:** Selected navigation items
- **Links:** Primary navigation links
- **Branding:** Logo and brand elements

#### Secondary Color Usage
- **Secondary Actions:** Less important buttons
- **Backgrounds:** Subtle background elements
- **Borders:** Card and container borders
- **Dividers:** Content separators

#### Semantic Color Usage
- **Success:** Completed actions, positive feedback
- **Warning:** Caution messages, pending states
- **Error:** Error messages, destructive actions
- **Info:** Informational messages, help text

---

## Typography

### Font Hierarchy

#### Primary Font: Inter
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Font Weights
- **Light (300):** Subtle text, captions
- **Regular (400):** Body text, default weight
- **Medium (500):** Emphasis, subheadings
- **Semibold (600):** Strong emphasis, buttons
- **Bold (700):** Headings, important text

### Type Scale

#### Heading Scale
```css
/* H1 - Page Titles */
font-size: 2.25rem; /* 36px */
line-height: 2.5rem; /* 40px */
font-weight: 700;

/* H2 - Section Headers */
font-size: 1.875rem; /* 30px */
line-height: 2.25rem; /* 36px */
font-weight: 600;

/* H3 - Subsection Headers */
font-size: 1.5rem; /* 24px */
line-height: 2rem; /* 32px */
font-weight: 600;

/* H4 - Card Headers */
font-size: 1.25rem; /* 20px */
line-height: 1.75rem; /* 28px */
font-weight: 500;

/* H5 - Small Headers */
font-size: 1.125rem; /* 18px */
line-height: 1.75rem; /* 28px */
font-weight: 500;

/* H6 - Micro Headers */
font-size: 1rem; /* 16px */
line-height: 1.5rem; /* 24px */
font-weight: 500;
```

#### Body Text Scale
```css
/* Large Body Text */
font-size: 1.125rem; /* 18px */
line-height: 1.75rem; /* 28px */
font-weight: 400;

/* Regular Body Text */
font-size: 1rem; /* 16px */
line-height: 1.5rem; /* 24px */
font-weight: 400;

/* Small Body Text */
font-size: 0.875rem; /* 14px */
line-height: 1.25rem; /* 20px */
font-weight: 400;

/* Caption Text */
font-size: 0.75rem; /* 12px */
line-height: 1rem; /* 16px */
font-weight: 400;
```

### Responsive Typography

#### Mobile-First Approach
```css
/* Base styles (mobile) */
h1 { font-size: 1.875rem; } /* 30px */
h2 { font-size: 1.5rem; }   /* 24px */
h3 { font-size: 1.25rem; }  /* 20px */

/* Tablet (768px+) */
@media (min-width: 768px) {
  h1 { font-size: 2.25rem; } /* 36px */
  h2 { font-size: 1.875rem; } /* 30px */
  h3 { font-size: 1.5rem; }   /* 24px */
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  h1 { font-size: 2.5rem; }   /* 40px */
  h2 { font-size: 2rem; }     /* 32px */
  h3 { font-size: 1.75rem; }  /* 28px */
}
```

### Accessibility Guidelines

#### Readability Standards
- **Line Length:** Maximum 65-75 characters per line
- **Line Height:** Minimum 1.4 for body text, 1.2 for headings
- **Letter Spacing:** -0.025em for headings, 0 for body text
- **Font Size:** Minimum 16px for body text on mobile

#### Screen Reader Support
- **Semantic HTML:** Use proper heading hierarchy (H1-H6)
- **Alt Text:** Descriptive alt text for images
- **ARIA Labels:** Clear labels for interactive elements
- **Focus Indicators:** Visible focus states for keyboard navigation

---

## Spacing System

### Grid System

#### Base Unit: 4px
All spacing values are multiples of 4px for consistency and alignment.

#### Spacing Scale
```css
/* 4px - 0.25rem */
--space-1: 0.25rem;

/* 8px - 0.5rem */
--space-2: 0.5rem;

/* 12px - 0.75rem */
--space-3: 0.75rem;

/* 16px - 1rem */
--space-4: 1rem;

/* 20px - 1.25rem */
--space-5: 1.25rem;

/* 24px - 1.5rem */
--space-6: 1.5rem;

/* 32px - 2rem */
--space-8: 2rem;

/* 40px - 2.5rem */
--space-10: 2.5rem;

/* 48px - 3rem */
--space-12: 3rem;

/* 64px - 4rem */
--space-16: 4rem;

/* 80px - 5rem */
--space-20: 5rem;
```

### Component Spacing

#### Card Spacing
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
```

#### Form Spacing
```css
/* Form Field Spacing */
.form-field {
  margin-bottom: var(--space-4); /* 16px */
}

/* Form Group Spacing */
.form-group + .form-group {
  margin-top: var(--space-6); /* 24px */
}

/* Button Spacing */
.form-actions {
  margin-top: var(--space-6); /* 24px */
}
```

#### Navigation Spacing
```css
/* Navigation Item Spacing */
.nav-item + .nav-item {
  margin-top: var(--space-2); /* 8px */
}

/* Navigation Section Spacing */
.nav-section + .nav-section {
  margin-top: var(--space-6); /* 24px */
}
```

### Responsive Breakpoints

#### Breakpoint System
```css
/* Mobile First */
/* Base styles for 320px+ */

/* Small Tablet */
@media (min-width: 640px) {
  /* Tablet styles */
}

/* Tablet */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Large desktop styles */
}

/* Extra Large */
@media (min-width: 1536px) {
  /* Extra large styles */
}
```

#### Container Widths
```css
/* Mobile */
.container {
  max-width: 100%;
  padding: 0 var(--space-4); /* 16px */
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 var(--space-6); /* 24px */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 0 var(--space-8); /* 32px */
  }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
    padding: 0 var(--space-10); /* 40px */
  }
}
```

### Layout Patterns

#### Sidebar Layout
```css
/* Sidebar Width */
.sidebar {
  width: 280px;
  min-width: 280px;
}

/* Collapsed Sidebar */
.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

/* Main Content */
.main-content {
  flex: 1;
  min-width: 0; /* Prevents flex item from overflowing */
}
```

#### Card Grid Layout
```css
/* Card Grid */
.card-grid {
  display: grid;
  gap: var(--space-6); /* 24px */
}

/* Mobile: 1 column */
.card-grid {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop: 4 columns */
@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  padding: var(--space-3) var(--space-6); /* 12px 24px */
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: oklch(0.2 0.042 265.755); /* Darker blue */
}

.btn-primary:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  padding: var(--space-3) var(--space-6); /* 12px 24px */
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--muted);
}
```

#### Button Sizes
```css
/* Small Button */
.btn-sm {
  padding: var(--space-2) var(--space-4); /* 8px 16px */
  font-size: 0.75rem; /* 12px */
  line-height: 1rem; /* 16px */
}

/* Large Button */
.btn-lg {
  padding: var(--space-4) var(--space-8); /* 16px 32px */
  font-size: 1rem; /* 16px */
  line-height: 1.5rem; /* 24px */
}
```

#### Button States
```css
/* Disabled State */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading State */
.btn.loading {
  position: relative;
  color: transparent;
}

.btn.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Forms

#### Input Fields
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4); /* 12px 16px */
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--background);
  color: var(--foreground);
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--ring);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Form Labels
```css
.form-label {
  display: block;
  margin-bottom: var(--space-2); /* 8px */
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: var(--foreground);
}

.form-label.required::after {
  content: ' *';
  color: var(--destructive);
}
```

#### Form Validation
```css
/* Error State */
.input.error {
  border-color: var(--destructive);
}

.input.error:focus {
  border-color: var(--destructive);
  box-shadow: 0 0 0 3px oklch(0.577 0.245 27.325 / 0.2);
}

/* Error Message */
.error-message {
  margin-top: var(--space-2); /* 8px */
  font-size: 0.75rem; /* 12px */
  color: var(--destructive);
}
```

### Cards

#### Basic Card
```css
.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-6); /* 24px */
  box-shadow: 0 1px 3px 0 oklch(0 0 0 / 0.1);
}

.card-header {
  margin-bottom: var(--space-4); /* 16px */
}

.card-title {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0;
}

.card-content {
  color: var(--muted-foreground);
}

.card-footer {
  margin-top: var(--space-4); /* 16px */
  padding-top: var(--space-4); /* 16px */
  border-top: 1px solid var(--border);
}
```

#### Interactive Card
```css
.card-interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-interactive:hover {
  border-color: var(--ring);
  box-shadow: 0 4px 6px -1px oklch(0 0 0 / 0.1);
}

.card-interactive:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Navigation

#### Sidebar Navigation
```css
.sidebar-nav {
  padding: var(--space-4); /* 16px */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4); /* 12px 16px */
  border-radius: var(--radius);
  color: var(--muted-foreground);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--muted);
  color: var(--foreground);
}

.nav-item.active {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.nav-item:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Breadcrumb Navigation
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2); /* 8px */
  font-size: 0.875rem; /* 14px */
  color: var(--muted-foreground);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-separator {
  margin: 0 var(--space-1); /* 0 4px */
  color: var(--border);
}
```

### Data Display

#### Tables
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background-color: var(--muted);
  padding: var(--space-3) var(--space-4); /* 12px 16px */
  text-align: left;
  font-weight: 500;
  font-size: 0.875rem; /* 14px */
  color: var(--muted-foreground);
}

.table td {
  padding: var(--space-3) var(--space-4); /* 12px 16px */
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem; /* 14px */
}

.table tbody tr:hover {
  background-color: var(--muted);
}
```

#### Lists
```css
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  padding: var(--space-3) var(--space-4); /* 12px 16px */
  border-bottom: 1px solid var(--border);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background-color: var(--muted);
}
```

### Feedback

#### Alerts
```css
.alert {
  padding: var(--space-4); /* 16px */
  border-radius: var(--radius);
  border: 1px solid transparent;
  margin-bottom: var(--space-4); /* 16px */
}

.alert-success {
  background-color: oklch(0.646 0.222 41.116 / 0.1);
  border-color: var(--success);
  color: var(--success);
}

.alert-warning {
  background-color: oklch(0.828 0.189 84.429 / 0.1);
  border-color: var(--warning);
  color: var(--warning);
}

.alert-error {
  background-color: oklch(0.577 0.245 27.325 / 0.1);
  border-color: var(--destructive);
  color: var(--destructive);
}

.alert-info {
  background-color: oklch(0.6 0.118 184.704 / 0.1);
  border-color: var(--info);
  color: var(--info);
}
```

#### Progress Indicators
```css
.progress {
  width: 100%;
  height: 8px;
  background-color: var(--muted);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary);
  transition: width 0.3s ease;
}

.progress-indeterminate {
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary) 50%,
    transparent 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: progress-indeterminate 2s infinite;
}
```

---

## Interaction Design

### Micro-interactions

#### Hover Effects
```css
/* Button Hover */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px oklch(0 0 0 / 0.1);
}

/* Card Hover */
.card:hover {
  box-shadow: 0 10px 15px -3px oklch(0 0 0 / 0.1);
}

/* Link Hover */
.link:hover {
  text-decoration: underline;
}
```

#### Focus States
```css
/* Focus Ring */
.focus-ring {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Focus Visible */
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Transitions
```css
/* Smooth Transitions */
.transition {
  transition: all 0.2s ease;
}

.transition-fast {
  transition: all 0.1s ease;
}

.transition-slow {
  transition: all 0.3s ease;
}
```

### Loading States

#### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--border) 50%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Spinner
```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--muted);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Progress Bar
```css
.progress-bar {
  height: 4px;
  background-color: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

### Error Handling

#### Error States
```css
/* Input Error */
.input.error {
  border-color: var(--destructive);
}

.input.error:focus {
  border-color: var(--destructive);
  box-shadow: 0 0 0 3px oklch(0.577 0.245 27.325 / 0.2);
}

/* Error Message */
.error-message {
  color: var(--destructive);
  font-size: 0.75rem; /* 12px */
  margin-top: var(--space-2); /* 8px */
}
```

#### Error Boundaries
```css
.error-boundary {
  padding: var(--space-6); /* 24px */
  border: 1px solid var(--destructive);
  border-radius: var(--radius);
  background-color: oklch(0.577 0.245 27.325 / 0.1);
  color: var(--destructive);
}
```

### Success Feedback

#### Success States
```css
/* Success Input */
.input.success {
  border-color: var(--success);
}

.input.success:focus {
  border-color: var(--success);
  box-shadow: 0 0 0 3px oklch(0.646 0.222 41.116 / 0.2);
}

/* Success Message */
.success-message {
  color: var(--success);
  font-size: 0.75rem; /* 12px */
  margin-top: var(--space-2); /* 8px */
}
```

#### Toast Notifications
```css
.toast {
  position: fixed;
  bottom: var(--space-4); /* 16px */
  right: var(--space-4); /* 16px */
  padding: var(--space-4); /* 16px */
  border-radius: var(--radius);
  box-shadow: 0 10px 15px -3px oklch(0 0 0 / 0.1);
  z-index: 1000;
  animation: toast-slide-in 0.3s ease;
}

.toast-success {
  background-color: var(--success);
  color: var(--success-foreground);
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## Layout Patterns

### Page Layouts

#### Dashboard Layout
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.dashboard-sidebar {
  background-color: var(--sidebar);
  border-right: 1px solid var(--sidebar-border);
}

.dashboard-main {
  background-color: var(--background);
  padding: var(--space-6); /* 24px */
}
```

#### Content Layout
```css
.content-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4); /* 0 16px */
}

.content-header {
  margin-bottom: var(--space-8); /* 32px */
}

.content-body {
  display: grid;
  gap: var(--space-6); /* 24px */
}
```

### Sidebar Navigation

#### Collapsible Sidebar
```css
.sidebar {
  width: 280px;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-nav {
  padding: var(--space-4); /* 16px */
}

.nav-section {
  margin-bottom: var(--space-6); /* 24px */
}

.nav-section-title {
  font-size: 0.75rem; /* 12px */
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2); /* 8px */
}
```

### Content Areas

#### Card Grid
```css
.card-grid {
  display: grid;
  gap: var(--space-6); /* 24px */
}

/* Responsive Grid */
.card-grid {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

#### Data Table
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
}

.data-table th {
  background-color: var(--muted);
  padding: var(--space-4); /* 16px */
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem; /* 14px */
  color: var(--foreground);
}

.data-table td {
  padding: var(--space-4); /* 16px */
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem; /* 14px */
  color: var(--foreground);
}

.data-table tbody tr:hover {
  background-color: var(--muted);
}
```

### Modal Patterns

#### Modal Overlay
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: oklch(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modal-fade-in 0.2s ease;
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Modal Content
```css
.modal-content {
  background-color: var(--card);
  border-radius: var(--radius);
  box-shadow: 0 20px 25px -5px oklch(0 0 0 / 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-slide-in 0.2s ease;
}

@keyframes modal-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

#### Modal Header
```css
.modal-header {
  padding: var(--space-6); /* 24px */
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: var(--card-foreground);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: var(--space-2); /* 8px */
  border-radius: var(--radius);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: var(--muted);
  color: var(--foreground);
}
```

#### Modal Body
```css
.modal-body {
  padding: var(--space-6); /* 24px */
}

.modal-footer {
  padding: var(--space-6); /* 24px */
  border-top: 1px solid var(--border);
  display: flex;
  gap: var(--space-3); /* 12px */
  justify-content: flex-end;
}
```

---

## Implementation Guidelines

### CSS Custom Properties
All design tokens are defined as CSS custom properties for easy theming and maintenance:

```css
:root {
  /* Colors */
  --primary: oklch(0.208 0.042 265.755);
  --primary-foreground: oklch(0.984 0.003 247.858);
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  
  /* Border Radius */
  --radius: 0.5rem;
}
```

### Component Usage
Components should follow the established patterns and use the design system tokens:

```tsx
// Example: Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
    >
      {children}
    </button>
  );
};
```

### Accessibility Implementation
All components must implement proper accessibility features:

```tsx
// Example: Accessible Button
const AccessibleButton: React.FC<ButtonProps> = ({ 
  children, 
  'aria-label': ariaLabel,
  ...props 
}) => {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className="btn btn-primary"
    >
      {children}
    </button>
  );
};
```

### Responsive Design
Components should be responsive by default:

```css
/* Mobile First Approach */
.component {
  /* Base styles for mobile */
  padding: var(--space-4);
  font-size: var(--font-size-base);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--space-6);
    font-size: var(--font-size-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-8);
  }
}
```

---

## Related Documentation

- **[Frontend Architecture](./architecture/frontend-architecture.md):** Technical implementation details
- **[Accessibility Guidelines](./accessibility-guidelines.md):** WCAG 2.1 compliance requirements
- **[Component Testing](./testing.md):** Testing strategies for UI components
- **[Performance Guidelines](./performance-guidelines.md):** Performance optimization strategies

---

This design system ensures consistent, accessible, and maintainable user interfaces across the Dota 2 data dashboard application. All components should follow these guidelines to maintain design consistency and user experience quality. 
# Component Design Specifications

This document outlines the design specifications for all UI components in the Dota 2 Data Dashboard.

## Table of Contents

- [Button Components](#button-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Data Display Components](#data-display-components)
- [Navigation Components](#navigation-components)
- [Sidebar Design](#sidebar-design)

## Sidebar Design

### Overview
The sidebar provides primary navigation between pages, quick access to external resources, and global settings. It has two modes: collapsed (icons only) and expanded (icons with labels).

### Structure & Organization

#### **Section Order**
1. **Navigation Section** - Primary page navigation
2. **External Resources Section** - Links to external Dota 2 sites
3. **Quick Links Section** - Active team and league links (only shown if active team is set)
4. **Settings Section** - Theme and preferred site settings (at bottom)

#### **Visual Hierarchy**
- Subtle separators between sections
- Active page highlighted with background color change
- Hover effects with slight background color change
- Icons remain in exact position during collapse/expand transitions

### Navigation Section

#### **Navigation Items**
- **Team Management** - Building icon
- **Match History** - Clock icon  
- **Player Stats** - BarChart3 icon
- **Draft Suggestions** - Target icon

#### **Visual States**
- **Default**: Gray text, no background
- **Active**: Background color change, blue text
- **Hover**: Slight background color change
- **Collapsed**: Icons only with tooltips

### External Resources Section

#### **External Sites**
- **Dotabuff** - Use existing ExternalSiteIcons.tsx
- **OpenDota** - Use existing ExternalSiteIcons.tsx
- **Dota2ProTracker** - Use existing ExternalSiteIcons.tsx

#### **Behavior**
- Opens in new tab
- Hover tooltips with descriptions
- Preferred site indicator

### Quick Links Section

#### **Content (Only shown if active team is set)**
- **Team Page** - Multi-person icon (Users), links to team's Dotabuff page
- **League Page** - Podium icon (Trophy), links to league's Dotabuff page

#### **Static Data for Demonstration**
- Active Team: Team Liquid
- League: ESL Pro League
- Team Dotabuff URL: `https://dotabuff.com/teams/team-liquid`
- League Dotabuff URL: `https://dotabuff.com/leagues/esl-pro-league`

### Settings Section

#### **Controls**
- **Theme Toggle** - Sun/Moon icons for light/dark mode (toggle switches)
- **Preferred Site Toggle** - Custom external site icons (Dotabuff/OpenDota) (toggle switches)

#### **Position**
- Always at the bottom of the sidebar
- Sticky positioning

### Responsive Behavior

#### **Desktop**
- Fixed left sidebar
- Collapsible with smooth animations
- Width: 64px (collapsed) / 256px (expanded)

#### **Mobile**
- Hamburger menu that slides in
- Overlay content (not push)
- Full height overlay
- Touch-friendly target sizes
- Width: TBD (needs to be determined)

### Icon Requirements

#### **Navigation Icons (Lucide)**
- Team Management: `Building`
- Match History: `Clock`
- Player Stats: `BarChart3`
- Draft Suggestions: `Target`

#### **External Site Icons**
- Use existing `ExternalSiteIcons.tsx`
- Dotabuff, OpenDota, Dota2ProTracker

#### **Quick Link Icons**
- Team Page: Multi-person icon (Lucide `Users`)
- League Page: Podium icon (Lucide `Trophy`)

#### **Settings Icons**
- Theme: Sun/Moon (Lucide `Sun`/`Moon`)
- Preferred Site: Custom external site icons

### Accessibility Requirements

#### **Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Tab order follows visual hierarchy
- Enter/Space to activate buttons

#### **Screen Reader Support**
- Proper ARIA labels for all interactive elements
- Descriptive labels for icons
- Announce state changes (collapsed/expanded)

#### **Visual Indicators**
- Focus outlines on all interactive elements
- High contrast ratios for text and icons
- Clear visual distinction between states

### Animation & Transitions

#### **Collapse/Expand**
- Smooth 300ms ease-in-out transition
- Icons remain in exact position
- No jumping or repositioning
- Width animates from 64px to 256px

#### **Hover Effects**
- Subtle background color changes
- Smooth 200ms transitions
- No scale or transform effects

### Color Scheme

#### **Light Theme**
- Background: White
- Text: Gray-700
- Active: Blue-100 background, Blue-700 text
- Hover: Gray-100 background
- Separators: Gray-200

#### **Dark Theme**
- Background: Gray-900
- Text: Gray-300
- Active: Blue-900 background, Blue-300 text
- Hover: Gray-800 background
- Separators: Gray-700

### Implementation Notes

#### **Static Data**
- Use realistic Dota 2 team names (Team Liquid, OG, etc.)
- Use real league names (ESL Pro League, etc.)
- Only show Quick Links if active team is set

#### **State Management**
- Theme preference saved to localStorage
- Preferred site setting saved to localStorage
- Sidebar collapsed state saved to localStorage
- Active team ID saved to localStorage

#### **Quality Requirements**
- Zero linting and TypeScript errors
- WCAG 2.1 AA compliance
- Mobile-first responsive design
- No Unicode emojis - use proper icons only

## Button Components

### Primary Button
```tsx
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Primary call-to-action buttons
- **Visual Style**: Blue background with white text
- **States**: Default, hover, focus, disabled, loading
- **Sizes**: Small (32px), Medium (40px), Large (48px)
- **Accessibility**: Keyboard navigable, screen reader support
- **Responsive**: Scales appropriately on mobile devices

#### Implementation
```tsx
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  'aria-label': ariaLabel,
  className
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={cn(
        'bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg'
        },
        className
      )}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### Secondary Button
```tsx
interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Secondary actions and supporting buttons
- **Visual Style**: Gray background with dark text
- **States**: Default, hover, focus, disabled
- **Sizes**: Small (32px), Medium (40px), Large (48px)
- **Accessibility**: Keyboard navigable, screen reader support

### Destructive Button
```tsx
interface DestructiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Destructive actions (delete, remove)
- **Visual Style**: Red background with white text
- **States**: Default, hover, focus, disabled
- **Accessibility**: Clear warning for destructive actions

### Action Button (Quick Actions)
```tsx
interface ActionButtonProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  primary?: boolean;
  className?: string;
}
```

#### Specifications
- **Purpose**: Quick action buttons with icon and description
- **Visual Style**: Card-like appearance with icon and text
- **Variants**: Primary (blue) and Secondary (gray)
- **Layout**: Icon, title, and description in horizontal layout
- **Responsive**: Adapts to different screen sizes

## Form Components

### Input Field
```tsx
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  'aria-describedby'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Text input for user data entry
- **Visual Style**: Bordered input with label
- **States**: Default, focus, error, disabled
- **Validation**: Real-time validation with error messages
- **Accessibility**: Proper labeling and error announcements

#### Implementation
```tsx
const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  type = 'text',
  'aria-describedby': ariaDescribedBy,
  className
}) => {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-describedby={errorId || ariaDescribedBy}
        aria-invalid={!!error}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
        )}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Select Field
```tsx
interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Dropdown selection for predefined options
- **Visual Style**: Styled select with custom dropdown
- **States**: Default, focus, error, disabled
- **Accessibility**: Keyboard navigation, screen reader support

### Checkbox Field
```tsx
interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
  className?: string;
}
```

#### Specifications
- **Purpose**: Boolean selection (true/false)
- **Visual Style**: Custom styled checkbox
- **States**: Unchecked, checked, disabled
- **Accessibility**: Proper labeling and keyboard support

## Card Components

### Basic Card
```tsx
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Specifications
- **Purpose**: Content container with consistent styling
- **Visual Style**: White background with border and shadow
- **Padding**: Small (16px), Medium (24px), Large (32px)
- **Responsive**: Adapts to different screen sizes

#### Implementation
```tsx
const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  className
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        {
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg'
        },
        className
      )}
    >
      {children}
    </div>
  );
};
```

### Card with Header
```tsx
interface CardWithHeaderProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Specifications
- **Purpose**: Card with title and optional actions
- **Layout**: Header with title/subtitle and actions, content below
- **Responsive**: Actions stack on mobile
- **Accessibility**: Proper heading hierarchy

### Interactive Card
```tsx
interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Specifications
- **Purpose**: Clickable card with selection state
- **Visual Style**: Hover effects and selection indicators
- **States**: Default, hover, selected, disabled
- **Accessibility**: Keyboard navigation and screen reader support

## Navigation Components

### Sidebar Navigation
```tsx
interface SidebarNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  className?: string;
}
```

#### Specifications
- **Purpose**: Primary navigation for the application
- **Layout**: Vertical list with icons and labels
- **States**: Collapsed (icons only), expanded (icons + labels)
- **Responsive**: Collapsible on mobile devices
- **Accessibility**: Keyboard navigation and focus management

#### Implementation
```tsx
const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  className
}) => {
  const navigationItems = [
    { id: 'team-management', label: 'Team Management', icon: '👥' },
    { id: 'match-history', label: 'Match History', icon: '📜' },
    { id: 'player-stats', label: 'Player Stats', icon: '👤' },
    { id: 'draft-suggestions', label: 'Draft Suggestions', icon: '🎯' }
  ];

  return (
    <nav className={cn('flex-1 p-4', className)}>
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
```

### Sidebar Container
```tsx
interface SidebarProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  className?: string;
}
```

#### Specifications
- **Purpose**: Main sidebar container with responsive behavior
- **Layout**: Fixed positioning with smooth transitions
- **Responsive**: Collapsible on mobile, persistent on desktop
- **Accessibility**: Proper focus management and keyboard navigation

### Breadcrumb Navigation
```tsx
interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}
```

#### Specifications
- **Purpose**: Secondary navigation showing current location
- **Layout**: Horizontal list with separators
- **Accessibility**: Proper navigation landmarks

## Data Display Components

### Data Table
```tsx
interface DataTableProps {
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  data: Array<Record<string, any>>;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}
```

#### Specifications
- **Purpose**: Tabular data display with sorting
- **Layout**: Responsive table with horizontal scroll on mobile
- **Features**: Sortable columns, responsive design
- **Accessibility**: Proper table semantics and keyboard navigation

### Hero Card
```tsx
interface HeroCardProps {
  hero: {
    id: string;
    localizedName: string;
    primaryAttribute: string;
    roles: string[];
  };
  meta?: {
    metaScore: number;
    trend: string;
  };
  isSelected?: boolean;
  onSelect?: (heroId: string) => void;
  onHide?: (heroId: string) => void;
  onViewDetails?: (heroId: string) => void;
  showStats?: boolean;
  showMeta?: boolean;
  showRole?: boolean;
  variant?: 'list' | 'grid' | 'detailed';
  className?: string;
}
```

#### Specifications
- **Purpose**: Display hero information in various layouts
- **Variants**: List (compact), Grid (medium), Detailed (full)
- **Features**: Selection, hiding, detailed view
- **Responsive**: Adapts layout based on screen size
- **Accessibility**: Proper labeling and keyboard support

#### Implementation
```tsx
const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  meta,
  isSelected = false,
  onSelect,
  onHide,
  onViewDetails,
  showStats = false,
  showMeta = false,
  showRole = false,
  variant = 'grid',
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(hero.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(hero.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(hero.id);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        'transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        className
      )}
      onClick={handleSelect}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {hero.localizedName}
              </h3>
              {showRole && (
                <div className="flex space-x-1 mt-1">
                  {hero.roles.slice(0, 2).map((role) => (
                    <span
                      key={role}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showMeta && meta && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {meta.metaScore.toFixed(1)}
              </span>
            )}
            {onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                aria-label="View hero details"
              >
                👁️
              </button>
            )}
            {onHide && (
              <button
                onClick={handleHide}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                aria-label="Hide hero"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Loading Skeleton
```tsx
interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}
```

#### Specifications
- **Purpose**: Loading placeholder for content
- **Visual Style**: Animated gray bars
- **Accessibility**: Screen reader announcements
- **Usage**: Replace content while loading

## Layout Components

### Sidebar Layout
```tsx
interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}
```

#### Specifications
- **Purpose**: Two-column layout with sidebar and main content
- **Layout**: Fixed sidebar with scrollable main content
- **Responsive**: Sidebar collapses on mobile
- **Accessibility**: Proper landmark structure

### Grid Layout
```tsx
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Specifications
- **Purpose**: Responsive grid layout for content
- **Columns**: 1-4 columns with responsive breakpoints
- **Gap**: Small (16px), Medium (24px), Large (32px)
- **Responsive**: Adapts columns based on screen size

## Feedback Components

### Alert Component
```tsx
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}
```

#### Specifications
- **Purpose**: User feedback and notifications
- **Types**: Success (green), Warning (yellow), Error (red), Info (blue)
- **Features**: Dismissible, auto-hide options
- **Accessibility**: Proper ARIA roles and announcements

### Modal Component
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Specifications
- **Purpose**: Overlay dialogs for focused interactions
- **Layout**: Centered modal with backdrop
- **Sizes**: Small (400px), Medium (600px), Large (800px)
- **Accessibility**: Focus trap, escape key, screen reader support

## Accessibility Specifications

### Keyboard Navigation
All interactive components must support:
- **Tab Navigation**: Logical tab order
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate lists and grids
- **Escape**: Close modals and overlays

### Screen Reader Support
All components must include:
- **ARIA Labels**: Descriptive labels for screen readers
- **ARIA Roles**: Proper semantic roles
- **ARIA States**: Current state announcements
- **Live Regions**: Dynamic content announcements

### Focus Management
- **Visible Focus**: Clear focus indicators
- **Focus Trap**: Modal and overlay focus containment
- **Focus Restoration**: Return focus after modal close
- **Skip Links**: Skip to main content

### Color and Contrast
- **WCAG 2.1 AA**: Minimum 4.5:1 contrast ratio
- **Color Independence**: Information not conveyed by color alone
- **High Contrast**: Support for high contrast mode
- **Dark Mode**: Proper contrast in both themes

## Usage Guidelines

### Component Selection
1. **Primary Actions**: Use Primary Button
2. **Secondary Actions**: Use Secondary Button
3. **Destructive Actions**: Use Destructive Button
4. **Content Containers**: Use Card components
5. **Data Display**: Use appropriate data components
6. **Navigation**: Use Sidebar or Breadcrumb components

### Responsive Design
- **Mobile First**: Design for mobile, enhance for desktop
- **Touch Targets**: Minimum 44px for touch interactions
- **Content Priority**: Show most important content first
- **Progressive Enhancement**: Add features for larger screens

### Performance Considerations
- **Lazy Loading**: Load components as needed
- **Memoization**: Prevent unnecessary re-renders
- **Bundle Size**: Keep components lightweight
- **Caching**: Cache component data appropriately

## Implementation Examples

### Component Composition
```tsx
// Example: Dashboard with multiple components
const Dashboard: React.FC = () => {
  return (
    <SidebarLayout
      sidebar={<Sidebar />}
      main={
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader title="Recent Matches" />
            <CardContent>
              <DataTable columns={matchColumns} data={recentMatches} />
            </CardContent>
          </Card>
        </div>
      }
    />
  );
};
```

### Form Implementation
```tsx
// Example: Team creation form
const TeamForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    league: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation and submission logic
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputField
        label="Team Name"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        required
        error={errors.name}
      />
      
      <SelectField
        label="League"
        value={formData.league}
        onChange={(value) => setFormData({ ...formData, league: value })}
        options={leagueOptions}
        required
        error={errors.league}
      />
      
      <div className="flex space-x-4">
        <PrimaryButton type="submit">Create Team</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
};
```

### Accessibility Implementation
```tsx
// Example: Accessible modal
const AccessibleModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus trap
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
```

## Cross-References

### Related Documentation
- **[Color System](./colors.md)**: Color usage in components
- **[Typography System](./typography.md)**: Text styling in components
- **[Spacing System](./spacing.md)**: Layout and spacing in components
- **[UI Standards](../../architecture/frontend/ui-standards.md)**: Technical implementation details

### Implementation Files
- `src/components/layout/Sidebar.tsx`: Sidebar component implementation
- `src/components/dashboard/QuickActions.tsx`: Action button implementation
- `src/components/hero/hero-card-variants.tsx`: Hero card variants
- `src/app/globals.css`: Global component styles

### Testing and Validation
- **Component Testing**: Unit tests for all component variants
- **Accessibility Testing**: Screen reader and keyboard navigation tests
- **Visual Testing**: Design review and visual regression tests
- **Performance Testing**: Bundle size and rendering performance tests

---

*This component specifications documentation provides a comprehensive foundation for consistent, accessible, and maintainable UI components across the Dota 2 Data Dashboard application.* 
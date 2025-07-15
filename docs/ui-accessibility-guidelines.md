# Accessibility Guidelines

This document outlines the comprehensive accessibility standards and implementation guidelines for the Dota 2 data dashboard application. These guidelines ensure WCAG 2.1 AA compliance and provide an inclusive user experience for all users, including those with disabilities.

## Table of Contents

### [Accessibility Standards](#accessibility-standards)
- [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
- [Screen Reader Support](#screen-reader-support)
- [Keyboard Navigation](#keyboard-navigation)
- [Color and Contrast](#color-and-contrast)

### [Semantic HTML](#semantic-html)
- [Document Structure](#document-structure)
- [Landmark Roles](#landmark-roles)
- [Form Accessibility](#form-accessibility)
- [Data Tables](#data-tables)

### [ARIA Implementation](#aria-implementation)
- [ARIA Labels](#aria-labels)
- [ARIA States](#aria-states)
- [Live Regions](#live-regions)
- [Custom Components](#custom-components)

### [Focus Management](#focus-management)
- [Focus Indicators](#focus-indicators)
- [Tab Order](#tab-order)
- [Skip Links](#skip-links)
- [Modal Focus](#modal-focus)

### [Testing and Validation](#testing-and-validation)
- [Automated Testing](#automated-testing)
- [Manual Testing](#manual-testing)
- [Screen Reader Testing](#screen-reader-testing)
- [Keyboard Testing](#keyboard-testing)

### [Common Patterns](#common-patterns)
- [Navigation Patterns](#navigation-patterns)
- [Form Patterns](#form-patterns)
- [Data Display Patterns](#data-display-patterns)
- [Interactive Patterns](#interactive-patterns)

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Level A Requirements
- **Non-text Content:** All images have appropriate alt text
- **Audio/Video:** Captions for pre-recorded audio content
- **Keyboard Accessible:** All functionality available via keyboard
- **No Keyboard Trap:** Users can navigate away from all components
- **Timing Adjustable:** Users can adjust time limits
- **Pause, Stop, Hide:** Users can pause moving content
- **Three Flashes:** No content flashes more than 3 times per second
- **Page Title:** Each page has a descriptive title
- **Focus Order:** Logical tab order through the page
- **Link Purpose:** Link purpose is clear from context
- **Multiple Ways:** Multiple ways to reach content
- **Headings and Labels:** Clear headings and labels
- **Focus Visible:** Keyboard focus is clearly visible
- **Language of Page:** Page language is specified
- **On Input:** Context changes don't occur automatically
- **Error Identification:** Errors are clearly identified
- **Labels or Instructions:** Clear labels and instructions
- **Parsing:** Valid HTML markup
- **Name, Role, Value:** Custom components have proper names, roles, and values

#### Level AA Requirements
- **Live Captions:** Live audio content has captions
- **Audio Description:** Pre-recorded video has audio description
- **Contrast (Minimum):** 4.5:1 contrast ratio for normal text
- **Resize Text:** Text can be resized up to 200%
- **Images of Text:** Text is not presented as images
- **Keyboard (No Exception):** All functionality available via keyboard
- **No Timing:** No time limits on content
- **Interruptions:** Users can postpone interruptions
- **Re-authenticating:** Session doesn't expire during activity
- **Three Flashes:** No content flashes more than 3 times per second
- **Page Titled:** Each page has a descriptive title
- **Focus Order:** Logical tab order through the page
- **Link Purpose (In Context):** Link purpose is clear from context
- **Multiple Ways:** Multiple ways to reach content
- **Headings and Labels:** Clear headings and labels
- **Focus Visible:** Keyboard focus is clearly visible
- **Language of Parts:** Language changes are marked
- **On Input:** Context changes don't occur automatically
- **Error Identification:** Errors are clearly identified
- **Labels or Instructions:** Clear labels and instructions
- **Parsing:** Valid HTML markup
- **Name, Role, Value:** Custom components have proper names, roles, and values

### Screen Reader Support

#### NVDA (Windows)
- **Announcements:** Proper ARIA live regions for dynamic content
- **Landmarks:** Clear landmark structure for navigation
- **Headings:** Proper heading hierarchy (H1-H6)
- **Forms:** Clear labels and error messages
- **Tables:** Proper table structure with headers

#### JAWS (Windows)
- **Navigation:** Efficient navigation through landmarks
- **Forms:** Clear form labels and validation
- **Tables:** Proper table headers and data relationships
- **Dynamic Content:** Live region announcements

#### VoiceOver (macOS/iOS)
- **Gesture Navigation:** Touch gesture support for mobile
- **Rotor Navigation:** Efficient navigation through elements
- **Form Support:** Clear form labels and validation
- **Table Support:** Proper table structure

#### TalkBack (Android)
- **Touch Navigation:** Touch gesture support
- **Form Support:** Clear form labels and validation
- **Dynamic Content:** Live region announcements

### Keyboard Navigation

#### Tab Order
```tsx
// Example: Logical tab order implementation
const NavigationMenu = () => {
  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li>
          <a href="/dashboard" tabIndex={0}>
            Dashboard
          </a>
        </li>
        <li>
          <a href="/teams" tabIndex={0}>
            Teams
          </a>
        </li>
        <li>
          <a href="/matches" tabIndex={0}>
            Matches
          </a>
        </li>
      </ul>
    </nav>
  );
};
```

#### Arrow Key Navigation
```tsx
// Example: Arrow key navigation for custom components
const CustomSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onChange(options[focusedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };
  
  return (
    <div className="custom-select">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select option"
      >
        {value || 'Select an option'}
      </button>
      
      {isOpen && (
        <ul role="listbox" className="options-list">
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={index === focusedIndex ? 'focused' : ''}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Color and Contrast

#### Contrast Requirements
```css
/* Minimum contrast ratios */
:root {
  /* Normal text: 4.5:1 */
  --text-normal: oklch(0.129 0.042 264.695); /* Dark gray on white */
  
  /* Large text: 3:1 */
  --text-large: oklch(0.129 0.042 264.695); /* Dark gray on white */
  
  /* UI components: 3:1 */
  --ui-component: oklch(0.208 0.042 265.755); /* Blue on white */
  
  /* Focus indicators: High contrast */
  --focus-ring: oklch(0.704 0.04 256.788); /* High contrast blue */
}
```

#### Color Blindness Considerations
```tsx
// Example: Color-blind friendly status indicators
const StatusIndicator = ({ status }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'success':
        return {
          icon: '✓',
          label: 'Success',
          className: 'status-success'
        };
      case 'error':
        return {
          icon: '✗',
          label: 'Error',
          className: 'status-error'
        };
      case 'warning':
        return {
          icon: '⚠',
          label: 'Warning',
          className: 'status-warning'
        };
      default:
        return {
          icon: '•',
          label: 'Unknown',
          className: 'status-unknown'
        };
    }
  };
  
  const statusInfo = getStatusInfo(status);
  
  return (
    <span className={`status-indicator ${statusInfo.className}`}>
      <span aria-hidden="true">{statusInfo.icon}</span>
      <span className="sr-only">{statusInfo.label}</span>
    </span>
  );
};
```

---

## Semantic HTML

### Document Structure

#### Proper Heading Hierarchy
```tsx
// Example: Proper heading hierarchy
const PageStructure = () => {
  return (
    <div>
      <header>
        <h1>Dota 2 Data Dashboard</h1>
        <nav aria-label="Main navigation">
          <h2 className="sr-only">Navigation</h2>
          {/* Navigation content */}
        </nav>
      </header>
      
      <main>
        <h2>Team Analysis</h2>
        <section>
          <h3>Performance Overview</h3>
          <div>
            <h4>Win Rate</h4>
            {/* Content */}
          </div>
          <div>
            <h4>Match History</h4>
            {/* Content */}
          </div>
        </section>
        
        <section>
          <h3>Player Statistics</h3>
          <div>
            <h4>Top Performers</h4>
            {/* Content */}
          </div>
        </section>
      </main>
      
      <footer>
        <h2 className="sr-only">Footer</h2>
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

#### Landmark Roles
```tsx
// Example: Proper landmark structure
const AppLayout = () => {
  return (
    <div className="app">
      <header role="banner">
        <h1>Dota 2 Data Dashboard</h1>
      </header>
      
      <nav role="navigation" aria-label="Main navigation">
        {/* Navigation content */}
      </nav>
      
      <main role="main">
        {/* Main content */}
      </main>
      
      <aside role="complementary" aria-label="Additional information">
        {/* Sidebar content */}
      </aside>
      
      <footer role="contentinfo">
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

### Form Accessibility

#### Proper Form Labels
```tsx
// Example: Accessible form implementation
const AccessibleForm = () => {
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Team Information</legend>
        
        <div className="form-group">
          <label htmlFor="team-name">Team Name</label>
          <input
            id="team-name"
            type="text"
            name="teamName"
            required
            aria-describedby="team-name-help"
          />
          <div id="team-name-help" className="help-text">
            Enter the official team name as it appears in tournaments
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="team-league">League</label>
          <select id="team-league" name="league" required>
            <option value="">Select a league</option>
            <option value="pro">Professional League</option>
            <option value="amateur">Amateur League</option>
          </select>
        </div>
        
        <div className="form-group">
          <fieldset>
            <legend>Team Type</legend>
            <div>
              <input
                type="radio"
                id="type-professional"
                name="teamType"
                value="professional"
              />
              <label htmlFor="type-professional">Professional</label>
            </div>
            <div>
              <input
                type="radio"
                id="type-amateur"
                name="teamType"
                value="amateur"
              />
              <label htmlFor="type-amateur">Amateur</label>
            </div>
          </fieldset>
        </div>
        
        <button type="submit">Add Team</button>
      </fieldset>
    </form>
  );
};
```

#### Error Handling
```tsx
// Example: Accessible error handling
const FormWithErrors = () => {
  const [errors, setErrors] = useState({});
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <div id="email-error" className="error-message" role="alert">
            {errors.email}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <div id="password-error" className="error-message" role="alert">
            {errors.password}
          </div>
        )}
      </div>
    </form>
  );
};
```

### Data Tables

#### Accessible Table Structure
```tsx
// Example: Accessible data table
const AccessibleTable = ({ data, columns }) => {
  return (
    <div className="table-container">
      <table role="table" aria-label="Team performance data">
        <caption>Team Performance Overview</caption>
        
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => {
                if (colIndex === 0) {
                  return (
                    <th key={column.key} scope="row">
                      {row[column.key]}
                    </th>
                  );
                }
                return (
                  <td key={column.key}>
                    {row[column.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            {columns.slice(1).map(column => (
              <td key={column.key}>
                {/* Calculate totals */}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
```

---

## ARIA Implementation

### ARIA Labels

#### Descriptive Labels
```tsx
// Example: Proper ARIA labels
const AccessibleComponents = () => {
  return (
    <div>
      {/* Button with descriptive label */}
      <button
        aria-label="Add new team to dashboard"
        onClick={handleAddTeam}
      >
        <PlusIcon />
        Add Team
      </button>
      
      {/* Search input with label */}
      <div className="search-container">
        <label htmlFor="search-input" className="sr-only">
          Search teams, players, and matches
        </label>
        <input
          id="search-input"
          type="search"
          placeholder="Search..."
          aria-describedby="search-help"
        />
        <div id="search-help" className="sr-only">
          Type to search for teams, players, or matches
        </div>
      </div>
      
      {/* Navigation with proper labels */}
      <nav aria-label="Secondary navigation">
        <ul>
          <li>
            <a href="/dashboard" aria-current="page">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/teams">Teams</a>
          </li>
        </ul>
      </nav>
    </div>
  );
};
```

#### Dynamic Labels
```tsx
// Example: Dynamic ARIA labels
const DynamicLabels = ({ itemCount, selectedCount }) => {
  return (
    <div>
      {/* Dynamic label based on state */}
      <button
        aria-label={`${selectedCount} of ${itemCount} items selected`}
        onClick={handleSelection}
      >
        Select All
      </button>
      
      {/* Progress indicator with live updates */}
      <div
        role="progressbar"
        aria-valuenow={selectedCount}
        aria-valuemin="0"
        aria-valuemax={itemCount}
        aria-label={`${selectedCount} items selected out of ${itemCount} total`}
      >
        <div 
          className="progress-bar"
          style={{ width: `${(selectedCount / itemCount) * 100}%` }}
        />
      </div>
    </div>
  );
};
```

### ARIA States

#### Interactive States
```tsx
// Example: ARIA states for interactive components
const InteractiveComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  
  return (
    <div>
      {/* Expandable section */}
      <button
        aria-expanded={isExpanded}
        aria-controls="expandable-content"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Collapse' : 'Expand'} Details
      </button>
      
      <div
        id="expandable-content"
        aria-hidden={!isExpanded}
        className={isExpanded ? 'expanded' : 'collapsed'}
      >
        {/* Content */}
      </div>
      
      {/* Selectable item */}
      <div
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onClick={() => setIsSelected(!isSelected)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsSelected(!isSelected);
          }
        }}
      >
        <span className="checkbox-indicator" />
        <span>Select this item</span>
      </div>
    </div>
  );
};
```

### Live Regions

#### Dynamic Content Announcements
```tsx
// Example: Live regions for dynamic content
const LiveRegions = () => {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('');
  
  return (
    <div>
      {/* Status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </div>
      
      {/* Notification announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {notifications.map(notification => (
          <div key={notification.id}>
            {notification.message}
          </div>
        ))}
      </div>
      
      {/* Progress updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="progress-announcement"
      >
        Loading data...
      </div>
    </div>
  );
};
```

### Custom Components

#### Custom Select Component
```tsx
// Example: Accessible custom select component
const CustomSelect = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <div className="custom-select">
      <label id="select-label">{label}</label>
      
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              setFocusedIndex(prev => 
                prev < options.length - 1 ? prev + 1 : 0
              );
              break;
            case 'ArrowUp':
              e.preventDefault();
              setFocusedIndex(prev => 
                prev > 0 ? prev - 1 : options.length - 1
              );
              break;
            case 'Enter':
            case ' ':
              e.preventDefault();
              if (focusedIndex >= 0) {
                onChange(options[focusedIndex].value);
                setIsOpen(false);
              }
              break;
            case 'Escape':
              setIsOpen(false);
              break;
          }
        }}
      >
        {selectedOption ? selectedOption.label : 'Select an option'}
      </button>
      
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby="select-label"
          className="options-list"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={index === focusedIndex ? 'focused' : ''}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

## Focus Management

### Focus Indicators

#### Visible Focus Styles
```css
/* Focus indicator styles */
:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Custom focus styles for buttons */
.btn:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px oklch(0.704 0.04 256.788 / 0.2);
}

/* Focus styles for form inputs */
.form-input:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-color: var(--focus-ring);
}

/* Focus styles for custom components */
.custom-component:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

#### Focus Trapping
```tsx
// Example: Focus trap for modals
const useFocusTrap = (isActive) => {
  const containerRef = useRef();
  
  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);
  
  return containerRef;
};
```

### Skip Links

#### Skip Navigation Links
```tsx
// Example: Skip links for keyboard navigation
const SkipLinks = () => {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
      <a href="#footer" className="skip-link">
        Skip to footer
      </a>
    </div>
  );
};

// CSS for skip links
const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary);
    color: var(--primary-foreground);
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
  }
  
  .skip-link:focus {
    top: 6px;
  }
`;
```

### Modal Focus Management

#### Modal Focus Handling
```tsx
// Example: Modal with proper focus management
const AccessibleModal = ({ isOpen, onClose, children, title }) => {
  const modalRef = useRef();
  const previousFocusRef = useRef();
  
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        role="document"
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </header>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

## Testing and Validation

### Automated Testing

#### Jest Testing for Accessibility
```tsx
// Example: Accessibility testing with Jest
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Accessibility Tests', () => {
  test('button has accessible name', () => {
    render(<button aria-label="Add team">Add</button>);
    
    const button = screen.getByRole('button', { name: 'Add team' });
    expect(button).toBeInTheDocument();
  });
  
  test('form inputs have labels', () => {
    render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
      </form>
    );
    
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });
  
  test('table has proper structure', () => {
    render(
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Team A</th>
          </tr>
        </tbody>
      </table>
    );
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });
});
```

#### Axe Testing
```tsx
// Example: Axe accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

#### Keyboard Navigation Checklist
- [ ] All interactive elements are reachable via Tab
- [ ] Tab order is logical and intuitive
- [ ] Focus is clearly visible on all elements
- [ ] Escape key closes modals and dropdowns
- [ ] Enter and Space activate buttons and links
- [ ] Arrow keys work for custom components
- [ ] No keyboard traps exist

#### Screen Reader Testing Checklist
- [ ] Page title is descriptive
- [ ] Heading hierarchy is logical
- [ ] Images have appropriate alt text
- [ ] Forms have proper labels
- [ ] Tables have headers and captions
- [ ] Dynamic content is announced
- [ ] Error messages are clear
- [ ] Navigation is accessible

### Screen Reader Testing

#### NVDA Testing
```bash
# Install NVDA
# Test with NVDA running
# Verify announcements and navigation
```

#### VoiceOver Testing
```bash
# Enable VoiceOver on macOS
# Test with VoiceOver running
# Verify announcements and navigation
```

### Keyboard Testing

#### Keyboard Navigation Test
```tsx
// Example: Keyboard navigation test
test('keyboard navigation works correctly', async () => {
  render(<NavigationMenu />);
  
  const user = userEvent.setup();
  
  // Tab to first navigation item
  await user.tab();
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus();
  
  // Tab to next item
  await user.tab();
  expect(screen.getByRole('link', { name: 'Teams' })).toHaveFocus();
  
  // Enter to activate
  await user.keyboard('{Enter}');
  // Verify navigation occurred
});
```

---

## Common Patterns

### Navigation Patterns

#### Accessible Navigation Menu
```tsx
// Example: Accessible navigation menu
const AccessibleNavigation = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  
  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li>
          <a
            href="/dashboard"
            aria-current={activeItem === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </a>
        </li>
        <li>
          <a
            href="/teams"
            aria-current={activeItem === 'teams' ? 'page' : undefined}
          >
            Teams
          </a>
        </li>
        <li>
          <a
            href="/matches"
            aria-current={activeItem === 'matches' ? 'page' : undefined}
          >
            Matches
          </a>
        </li>
      </ul>
    </nav>
  );
};
```

### Form Patterns

#### Accessible Form Validation
```tsx
// Example: Accessible form validation
const AccessibleFormValidation = () => {
  const [errors, setErrors] = useState({});
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          required
        />
        {errors.email && (
          <div id="email-error" className="error-message" role="alert">
            {errors.email}
          </div>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Data Display Patterns

#### Accessible Data Visualization
```tsx
// Example: Accessible chart component
const AccessibleChart = ({ data, title }) => {
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      
      {/* Visual chart */}
      <div className="chart" aria-hidden="true">
        {/* Chart rendering */}
      </div>
      
      {/* Accessible data table */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.category}>
              <th scope="row">{item.category}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Interactive Patterns

#### Accessible Custom Controls
```tsx
// Example: Accessible custom toggle
const AccessibleToggle = ({ checked, onChange, label }) => {
  return (
    <div className="toggle-container">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`toggle ${checked ? 'checked' : ''}`}
      >
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </button>
      <span className="toggle-label">{label}</span>
    </div>
  );
};
```

---

## Implementation Guidelines

### Performance Considerations
- **Minimize DOM queries** for screen readers
- **Optimize ARIA updates** to reduce announcements
- **Use efficient focus management** for large lists
- **Implement virtual scrolling** for accessibility

### Browser Support
- **Test across all major browsers** (Chrome, Firefox, Safari, Edge)
- **Verify screen reader compatibility** on each platform
- **Test keyboard navigation** in all browsers
- **Check color contrast** across different displays

### Documentation Requirements
- **Document accessibility features** for each component
- **Provide testing instructions** for manual testing
- **Include keyboard shortcuts** in user documentation
- **Maintain accessibility checklist** for new features

---

## Related Documentation

- **[UI Design System](./ui-design-system.md):** Visual design specifications
- **[UI Interaction Guidelines](./ui-interaction-guidelines.md):** Interaction design patterns
- **[Frontend Architecture](./architecture/frontend-architecture.md):** Technical implementation details
- **[Testing Guide](./development/testing.md):** Testing strategies for accessibility

---

This accessibility guidelines document ensures WCAG 2.1 AA compliance and provides an inclusive user experience for all users of the Dota 2 data dashboard application. All components and interactions must follow these guidelines to maintain accessibility standards. 
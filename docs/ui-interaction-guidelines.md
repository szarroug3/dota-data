# UI Interaction Guidelines

This document outlines the interaction design patterns and guidelines for the Dota 2 data dashboard application. These guidelines ensure consistent, intuitive, and accessible user interactions across all components and pages.

## Table of Contents

### [Interaction Principles](#interaction-principles)
- [User-Centered Design](#user-centered-design)
- [Progressive Disclosure](#progressive-disclosure)
- [Immediate Feedback](#immediate-feedback)
- [Error Prevention](#error-prevention)

### [Navigation Patterns](#navigation-patterns)
- [Sidebar Navigation](#sidebar-navigation)
- [Breadcrumb Navigation](#breadcrumb-navigation)
- [Tab Navigation](#tab-navigation)
- [Pagination](#pagination)

### [Form Interactions](#form-interactions)
- [Input Validation](#input-validation)
- [Auto-save](#auto-save)
- [Progressive Forms](#progressive-forms)
- [Form Feedback](#form-feedback)

### [Data Interactions](#data-interactions)
- [Filtering](#filtering)
- [Sorting](#sorting)
- [Search](#search)
- [Data Export](#data-export)

### [Loading States](#loading-states)
- [Skeleton Loading](#skeleton-loading)
- [Progress Indicators](#progress-indicators)
- [Infinite Scroll](#infinite-scroll)
- [Optimistic Updates](#optimistic-updates)

### [Feedback Patterns](#feedback-patterns)
- [Success Feedback](#success-feedback)
- [Error Handling](#error-handling)
- [Warning Messages](#warning-messages)
- [Confirmation Dialogs](#confirmation-dialogs)

### [Accessibility Interactions](#accessibility-interactions)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Focus Management](#focus-management)
- [Voice Commands](#voice-commands)

---

## Interaction Principles

### User-Centered Design
- **Intuitive Navigation:** Users should be able to find what they need quickly
- **Consistent Patterns:** Similar interactions should behave the same way
- **Clear Feedback:** Users should always know what's happening
- **Error Recovery:** Users should be able to easily recover from mistakes

### Progressive Disclosure
- **Show Essential First:** Display the most important information immediately
- **Details on Demand:** Provide additional details when requested
- **Contextual Help:** Offer help when users need it
- **Smart Defaults:** Set sensible defaults to reduce cognitive load

### Immediate Feedback
- **Visual Feedback:** Provide immediate visual response to user actions
- **Loading States:** Show progress for operations that take time
- **Success Confirmation:** Confirm when actions are completed successfully
- **Error Messages:** Clearly explain what went wrong and how to fix it

### Error Prevention
- **Validation:** Prevent invalid data entry
- **Confirmation:** Ask for confirmation before destructive actions
- **Undo/Redo:** Allow users to reverse their actions
- **Auto-save:** Save work automatically to prevent data loss

---

## Navigation Patterns

### Sidebar Navigation

#### Collapsible Sidebar
```tsx
// Example: Collapsible sidebar with smooth transitions
const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Main navigation"
    >
      <nav role="navigation">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="sidebar-toggle"
        >
          <ChevronIcon direction={isCollapsed ? 'right' : 'left'} />
        </button>
        
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
              >
                <item.icon />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
```

#### Mobile Navigation
```tsx
// Example: Mobile hamburger menu
const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        className="mobile-nav-toggle"
      >
        <HamburgerIcon isOpen={isOpen} />
      </button>
      
      {isOpen && (
        <div className="mobile-nav-overlay">
          <nav className="mobile-nav">
            {/* Navigation items */}
          </nav>
        </div>
      )}
    </>
  );
};
```

### Breadcrumb Navigation

#### Hierarchical Breadcrumbs
```tsx
// Example: Breadcrumb navigation with proper ARIA
const Breadcrumbs = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={item.id} className="breadcrumb-item">
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <>
                <Link to={item.path}>{item.label}</Link>
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
```

### Tab Navigation

#### Accessible Tab Interface
```tsx
// Example: Accessible tab navigation
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tab-container">
      <div role="tablist" aria-label="Navigation tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="tab-panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};
```

### Pagination

#### Accessible Pagination
```tsx
// Example: Accessible pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <nav aria-label="Pagination navigation" className="pagination">
      <ul className="pagination-list">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="pagination-button"
          >
            Previous
          </button>
        </li>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          </li>
        ))}
        
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className="pagination-button"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};
```

---

## Form Interactions

### Input Validation

#### Real-time Validation
```tsx
// Example: Real-time form validation
const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  validation, 
  error 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  
  const showError = hasBlurred && error;
  
  return (
    <div className="form-field">
      <label htmlFor={label} className="form-label">
        {label}
      </label>
      
      <input
        id={label}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setHasBlurred(true);
        }}
        className={`form-input ${showError ? 'error' : ''}`}
        aria-invalid={showError}
        aria-describedby={showError ? `${label}-error` : undefined}
      />
      
      {showError && (
        <div id={`${label}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
```

#### Form Submission with Validation
```tsx
// Example: Form with comprehensive validation
const TeamForm = () => {
  const [formData, setFormData] = useState({
    teamId: '',
    leagueId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.teamId.trim()) {
      newErrors.teamId = 'Team ID is required';
    }
    
    if (!formData.leagueId.trim()) {
      newErrors.leagueId = 'League ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitTeam(formData);
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="team-form">
      <ValidatedInput
        label="Team ID"
        value={formData.teamId}
        onChange={(e) => setFormData({...formData, teamId: e.target.value})}
        error={errors.teamId}
      />
      
      <ValidatedInput
        label="League ID"
        value={formData.leagueId}
        onChange={(e) => setFormData({...formData, leagueId: e.target.value})}
        error={errors.leagueId}
      />
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="submit-button"
      >
        {isSubmitting ? 'Adding Team...' : 'Add Team'}
      </button>
    </form>
  );
};
```

### Auto-save

#### Auto-save Implementation
```tsx
// Example: Auto-save functionality
const useAutoSave = (data, saveFunction, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      
      try {
        await saveFunction(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [data, saveFunction, delay]);
  
  return { isSaving, lastSaved };
};
```

### Progressive Forms

#### Multi-step Form
```tsx
// Example: Progressive multi-step form
const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const steps = [
    { id: 1, title: 'Basic Information', component: BasicInfoStep },
    { id: 2, title: 'Team Details', component: TeamDetailsStep },
    { id: 3, title: 'Confirmation', component: ConfirmationStep }
  ];
  
  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData.component;
  
  return (
    <div className="multi-step-form">
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`step ${currentStep >= step.id ? 'active' : ''}`}
          >
            <span className="step-number">{step.id}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
      
      <div className="step-content">
        <CurrentStepComponent
          data={formData}
          onUpdate={(data) => setFormData({...formData, ...data})}
          onNext={() => setCurrentStep(currentStep + 1)}
          onPrevious={() => setCurrentStep(currentStep - 1)}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === steps.length}
        />
      </div>
    </div>
  );
};
```

---

## Data Interactions

### Filtering

#### Advanced Filtering
```tsx
// Example: Advanced filtering with multiple criteria
const DataFilter = ({ data, onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: null,
    status: 'all',
    category: 'all'
  });
  
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [data, filters]);
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(filteredData);
  };
  
  return (
    <div className="data-filter">
      <div className="filter-row">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="filter-input"
        />
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          <option value="team">Team</option>
          <option value="player">Player</option>
          <option value="match">Match</option>
        </select>
      </div>
      
      <div className="filter-results">
        Showing {filteredData.length} of {data.length} items
      </div>
    </div>
  );
};
```

### Sorting

#### Sortable Table
```tsx
// Example: Sortable data table
const SortableTable = ({ data, columns }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  return (
    <table className="sortable-table">
      <thead>
        <tr>
          {columns.map(column => (
            <th
              key={column.key}
              onClick={() => handleSort(column.key)}
              className={`sortable-header ${sortConfig.key === column.key ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`Sort by ${column.label}`}
            >
              {column.label}
              {sortConfig.key === column.key && (
                <span className="sort-indicator">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, index) => (
          <tr key={index}>
            {columns.map(column => (
              <td key={column.key}>{row[column.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Search

#### Global Search
```tsx
// Example: Global search with suggestions
const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchData = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const results = await searchAPI(searchQuery);
      setSuggestions(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchData(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query, searchData]);
  
  return (
    <div className="global-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search teams, players, matches..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-label="Search"
        />
        
        {isSearching && (
          <div className="search-spinner" aria-hidden="true">
            <Spinner size="small" />
          </div>
        )}
      </div>
      
      {suggestions.length > 0 && (
        <div className="search-suggestions" role="listbox">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="search-suggestion"
              role="option"
              aria-selected="false"
              tabIndex={0}
            >
              <suggestion.icon />
              <span>{suggestion.label}</span>
              <span className="suggestion-type">{suggestion.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Loading States

### Skeleton Loading

#### Skeleton Components
```tsx
// Example: Skeleton loading components
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-subtitle"></div>
    </div>
    <div className="skeleton-content">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="skeleton-table">
    <div className="skeleton-header">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-cell"></div>
      ))}
    </div>
    {Array.from({ length: 5 }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-row">
        {Array.from({ length: 4 }).map((_, cellIndex) => (
          <div key={cellIndex} className="skeleton-cell"></div>
        ))}
      </div>
    ))}
  </div>
);
```

#### Loading States with Content
```tsx
// Example: Loading states that preserve layout
const LoadingState = ({ isLoading, children, skeleton }) => {
  if (isLoading) {
    return skeleton || <SkeletonCard />;
  }
  
  return children;
};

// Usage
const TeamList = () => {
  const { data: teams, isLoading } = useTeams();
  
  return (
    <LoadingState
      isLoading={isLoading}
      skeleton={<SkeletonTable />}
    >
      <div className="team-list">
        {teams.map(team => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </LoadingState>
  );
};
```

### Progress Indicators

#### Linear Progress
```tsx
// Example: Linear progress indicator
const LinearProgress = ({ progress, label }) => (
  <div className="progress-container">
    <div className="progress-header">
      <span className="progress-label">{label}</span>
      <span className="progress-percentage">{Math.round(progress)}%</span>
    </div>
    
    <div className="progress-bar">
      <div 
        className="progress-fill"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  </div>
);
```

#### Circular Progress
```tsx
// Example: Circular progress indicator
const CircularProgress = ({ progress, size = 40 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="progress-background"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-fill"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <span className="progress-text">{Math.round(progress)}%</span>
    </div>
  );
};
```

### Infinite Scroll

#### Infinite Scroll Implementation
```tsx
// Example: Infinite scroll with intersection observer
const InfiniteScroll = ({ items, loadMore, hasMore, isLoading }) => {
  const observerRef = useRef();
  const lastItemRef = useCallback(node => {
    if (isLoading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, loadMore]);
  
  return (
    <div className="infinite-scroll">
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={index === items.length - 1 ? lastItemRef : null}
          className="scroll-item"
        >
          <ItemCard item={item} />
        </div>
      ))}
      
      {isLoading && (
        <div className="loading-indicator">
          <Spinner />
          <span>Loading more items...</span>
        </div>
      )}
    </div>
  );
};
```

---

## Feedback Patterns

### Success Feedback

#### Toast Notifications
```tsx
// Example: Toast notification system
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          <span className="toast-message">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
```

#### Success States
```tsx
// Example: Success state with auto-dismiss
const SuccessState = ({ message, onDismiss, autoDismiss = true }) => {
  useEffect(() => {
    if (autoDismiss) {
      const timeoutId = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [autoDismiss, onDismiss]);
  
  return (
    <div className="success-state" role="alert">
      <CheckIcon className="success-icon" />
      <span className="success-message">{message}</span>
      <button
        onClick={onDismiss}
        className="success-dismiss"
        aria-label="Dismiss success message"
      >
        ×
      </button>
    </div>
  );
};
```

### Error Handling

#### Error Boundaries
```tsx
// Example: Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button
            onClick={() => window.location.reload()}
            className="error-reload-button"
          >
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### Error Messages
```tsx
// Example: User-friendly error messages
const ErrorMessage = ({ error, onRetry }) => {
  const getErrorMessage = (error) => {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'permission':
        return 'You don\'t have permission to perform this action.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };
  
  return (
    <div className="error-message" role="alert">
      <AlertIcon className="error-icon" />
      <div className="error-content">
        <h3>Error</h3>
        <p>{getErrorMessage(error)}</p>
        {onRetry && (
          <button onClick={onRetry} className="error-retry-button">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
```

### Confirmation Dialogs

#### Confirmation Modal
```tsx
// Example: Confirmation dialog with proper focus management
const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const confirmRef = useRef();
  const cancelRef = useRef();
  
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default for safety
      cancelRef.current?.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`confirmation-dialog dialog-${variant}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
        </div>
        
        <div className="dialog-body">
          <p id="dialog-message">{message}</p>
        </div>
        
        <div className="dialog-footer">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="dialog-button dialog-cancel"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`dialog-button dialog-confirm dialog-${variant}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Accessibility Interactions

### Keyboard Navigation

#### Keyboard Shortcuts
```tsx
// Example: Keyboard shortcuts implementation
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Open search
      }
      
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Save current state
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        // Close active modal
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

#### Focus Management
```tsx
// Example: Focus management for modals
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

### Screen Reader Support

#### ARIA Live Regions
```tsx
// Example: ARIA live regions for dynamic content
const LiveRegion = ({ children, type = 'polite' }) => (
  <div 
    aria-live={type}
    aria-atomic="true"
    className="live-region"
  >
    {children}
  </div>
);

// Usage for status updates
const StatusUpdates = () => {
  const [status, setStatus] = useState('');
  
  return (
    <LiveRegion>
      {status && (
        <div className="status-message">
          {status}
        </div>
      )}
    </LiveRegion>
  );
};
```

#### Skip Links
```tsx
// Example: Skip links for keyboard navigation
const SkipLinks = () => (
  <div className="skip-links">
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <a href="#navigation" className="skip-link">
      Skip to navigation
    </a>
    <a href="#footer" className="skip-link">
      Skip to footer
    </a>
  </div>
);
```

---

## Implementation Guidelines

### Performance Considerations
- **Debounce user input** to prevent excessive API calls
- **Use React.memo** for expensive components
- **Implement virtual scrolling** for large lists
- **Optimize bundle size** with code splitting
- **Use intersection observer** for lazy loading

### Accessibility Requirements
- **Keyboard navigation** for all interactive elements
- **Screen reader announcements** for dynamic content
- **Focus management** for modals and dialogs
- **ARIA labels** for complex interactions
- **Color contrast** compliance

### Testing Interactions
- **Unit tests** for interaction logic
- **Integration tests** for user flows
- **Accessibility tests** for screen readers
- **Cross-browser testing** for consistency
- **Performance testing** for responsiveness

---

## Related Documentation

- **[UI Design System](./ui-design-system.md):** Visual design specifications
- **[Frontend Architecture](./architecture/frontend-architecture.md):** Technical implementation details
- **[Accessibility Guidelines](./accessibility-guidelines.md):** WCAG 2.1 compliance requirements
- **[Testing Guide](./development/testing.md):** Testing strategies for interactions

---

This interaction design system ensures consistent, intuitive, and accessible user experiences across the Dota 2 data dashboard application. All interactions should follow these guidelines to maintain usability and accessibility standards. 
import React, { useCallback, useEffect, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'date-range' | 'number-range';
  options?: FilterOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValue {
  [key: string]: string | string[] | { start: string; end: string } | { min: number; max: number };
}

export interface InteractiveFiltersProps {
  filters: FilterConfig[];
  onFiltersChange: (filters: FilterValue) => void;
  debounceMs?: number;
  className?: string;
}

// Text input filter
const TextFilter: React.FC<{
  config: FilterConfig;
  value: string;
  onChange: (value: string) => void;
}> = ({ config, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={config.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {config.label}
    </label>
    <input
      id={config.key}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={config.placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
    />
  </div>
);

// Select filter
const SelectFilter: React.FC<{
  config: FilterConfig;
  value: string;
  onChange: (value: string) => void;
}> = ({ config, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={config.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {config.label}
    </label>
    <select
      id={config.key}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
    >
      <option value="">All {config.label}</option>
      {config.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} {option.count && `(${option.count})`}
        </option>
      ))}
    </select>
  </div>
);

// Multi-select filter
const MultiSelectFilter: React.FC<{
  config: FilterConfig;
  value: string[];
  onChange: (value: string[]) => void;
}> = ({ config, value, onChange }) => {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const legendId = `${config.key}-legend`;

  return (
    <div className="space-y-2">
      <fieldset aria-labelledby={legendId} className="border-0 p-0 m-0">
        <legend id={legendId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </legend>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {config.options?.map((option) => {
            const checkboxId = `${config.key}-option-${option.value}`;
            return (
              <div key={option.value}>
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor={checkboxId} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label} {option.count && `(${option.count})`}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};

// Date range filter
const DateRangeFilter: React.FC<{
  config: FilterConfig;
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
}> = ({ config, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={`${config.key}-start`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {config.label}
    </label>
    <div className="grid grid-cols-2 gap-2">
      <input
        id={`${config.key}-start`}
        type="date"
        value={value.start}
        onChange={(e) => onChange({ ...value, start: e.target.value })}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
      <input
        id={`${config.key}-end`}
        type="date"
        value={value.end}
        onChange={(e) => onChange({ ...value, end: e.target.value })}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
  </div>
);

// Number range filter
const NumberRangeFilter: React.FC<{
  config: FilterConfig;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
}> = ({ config, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={`${config.key}-min`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {config.label}
    </label>
    <div className="grid grid-cols-2 gap-2">
      <input
        id={`${config.key}-min`}
        type="number"
        placeholder="Min"
        value={value.min || ''}
        onChange={(e) => onChange({ ...value, min: e.target.value ? Number(e.target.value) : 0 })}
        min={config.min}
        max={config.max}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
      <input
        id={`${config.key}-max`}
        type="number"
        placeholder="Max"
        value={value.max || ''}
        onChange={(e) => onChange({ ...value, max: e.target.value ? Number(e.target.value) : 0 })}
        min={config.min}
        max={config.max}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
  </div>
);

// Helper function to render text filter
const renderTextFilter = (
  config: FilterConfig,
  value: string,
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => (
  <TextFilter
    config={config}
    value={value || ''}
    onChange={(v) => handleFilterChange(config.key, v)}
  />
);

// Helper function to render select filter
const renderSelectFilter = (
  config: FilterConfig,
  value: string,
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => (
  <SelectFilter
    config={config}
    value={value || ''}
    onChange={(v) => handleFilterChange(config.key, v)}
  />
);

// Helper function to render multi-select filter
const renderMultiSelectFilter = (
  config: FilterConfig,
  value: string[],
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => (
  <MultiSelectFilter
    config={config}
    value={value || []}
    onChange={(v) => handleFilterChange(config.key, v)}
  />
);

// Helper function to render date range filter
const renderDateRangeFilter = (
  config: FilterConfig,
  value: { start: string; end: string },
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => (
  <DateRangeFilter
    config={config}
    value={value || { start: '', end: '' }}
    onChange={(v) => handleFilterChange(config.key, v)}
  />
);

// Helper function to render number range filter
const renderNumberRangeFilter = (
  config: FilterConfig,
  value: { min: number; max: number },
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => (
  <NumberRangeFilter
    config={config}
    value={value || { min: 0, max: 0 }}
    onChange={(v) => handleFilterChange(config.key, v)}
  />
);

// Helper function to render individual filters
const renderFilter = (
  config: FilterConfig,
  filterValues: FilterValue,
  handleFilterChange: (key: string, value: FilterValue[keyof FilterValue]) => void
) => {
  const value = filterValues[config.key];

  switch (config.type) {
    case 'text':
      return renderTextFilter(config, value as string, handleFilterChange);
    case 'select':
      return renderSelectFilter(config, value as string, handleFilterChange);
    case 'multi-select':
      return renderMultiSelectFilter(config, value as string[], handleFilterChange);
    case 'date-range':
      return renderDateRangeFilter(config, value as { start: string; end: string }, handleFilterChange);
    case 'number-range':
      return renderNumberRangeFilter(config, value as { min: number; max: number }, handleFilterChange);
    default:
      return null;
  }
};

export const InteractiveFilters: React.FC<InteractiveFiltersProps> = ({
  filters,
  onFiltersChange,
  debounceMs = 300,
  className = ''
}) => {
  const [filterValues, setFilterValues] = useState<FilterValue>({});
  const [debouncedValues, setDebouncedValues] = useState<FilterValue>({});

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValues(filterValues);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filterValues, debounceMs]);

  // Notify parent of filter changes
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Always call onFiltersChange when filterValues is cleared
    if (Object.keys(debouncedValues).length === 0) {
      onFiltersChange({});
    } else if (Object.keys(debouncedValues).length > 0) {
      onFiltersChange(debouncedValues);
    }
  }, [debouncedValues, onFiltersChange]);

  const handleFilterChange = useCallback((key: string, value: FilterValue[keyof FilterValue]) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const hasActiveFilters = Object.keys(filterValues).length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className={`flex items-center justify-between mb-4 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            {renderFilter(filter, filterValues, handleFilterChange)}
          </div>
        ))}
      </div>
    </div>
  );
}; 
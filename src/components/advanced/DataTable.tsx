import React, { useCallback, useMemo, useState } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  selectable?: boolean;
  pagination?: {
    pageSize: number;
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (sortConfig: SortConfig) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

// Helper function to generate unique row IDs
const getRowId = (row: Record<string, string | number | boolean | null>, index: number): string => {
  return (row as { id?: string; key?: string }).id || 
         (row as { id?: string; key?: string }).key || 
         `row-${index}`;
};

// Helper function to get sort icon path
const getSortIconPath = (isSorted: boolean, direction?: 'asc' | 'desc') => {
  if (isSorted && direction === 'asc') {
    return <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />;
  }
  if (isSorted && direction === 'desc') {
    return <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />;
  }
  return <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />;
};

// Helper function to render sort icon
const renderSortIcon = <_T extends Record<string, string | number | boolean | null>>(
  columnKey: string, 
  sortConfig: SortConfig | null, 
  sortable: boolean, 
  columns: Column<_T>[]
) => {
  if (!sortable || !columns.find(col => col.key === columnKey)?.sortable) return null;

  const isSorted = sortConfig?.key === columnKey;
  const direction = sortConfig?.direction;

  return (
    <svg
      className={`ml-1 h-4 w-4 ${isSorted ? 'text-primary' : 'text-muted-foreground'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      {getSortIconPath(isSorted, direction)}
    </svg>
  );
};

// Helper function to render cell content
const renderCell = <T extends Record<string, string | number | boolean | null>>(
  column: Column<T>, 
  row: T
) => {
  const value = row[column.key];
  
  if (column.render) {
    return column.render(value as T[keyof T], row);
  }
  
  return (
    <div className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-foreground">
      {String(value)}
    </div>
  );
};

// Helper function to render loading state
const renderLoadingState = (className: string) => (
  <div className={`bg-card dark:bg-card shadow rounded-lg ${className}`}>
    <div className="animate-pulse">
      <div className="h-12 bg-muted dark:bg-muted rounded-t-lg"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted dark:bg-muted border-t border-border dark:border-border"></div>
      ))}
    </div>
  </div>
);

// Helper function to render table header
const renderTableHeader = <T extends Record<string, string | number | boolean | null>>(
  columns: Column<T>[],
  selectable: boolean,
  sortable: boolean,
  sortConfig: SortConfig | null,
  selectedRows: Set<string>,
  data: T[],
  handleSort: (key: string) => void,
  handleSelectAll: () => void
) => (
  <thead className="bg-muted dark:bg-muted">
    <tr>
      {selectable && (
        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
          <input
            type="checkbox"
            checked={selectedRows.size === data.length && data.length > 0}
            onChange={handleSelectAll}
            className="rounded border-border text-primary focus:ring-primary dark:border-border dark:bg-muted"
          />
        </th>
      )}
      {columns.map((column) => (
        <th
          key={column.key}
          className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider ${
            column.sortable && sortable ? 'cursor-pointer hover:bg-muted/80 dark:hover:bg-muted/80' : ''
          }`}
          onClick={() => column.sortable && sortable && handleSort(column.key)}
          style={{ width: column.width }}
        >
          <div className="flex items-center">
            {column.label}
            {renderSortIcon(column.key, sortConfig, sortable, columns)}
          </div>
        </th>
      ))}
    </tr>
  </thead>
);

// Helper function to render table body
const renderTableBody = <T extends Record<string, string | number | boolean | null>>(
  paginatedData: T[],
  columns: Column<T>[],
  selectable: boolean,
  selectedRows: Set<string>,
  handleRowSelect: (row: T) => void,
  emptyMessage: string
) => (
  <tbody className="bg-card dark:bg-card divide-y divide-border dark:divide-border">
    {paginatedData.length === 0 ? (
      <tr>
        <td
          colSpan={columns.length + (selectable ? 1 : 0)}
          className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-muted-foreground"
        >
          {emptyMessage}
        </td>
      </tr>
    ) : (
      paginatedData.map((row, rowIndex) => {
        const rowId = getRowId(row, rowIndex);
        const isSelected = selectedRows.has(rowId);

        return (
          <tr
            key={rowId}
            className={`${
              isSelected
                ? 'bg-accent dark:bg-accent'
                : 'hover:bg-accent dark:hover:bg-accent'
            } transition-colors`}
          >
            {selectable && (
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRowSelect(row)}
                  className="rounded border-border text-primary focus:ring-primary dark:border-border dark:bg-card"
                />
              </td>
            )}
            {columns.map((column) => (
              <td key={column.key} className="whitespace-nowrap">
                {renderCell(column, row)}
              </td>
            ))}
          </tr>
        );
      })
    )}
  </tbody>
);

// Helper function to render pagination
const renderPagination = (pagination: NonNullable<DataTableProps<Record<string, string | number | boolean | null>>['pagination']>) => (
  <div className="bg-card dark:bg-card px-4 py-3 flex items-center justify-between border-t border-border dark:border-border sm:px-6">
    <div className="flex-1 flex justify-between sm:hidden">
      <button
        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
        className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:text-foreground dark:border-border dark:hover:bg-accent"
      >
        Previous
      </button>
      <button
        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage * pagination.pageSize >= pagination.totalItems}
        className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:text-foreground dark:border-border dark:hover:bg-accent"
      >
        Next
      </button>
    </div>
    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Showing{' '}
          <span className="font-medium">
            {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
          </span>{' '}
          of{' '}
          <span className="font-medium">{pagination.totalItems}</span> results
        </p>
      </div>
      <div>
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:text-muted-foreground dark:border-border dark:hover:bg-accent"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage * pagination.pageSize >= pagination.totalItems}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:text-muted-foreground dark:border-border dark:hover:bg-accent"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
);

export const DataTable = <T extends Record<string, string | number | boolean | null>>({
  data,
  columns,
  sortable = true,
  selectable = false,
  pagination,
  onSort,
  onSelectionChange,
  className = '',
  emptyMessage = 'No data available',
  loading = false
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    const newDirection: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig: SortConfig = { key, direction: newDirection };
    
    setSortConfig(newSortConfig);
    onSort?.(newSortConfig);
  }, [sortable, sortConfig, onSort]);

  // Handle row selection
  const handleRowSelect = useCallback((row: T) => {
    const rowId = getRowId(row, 0);
    const newSelectedRows = new Set(selectedRows);
    
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    
    setSelectedRows(newSelectedRows);
    
    const selectedData = data.filter(item => newSelectedRows.has(getRowId(item, 0)));
    onSelectionChange?.(selectedData);
  }, [selectedRows, data, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allRowIds = new Set(data.map((row, index) => getRowId(row, index)));
      setSelectedRows(allRowIds);
      onSelectionChange?.(data);
    }
  }, [selectedRows.size, data, onSelectionChange]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      // Safe comparison for all allowed types
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr < bStr ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination]);

  if (loading) {
    return renderLoadingState(className);
  }

  return (
    <div className={`bg-card dark:bg-card shadow rounded-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          {renderTableHeader(columns, selectable, sortable, sortConfig, selectedRows, data, handleSort, handleSelectAll)}
          {renderTableBody(paginatedData, columns, selectable, selectedRows, handleRowSelect, emptyMessage)}
        </table>
      </div>

      {/* Pagination */}
      {pagination && renderPagination(pagination)}
    </div>
  );
}; 
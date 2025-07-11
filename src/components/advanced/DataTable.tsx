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
      className={`ml-1 h-4 w-4 ${isSorted ? 'text-blue-600' : 'text-gray-400'}`}
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
    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
      {String(value)}
    </div>
  );
};

// Helper function to render loading state
const renderLoadingState = (className: string) => (
  <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"></div>
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
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      {selectable && (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          <input
            type="checkbox"
            checked={selectedRows.size === data.length && data.length > 0}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </th>
      )}
      {columns.map((column) => (
        <th
          key={column.key}
          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
            column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
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
  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    {paginatedData.length === 0 ? (
      <tr>
        <td
          colSpan={columns.length + (selectable ? 1 : 0)}
          className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
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
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            } transition-colors`}
          >
            {selectable && (
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRowSelect(row)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
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
  <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
    <div className="flex-1 flex justify-between sm:hidden">
      <button
        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        Previous
      </button>
      <button
        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage * pagination.pageSize >= pagination.totalItems}
        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        Next
      </button>
    </div>
    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
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
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage * pagination.pageSize >= pagination.totalItems}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {renderTableHeader(columns, selectable, sortable, sortConfig, selectedRows, data, handleSort, handleSelectAll)}
          {renderTableBody(paginatedData, columns, selectable, selectedRows, handleRowSelect, emptyMessage)}
        </table>
      </div>

      {/* Pagination */}
      {pagination && renderPagination(pagination)}
    </div>
  );
}; 
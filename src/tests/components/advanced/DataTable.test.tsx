import { fireEvent, render, screen } from '@testing-library/react';

import { DataTable, type Column } from '@/components/advanced/DataTable';

// Use Record<string, string | number | boolean | null> for test data
const mockData: Record<string, string | number | boolean | null>[] = [
  { id: '1', name: 'Alice', score: 95, status: 'Active', date: '2024-01-01' },
  { id: '2', name: 'Bob', score: 87, status: 'Inactive', date: '2024-01-02' },
  { id: '3', name: 'Charlie', score: 92, status: 'Active', date: '2024-01-03' },
  { id: '4', name: 'Diana', score: 78, status: 'Active', date: '2024-01-04' }
];

const mockColumns: Column<Record<string, string | number | boolean | null>>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'score', label: 'Score', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'date', label: 'Date', sortable: true }
];

describe('DataTable', () => {
  const mockOnSort = jest.fn();
  const mockOnSelectionChange = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render table with data and columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Diana')).toBeInTheDocument();
    });

    it('should render empty message when no data', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No data found"
        />
      );

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          className="custom-table"
        />
      );

      const tableContainer = screen.getByText('Name').closest('.bg-white');
      expect(tableContainer).toHaveClass('custom-table');
    });
  });

  describe('Sorting', () => {
    it('should render sort icons for sortable columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={true}
        />
      );

      const sortableHeaders = screen.getAllByRole('columnheader').filter(header => 
        header.textContent?.includes('Name') || 
        header.textContent?.includes('Score') || 
        header.textContent?.includes('Date')
      );

      sortableHeaders.forEach(header => {
        const svg = header.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should not render sort icons for non-sortable columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={true}
        />
      );

      const statusHeader = screen.getByText('Status').closest('th');
      const svg = statusHeader?.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('should call onSort when sortable column header is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={true}
          onSort={mockOnSort}
        />
      );

      fireEvent.click(screen.getByText('Name'));

      expect(mockOnSort).toHaveBeenCalledWith({
        key: 'name',
        direction: 'asc'
      });
    });

    it('should toggle sort direction on repeated clicks', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={true}
          onSort={mockOnSort}
        />
      );

      const nameHeader = screen.getByText('Name');

      // First click - ascending
      fireEvent.click(nameHeader);
      expect(mockOnSort).toHaveBeenCalledWith({
        key: 'name',
        direction: 'asc'
      });

      // Second click - descending
      fireEvent.click(nameHeader);
      expect(mockOnSort).toHaveBeenCalledWith({
        key: 'name',
        direction: 'desc'
      });
    });

    it('should not call onSort when sorting is disabled', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={false}
          onSort={mockOnSort}
        />
      );

      fireEvent.click(screen.getByText('Name'));

      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('Row Selection', () => {
    it('should render checkboxes when selectable is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockData.length + 1); // +1 for select all checkbox
    });

    it('should not render checkboxes when selectable is false', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={false}
        />
      );

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should call onSelectionChange when row is selected', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // Skip select all checkbox
      fireEvent.click(rowCheckboxes[0]);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([mockData[0]]);
    });

    it('should call onSelectionChange when select all is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(mockData);
    });

    it('should highlight selected rows', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
      fireEvent.click(rowCheckboxes[0]);

      const selectedRow = screen.getByText('Alice').closest('tr');
      expect(selectedRow).toHaveClass('bg-blue-50');
    });
  });

  describe('Pagination', () => {
    const mockPagination = {
      pageSize: 2,
      currentPage: 1,
      totalItems: mockData.length,
      onPageChange: mockOnPageChange
    };

    it('should render pagination when provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      );

      // Select the desktop Previous and Next buttons (with sr-only span)
      const previousButtons = screen.getAllByRole('button', { name: /previous/i });
      const desktopPreviousButton = previousButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      expect(desktopPreviousButton).toBeInTheDocument();

      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      const desktopNextButton = nextButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      expect(desktopNextButton).toBeInTheDocument();

      // Check for the correct pagination text in the paragraph element
      const paginationText = screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Showing 1 to 2 of 4 results') || false;
      });
      expect(paginationText).toBeInTheDocument();
    });

    it('should not render pagination when not provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should call onPageChange when next button is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      );

      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      // Select the desktop version (the one with sr-only span)
      const desktopNextButton = nextButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      fireEvent.click(desktopNextButton!);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when previous button is clicked', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            ...mockPagination,
            currentPage: 2
          }}
        />
      );

      const previousButtons = screen.getAllByRole('button', { name: /previous/i });
      // Select the desktop version (the one with sr-only span)
      const desktopPreviousButton = previousButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      fireEvent.click(desktopPreviousButton!);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should disable previous button on first page', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      );

      const previousButtons = screen.getAllByRole('button', { name: /previous/i });
      // Select the desktop version (the one with sr-only span)
      const desktopPreviousButton = previousButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      expect(desktopPreviousButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            ...mockPagination,
            currentPage: 2
          }}
        />
      );

      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      // Select the desktop version (the one with sr-only span)
      const desktopNextButton = nextButtons.find(button => 
        button.querySelector('span[class*="sr-only"]')
      );
      expect(desktopNextButton).toBeDisabled();
    });

    it('should show correct page information', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            ...mockPagination,
            currentPage: 2
          }}
        />
      );

      // Find the paragraph element containing the pagination text
      const paginationText = screen.getByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.includes('Showing 3 to 4 of 4 results') || false;
      });
      expect(paginationText).toBeInTheDocument();
    });

    it('should render loading skeleton when loading is true', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          loading={true}
        />
      );

      // Table should not be present
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      // Check for skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Column Rendering', () => {
    const columnsWithRender: Column<Record<string, string | number | boolean | null>>[] = [
      { key: 'name', label: 'Name', sortable: true },
      { 
        key: 'score', 
        label: 'Score', 
        sortable: true,
        render: (value) => <span data-testid="custom-score">{String(value)}/100</span>
      },
      { key: 'status', label: 'Status', sortable: false }
    ];

    it('should use custom render function when provided', () => {
      render(
        <DataTable
          data={mockData}
          columns={columnsWithRender}
        />
      );

      expect(screen.getAllByTestId('custom-score')).toHaveLength(mockData.length);
      expect(screen.getByText('95/100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(mockColumns.length);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(mockData.length + 1); // +1 for header row
    });

    it('should have proper sort button accessibility', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          sortable={true}
        />
      );

      const sortableHeaders = screen.getAllByRole('columnheader').filter(header => 
        header.textContent?.includes('Name') || 
        header.textContent?.includes('Score') || 
        header.textContent?.includes('Date')
      );

      sortableHeaders.forEach(header => {
        expect(header).toHaveClass('cursor-pointer');
      });
    });

    it('should have proper checkbox accessibility', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have overflow container for horizontal scrolling', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const overflowContainer = screen.getByText('Name').closest('.overflow-x-auto');
      expect(overflowContainer).toBeInTheDocument();
    });
  });

  describe('Column Width', () => {
    const columnsWithWidth: Column<Record<string, string | number | boolean | null>>[] = [
      { key: 'name', label: 'Name', sortable: true, width: '200px' },
      { key: 'score', label: 'Score', sortable: true },
      { key: 'status', label: 'Status', sortable: false }
    ];

    it('should apply custom width to columns', () => {
      render(
        <DataTable
          data={mockData}
          columns={columnsWithWidth}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toHaveStyle({ width: '200px' });
    });
  });
}); 
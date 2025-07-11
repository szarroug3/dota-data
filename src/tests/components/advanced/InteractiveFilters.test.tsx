import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { InteractiveFilters, type FilterConfig } from '@/components/advanced/InteractiveFilters';

const mockFilters: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search matches...'
  },
  {
    key: 'hero',
    label: 'Hero',
    type: 'select',
    options: [
      { value: 'axe', label: 'Axe', count: 5 },
      { value: 'crystal-maiden', label: 'Crystal Maiden', count: 3 },
      { value: 'invoker', label: 'Invoker', count: 8 }
    ]
  },
  {
    key: 'roles',
    label: 'Roles',
    type: 'multi-select',
    options: [
      { value: 'carry', label: 'Carry' },
      { value: 'support', label: 'Support' },
      { value: 'mid', label: 'Mid' }
    ]
  },
  {
    key: 'date-range',
    label: 'Date Range',
    type: 'date-range'
  },
  {
    key: 'score-range',
    label: 'Score Range',
    type: 'number-range',
    min: 0,
    max: 100
  }
];

describe('InteractiveFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Filter', () => {
    it('should render text input filter', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search matches...')).toBeInTheDocument();
    });

    it('should handle text input changes with debouncing', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
          debounceMs={100}
        />
      );

      const input = screen.getByLabelText('Search');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not call immediately due to debouncing
      expect(mockOnFiltersChange).not.toHaveBeenCalled();

      // Should call after debounce delay
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'test' });
      }, { timeout: 200 });
    });
  });

  describe('Select Filter', () => {
    it('should render select filter with options', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[1]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Hero')).toBeInTheDocument();
      expect(screen.getByText('All Hero')).toBeInTheDocument();
      expect(screen.getByText('Axe (5)')).toBeInTheDocument();
      expect(screen.getByText('Crystal Maiden (3)')).toBeInTheDocument();
      expect(screen.getByText('Invoker (8)')).toBeInTheDocument();
    });

    it('should handle select changes', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[1]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const select = screen.getByLabelText('Hero');
      fireEvent.change(select, { target: { value: 'axe' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ hero: 'axe' });
      });
    });
  });

  describe('Multi-Select Filter', () => {
    it('should render multi-select filter with checkboxes', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[2]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Roles')).toBeInTheDocument();
      expect(screen.getByLabelText('Carry')).toBeInTheDocument();
      expect(screen.getByLabelText('Support')).toBeInTheDocument();
      expect(screen.getByLabelText('Mid')).toBeInTheDocument();
    });

    it('should handle multi-select changes', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[2]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const carryCheckbox = screen.getByLabelText('Carry');
      const supportCheckbox = screen.getByLabelText('Support');

      fireEvent.click(carryCheckbox);
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ roles: ['carry'] });
      });

      fireEvent.click(supportCheckbox);
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ roles: ['carry', 'support'] });
      });
    });

    it('should handle unchecking multi-select options', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[2]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const carryCheckbox = screen.getByLabelText('Carry');
      const supportCheckbox = screen.getByLabelText('Support');

      // Check both
      fireEvent.click(carryCheckbox);
      fireEvent.click(supportCheckbox);

      // Uncheck one
      fireEvent.click(carryCheckbox);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ roles: ['support'] });
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should render date range inputs', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[3]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
      const dateInputs = screen.getAllByDisplayValue('');
      expect(dateInputs).toHaveLength(2);
    });

    it('should handle date range changes', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[3]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const dateInputs = screen.getAllByDisplayValue('');
      fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
      fireEvent.change(dateInputs[1], { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          'date-range': { start: '2024-01-01', end: '2024-01-31' }
        });
      });
    });
  });

  describe('Number Range Filter', () => {
    it('should render number range inputs', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[4]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Score Range')).toBeInTheDocument();
      const minInput = screen.getByPlaceholderText('Min');
      const maxInput = screen.getByPlaceholderText('Max');
      expect(minInput).toBeInTheDocument();
      expect(maxInput).toBeInTheDocument();
    });

    it('should handle number range changes', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[4]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minInput = screen.getByPlaceholderText('Min');
      const maxInput = screen.getByPlaceholderText('Max');
      fireEvent.change(minInput, { target: { value: '10' } });
      fireEvent.change(maxInput, { target: { value: '90' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          'score-range': { min: 10, max: 90 }
        });
      });
    });
  });

  describe('Clear All Filters', () => {
    it('should show clear all button when filters are active', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const input = screen.getByLabelText('Search');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });
    });

    it('should not show clear all button when no filters are active', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should clear all filters when clear all button is clicked', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const input = screen.getByLabelText('Search');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Multiple Filters', () => {
    it('should render multiple filters in a grid', () => {
      render(
        <InteractiveFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Hero')).toBeInTheDocument();
      expect(screen.getByLabelText('Roles')).toBeInTheDocument();
      expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
      expect(screen.getByLabelText('Score Range')).toBeInTheDocument();
    });

    it('should combine multiple filter values', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0], mockFilters[1]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByLabelText('Search');
      const heroSelect = screen.getByLabelText('Hero');

      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(heroSelect, { target: { value: 'axe' } });

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          search: 'test',
          hero: 'axe'
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all filter types', () => {
      render(
        <InteractiveFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Hero')).toBeInTheDocument();
      expect(screen.getByLabelText('Roles')).toBeInTheDocument();
      expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
      expect(screen.getByLabelText('Score Range')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for checkboxes', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[2]]}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });
  });

  describe('Custom Debounce', () => {
    it('should use custom debounce time', async () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
          debounceMs={500}
        />
      );

      const input = screen.getByLabelText('Search');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not call immediately
      expect(mockOnFiltersChange).not.toHaveBeenCalled();

      // Should call after custom debounce delay
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'test' });
      }, { timeout: 600 });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <InteractiveFilters
          filters={[mockFilters[0]]}
          onFiltersChange={mockOnFiltersChange}
          className="custom-filters"
        />
      );

      const container = screen.getByText('Filters').closest('div');
      expect(container).toHaveClass('custom-filters');
    });
  });
}); 
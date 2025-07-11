import { render, screen } from '@testing-library/react';

import { DataVisualization, type BarChartData, type LineChartData, type PieChartData } from '@/components/advanced/DataVisualization';

const mockLineData: LineChartData = {
  title: 'Performance Over Time',
  data: [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
    { label: 'Mar', value: 15 },
    { label: 'Apr', value: 25 }
  ]
};

const mockBarData: BarChartData = {
  title: 'Hero Usage',
  data: [
    { label: 'Hero A', value: 30 },
    { label: 'Hero B', value: 45 },
    { label: 'Hero C', value: 25 }
  ]
};

const mockPieData: PieChartData = {
  title: 'Win Rate Distribution',
  data: [
    { label: 'Wins', value: 60, color: '#10B981' },
    { label: 'Losses', value: 40, color: '#EF4444' }
  ]
};

describe('DataVisualization', () => {
  describe('Line Chart', () => {
    it('should render line chart with correct title', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByText('Performance Over Time')).toBeInTheDocument();
    });

    it('should render line chart with data points', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={300}
          width={400}
        />
      );

      // Check for SVG elements
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'line chart showing Performance Over Time');
    });

    it('should apply custom className', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={300}
          width={400}
          className="custom-class"
        />
      );

      const container = screen.getByRole('img');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Bar Chart', () => {
    it('should render bar chart with correct title', () => {
      render(
        <DataVisualization
          type="bar"
          data={mockBarData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByText('Hero Usage')).toBeInTheDocument();
    });

    it('should render bar chart with data labels', () => {
      render(
        <DataVisualization
          type="bar"
          data={mockBarData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByText('Hero A')).toBeInTheDocument();
      expect(screen.getByText('Hero B')).toBeInTheDocument();
      expect(screen.getByText('Hero C')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <DataVisualization
          type="bar"
          data={mockBarData}
          height={300}
          width={400}
        />
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute('aria-label', 'bar chart showing Hero Usage');
    });
  });

  describe('Pie Chart', () => {
    it('should render pie chart with correct title', () => {
      render(
        <DataVisualization
          type="pie"
          data={mockPieData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByText('Win Rate Distribution')).toBeInTheDocument();
    });

    it('should render pie chart with percentage labels', () => {
      render(
        <DataVisualization
          type="pie"
          data={mockPieData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByText(/Wins \(60\.0%\)/)).toBeInTheDocument();
      expect(screen.getByText(/Losses \(40\.0%\)/)).toBeInTheDocument();
    });

    it('should use custom colors when provided', () => {
      render(
        <DataVisualization
          type="pie"
          data={mockPieData}
          height={300}
          width={400}
        />
      );

      const svg = screen.getByRole('img').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all chart types', () => {
      const { rerender } = render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'line chart showing Performance Over Time');

      rerender(
        <DataVisualization
          type="bar"
          data={mockBarData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'bar chart showing Hero Usage');

      rerender(
        <DataVisualization
          type="pie"
          data={mockPieData}
          height={300}
          width={400}
        />
      );

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'pie chart showing Win Rate Distribution');
    });
  });

  describe('Responsive Design', () => {
    it('should apply default dimensions when not provided', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
        />
      );

      const svg = screen.getByRole('img').querySelector('svg');
      expect(svg).toHaveAttribute('width', '400');
      expect(svg).toHaveAttribute('height', '300');
    });

    it('should apply custom dimensions when provided', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={500}
          width={600}
        />
      );

      const svg = screen.getByRole('img').querySelector('svg');
      expect(svg).toHaveAttribute('width', '600');
      expect(svg).toHaveAttribute('height', '500');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      render(
        <DataVisualization
          type="line"
          data={mockLineData}
          height={300}
          width={400}
        />
      );

      const container = screen.getByRole('img');
      expect(container).toHaveClass('dark:bg-gray-800');
    });
  });
}); 
import { render, screen } from '@testing-library/react';

import { DateDuration } from '@/components/match-history/list/DateDuration';

function getDateRegex(dateString: string) {
  // Accepts the expected date, the day before, and the day after (for timezone differences)
  const date = new Date(dateString);
  const prev = new Date(date); prev.setDate(date.getDate() - 1);
  const next = new Date(date); next.setDate(date.getDate() + 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = date.getFullYear();
  const regexes = [date, prev, next].map(d => {
    const m = months[d.getMonth()];
    return new RegExp(`${m} \\d{1,2}, ${year}`);
  });
  return regexes;
}

describe('DateDuration', () => {
  it('renders without crashing', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // Check that the component renders (text might be split across multiple elements)
    const dateElements = screen.getAllByText(/Nov \d+, 2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('renders with default props', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // Check that the container has the correct classes
    const container = document.querySelector('[class*="text-sm text-muted-foreground truncate"]');
    expect(container).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // Check that date is formatted as expected (using regex to account for timezone differences)
    const dateElements = screen.getAllByText(/Nov \d+, 2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('formats duration correctly', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // 3120 seconds = 52:00
    const durationElements = screen.getAllByText(/52:00/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  it('handles different duration values', () => {
    render(<DateDuration date="2024-11-25" duration={2400} />);
    
    // 2400 seconds = 40:00
    const durationElements = screen.getAllByText(/40:00/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  it('handles zero duration', () => {
    render(<DateDuration date="2024-11-25" duration={0} />);
    
    // 0 seconds = 0:00
    const durationElements = screen.getAllByText(/0:00/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  it('handles duration with seconds', () => {
    render(<DateDuration date="2024-11-25" duration={3661} />);
    
    // 3661 seconds = 61:01
    const durationElements = screen.getAllByText(/61:01/);
    expect(durationElements.length).toBeGreaterThan(0);
  });

  it('renders with custom breakpoints', () => {
    const customBreakpoints = {
      showDateAndDuration: '400px',
      showDateOnly: '350px',
      showDateOnlySmall: '300px',
      showDateOnlyVerySmall: '300px'
    };
    
    render(
      <DateDuration 
        date="2024-11-25" 
        duration={3120} 
        breakpoints={customBreakpoints}
      />
    );
    
    // Check that the component renders without errors
    const dateElements = screen.getAllByText(/Nov \d+, 2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('renders with custom className', () => {
    const { container } = render(
      <DateDuration date="2024-11-25" duration={3120} className="custom-class" />
    );
    
    const dateDurationContainer = container.firstChild;
    expect(dateDurationContainer).toHaveClass('custom-class');
  });

  it('handles different date formats', () => {
    render(<DateDuration date="2024-12-01" duration={3120} />);
    // Accept Dec 1, 2024 or Nov 30, 2024 or Dec 2, 2024
    const regexes = getDateRegex('2024-12-01');
    const found = regexes.some(r => screen.queryAllByText(r).length > 0);
    expect(found).toBe(true);
  });

  it('handles edge case dates', () => {
    render(<DateDuration date="2024-01-01" duration={3120} />);
    // Accept Jan 1, 2024 or Dec 31, 2023 or Jan 2, 2024
    const regexes = getDateRegex('2024-01-01');
    const found = regexes.some(r => screen.queryAllByText(r).length > 0);
    expect(found).toBe(true);
  });

  it('applies truncate class', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // Check that the container has truncate class
    const container = document.querySelector('[class*="truncate"]');
    expect(container).toBeInTheDocument();
  });

  it('applies correct text styling', () => {
    render(<DateDuration date="2024-11-25" duration={3120} />);
    
    // Check that the container has text-sm and text-muted-foreground classes
    const container = document.querySelector('[class*="text-sm text-muted-foreground"]');
    expect(container).toBeInTheDocument();
  });

  describe('Responsive behavior', () => {
    it('renders container queries for responsive design', () => {
      render(<DateDuration date="2024-11-25" duration={3120} />);
      
      // Check that container queries are applied
      const responsiveSpans = document.querySelectorAll('[class*="@[350px]"]');
      expect(responsiveSpans.length).toBeGreaterThan(0);
    });

    it('handles different container sizes gracefully', () => {
      render(<DateDuration date="2024-11-25" duration={3120} />);
      
      // The component should render without errors regardless of container size
      const dateElements = screen.getAllByText(/Nov \d+, 2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('renders multiple responsive spans', () => {
      render(<DateDuration date="2024-11-25" duration={3120} />);
      
      // Should have multiple spans for different breakpoints
      const spans = document.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(1);
    });
  });

  describe('Date formatting', () => {
    it('formats various months correctly', () => {
      const testCases = [
        { date: '2024-01-15', expected: /Jan \d+, 2024/ },
        { date: '2024-06-20', expected: /Jun \d+, 2024/ },
        { date: '2024-12-31', expected: /Dec \d+, 2024/ }
      ];

      testCases.forEach(({ date, expected }) => {
        const { unmount } = render(<DateDuration date={date} duration={3120} />);
        const dateElements = screen.getAllByText(expected);
        expect(dateElements.length).toBeGreaterThan(0);
        unmount();
      });
    });
  });

  describe('Duration formatting', () => {
    it('formats various durations correctly', () => {
      const testCases = [
        { duration: 0, expected: /0:00/ },
        { duration: 59, expected: /0:59/ },
        { duration: 60, expected: /1:00/ },
        { duration: 3599, expected: /59:59/ },
        { duration: 3600, expected: /60:00/ },
        { duration: 3661, expected: /61:01/ }
      ];

      testCases.forEach(({ duration, expected }) => {
        const { unmount } = render(<DateDuration date="2024-11-25" duration={duration} />);
        const durationElements = screen.getAllByText(expected);
        expect(durationElements.length).toBeGreaterThan(0);
        unmount();
      });
    });
  });
}); 
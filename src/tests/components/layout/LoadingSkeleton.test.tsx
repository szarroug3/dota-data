import { render } from '@testing-library/react';

import {
    AvatarSkeleton,
    CardSkeleton,
    ListSkeleton,
    LoadingSkeleton,
    TableSkeleton
} from '@/components/layout/LoadingSkeleton';

// Helper function to get skeleton elements
const getSkeletonElements = () => {
  return document.querySelectorAll('.animate-pulse');
};

// Helper function to get skeleton lines
const getSkeletonLines = () => {
  return document.querySelectorAll('.animate-pulse');
};

// Helper function to get skeleton rows
const getSkeletonRows = () => {
  return document.querySelectorAll('.flex.space-x-4');
};

describe('LoadingSkeleton - Text and Card', () => {
  describe('Text skeleton', () => {
    it('should render text skeleton with default props', () => {
      render(<LoadingSkeleton />);
      
      const skeletonLines = getSkeletonLines();
      expect(skeletonLines).toHaveLength(3);
    });

    it('should render text skeleton with custom lines', () => {
      render(<LoadingSkeleton type="text" lines={5} />);
      
      const skeletonLines = getSkeletonLines();
      expect(skeletonLines).toHaveLength(5);
    });

    it('should apply custom className', () => {
      render(<LoadingSkeleton className="custom-class" />);
      
      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Card skeleton', () => {
    it('should render card skeleton', () => {
      render(<LoadingSkeleton type="card" />);
      
      const cardContainer = document.querySelector('.bg-white');
      expect(cardContainer).toBeInTheDocument();
      expect(cardContainer).toHaveClass('rounded-lg', 'border', 'p-4');
    });

    it('should render CardSkeleton component', () => {
      render(<CardSkeleton />);
      
      const cardContainer = document.querySelector('.bg-white');
      expect(cardContainer).toBeInTheDocument();
    });
  });
});

describe('LoadingSkeleton - List and Table', () => {
  describe('List skeleton', () => {
    it('should render list skeleton with default lines', () => {
      render(<LoadingSkeleton type="list" />);
      
      const listContainer = document.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();
      
      const skeletonLines = getSkeletonLines();
      expect(skeletonLines).toHaveLength(3);
    });

    it('should render list skeleton with custom lines', () => {
      render(<LoadingSkeleton type="list" lines={7} />);
      
      const skeletonLines = getSkeletonLines();
      expect(skeletonLines).toHaveLength(7);
    });

    it('should render ListSkeleton component', () => {
      render(<ListSkeleton lines={4} />);
      
      const skeletonLines = getSkeletonLines();
      expect(skeletonLines).toHaveLength(4);
    });
  });

  describe('Table skeleton', () => {
    it('should render table skeleton with default lines', () => {
      render(<LoadingSkeleton type="table" />);
      
      const tableContainer = document.querySelector('.space-y-2');
      expect(tableContainer).toBeInTheDocument();
      
      const skeletonRows = getSkeletonRows();
      expect(skeletonRows).toHaveLength(3);
    });

    it('should render table skeleton with custom lines', () => {
      render(<LoadingSkeleton type="table" lines={5} />);
      
      const skeletonRows = getSkeletonRows();
      expect(skeletonRows).toHaveLength(5);
    });

    it('should render TableSkeleton component', () => {
      render(<TableSkeleton lines={6} />);
      
      const skeletonRows = getSkeletonRows();
      expect(skeletonRows).toHaveLength(6);
    });
  });
});

describe('LoadingSkeleton - Avatar and Styling', () => {
  describe('Avatar skeleton', () => {
    it('should render avatar skeleton', () => {
      render(<LoadingSkeleton type="avatar" />);
      
      const avatarContainer = document.querySelector('.animate-pulse');
      expect(avatarContainer).toBeInTheDocument();
      
      const avatarCircle = document.querySelector('.rounded-full');
      expect(avatarCircle).toBeInTheDocument();
      expect(avatarCircle).toHaveClass('h-10', 'w-10');
    });

    it('should render AvatarSkeleton component', () => {
      render(<AvatarSkeleton />);
      
      const avatarCircle = document.querySelector('.rounded-full');
      expect(avatarCircle).toBeInTheDocument();
    });
  });

  describe('Dark mode support', () => {
    it('should render with dark mode classes', () => {
      render(<LoadingSkeleton type="card" />);
      
      const cardContainer = document.querySelector('.bg-white');
      expect(cardContainer).toHaveClass('dark:bg-gray-800');
    });

    it('should render skeleton elements with dark mode classes', () => {
      render(<LoadingSkeleton type="text" />);
      
      const skeletonElements = document.querySelectorAll('.bg-gray-200');
      skeletonElements.forEach(element => {
        expect(element).toHaveClass('dark:bg-gray-700');
      });
    });
  });

  describe('Animation classes', () => {
    it('should have animate-pulse class', () => {
      render(<LoadingSkeleton />);
      
      const animatedElements = getSkeletonElements();
      expect(animatedElements.length).toBeGreaterThan(0);
      
      animatedElements.forEach(element => {
        expect(element).toHaveClass('animate-pulse');
      });
    });
  });
});

describe('LoadingSkeleton - Accessibility', () => {
  it('should not have any interactive elements', () => {
    render(<LoadingSkeleton />);
    
    const buttons = document.querySelectorAll('button');
    const links = document.querySelectorAll('a');
    const inputs = document.querySelectorAll('input');
    
    expect(buttons).toHaveLength(0);
    expect(links).toHaveLength(0);
    expect(inputs).toHaveLength(0);
  });

  it('should not have any text content that could be read by screen readers', () => {
    render(<LoadingSkeleton />);
    
    const textContent = document.querySelector('.animate-pulse')?.textContent;
    expect(textContent).toBe('');
  });
}); 
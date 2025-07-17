/**
 * @jest-environment jsdom
 */

import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should combine class names correctly', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    );
    expect(result).toBe('base-class active');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3', ['class4', 'class5']);
    expect(result).toBe('class1 class2 class3 class4 class5');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'base-class': true,
      'active': true,
      'disabled': false,
      'hidden': false
    });
    expect(result).toBe('base-class active');
  });

  it('should handle mixed input types', () => {
    const isActive = true;
    const result = cn(
      'base-class',
      ['class1', 'class2'],
      isActive && 'active',
      { 'conditional': true, 'hidden': false }
    );
    expect(result).toBe('base-class class1 class2 active conditional');
  });

  it('should handle empty inputs', () => {
    const result = cn('', null, undefined, false);
    expect(result).toBe('');
  });

  it('should handle Tailwind classes correctly', () => {
    const result = cn(
      'px-4 py-2',
      'bg-blue-500 hover:bg-blue-600',
      'text-white font-bold'
    );
    expect(result).toBe('px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold');
  });

  it('should handle complex conditional logic', () => {
    const result = cn(
      'btn',
      {
        'btn-primary': true,
        'btn-secondary': false,
        'btn-large': true,
        'btn-small': false
      }
    );
    expect(result).toBe('btn btn-primary btn-large');
  });
}); 
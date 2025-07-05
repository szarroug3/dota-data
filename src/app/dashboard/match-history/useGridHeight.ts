import { useEffect, useRef, useState } from 'react';

export function useGridHeight(selectedMatch: string | null): [number, React.RefObject<HTMLDivElement | null>] {
  const DEFAULT_GRID_HEIGHT = 600;
  const [gridHeight, setGridHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('matchHistoryGridHeight');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return DEFAULT_GRID_HEIGHT;
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const [hasCachedHeight, setHasCachedHeight] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('matchHistoryGridHeight');
    }
    return false;
  });

  useEffect(() => {
    if (!hasCachedHeight && selectedMatch && gridRef.current) {
      const measured = gridRef.current.offsetHeight;
      if (measured > 0) {
        setGridHeight(measured);
        localStorage.setItem('matchHistoryGridHeight', String(measured));
        setHasCachedHeight(true);
      }
    }
  }, [selectedMatch, hasCachedHeight]);

  return [gridHeight, gridRef];
} 
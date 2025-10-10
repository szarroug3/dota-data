/**
 * Generic loading state utilities
 */

import type { Dispatch, SetStateAction } from 'react';

export interface DataWithLoading {
  isLoading?: boolean;
}

export function setMapItemLoading<K, T extends DataWithLoading>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K
): void {
  setMap(prev => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, isLoading: true });
    }
    return newMap;
  });
}

export function clearMapItemLoading<K, T extends DataWithLoading>(
  setMap: Dispatch<SetStateAction<Map<K, T>>>,
  key: K
): void {
  setMap(prev => {
    const newMap = new Map(prev);
    const currentItem = newMap.get(key);
    if (currentItem) {
      newMap.set(key, { ...currentItem, isLoading: false });
    }
    return newMap;
  });
}

export function setLoading<T extends DataWithLoading>(
  setData: Dispatch<SetStateAction<T>>
): void {
  setData(prev => ({
    ...prev,
    isLoading: true
  }));
}

export function clearLoading<T extends DataWithLoading>(
  setData: Dispatch<SetStateAction<T>>
): void {
  setData(prev => ({
    ...prev,
    isLoading: false
  }));
}

export function isLoading<T extends DataWithLoading>(item: T): boolean {
  return item.isLoading === true;
}

export function isAnyMapItemLoading<K, T extends DataWithLoading>(map: Map<K, T>): boolean {
  return Array.from(map.values()).some(item => item.isLoading === true);
}

export function isMapItemLoading<K, T extends DataWithLoading>(
  map: Map<K, T>,
  key: K
): boolean {
  const item = map.get(key);
  return item ? item.isLoading === true : false;
}



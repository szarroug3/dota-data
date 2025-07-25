/**
 * Storage utilities with localStorage corruption handling
 * Provides safe localStorage operations with error handling and data validation
 */

interface StorageData {
  [key: string]: string | number | boolean | object | null;
}

/**
 * Safely get data from localStorage with corruption handling
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get localStorage item '${key}':`, error);
    return null;
  }
}

/**
 * Safely set data in localStorage with corruption handling
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set localStorage item '${key}':`, error);
    return false;
  }
}

/**
 * Safely remove data from localStorage with corruption handling
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage item '${key}':`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage data with corruption handling
 */
export function safeClear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Validate and parse JSON data with corruption handling
 */
export function safeParseJSON<T>(data: string | null): T | null {
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    return parsed as T;
  } catch (error) {
    console.error('Failed to parse JSON data:', error);
    console.error('Corrupted data:', data);
    return null;
  }
}

/**
 * Safely stringify data for localStorage storage
 */
export function safeStringify(data: object | string | number | boolean | null): string | null {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify data:', error);
    return null;
  }
}

/**
 * Get and parse data from localStorage with full corruption handling
 */
export function getParsedData<T>(key: string): T | null {
  const rawData = safeGetItem(key);
  if (rawData === null) return null;
  
  const parsedData = safeParseJSON<T>(rawData);
  if (parsedData === null) {
    // Clear corrupted data automatically
    console.warn(`Clearing corrupted localStorage data for key '${key}'`);
    safeRemoveItem(key);
    return null;
  }
  
  return parsedData;
}

/**
 * Set data in localStorage with full corruption handling
 */
export function setData<T>(key: string, data: T): boolean {
  const stringified = safeStringify(data as object | string | number | boolean | null);
  if (stringified === null) return false;
  
  return safeSetItem(key, stringified);
}

/**
 * Validate localStorage data structure
 */
export function validateStorageData(data: object | null): data is StorageData {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    console.warn('localStorage is not available');
    return false;
  }
}

/**
 * Get localStorage usage information for debugging
 */
export function getStorageInfo(): { available: boolean; used: number; quota?: number } {
  const available = isLocalStorageAvailable();
  
  if (!available) {
    return { available: false, used: 0 };
  }
  
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += (key.length + (value?.length || 0)) * 2; // UTF-16 characters
      }
    }
    
    return { available: true, used };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { available: true, used: 0 };
  }
} 
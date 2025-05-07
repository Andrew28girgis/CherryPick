import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  /**
   * Store an item in localStorage with type safety
   * @param key The key to store the value under
   * @param value The value to store
   */

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing item ${key} in localStorage:`, error);
    }
  }

  /**
   * Retrieve an item from localStorage with type safety
   * @param key The key to retrieve
   * @param defaultValue Optional default value if key is not found
   * @returns The stored value, or defaultValue if not found
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue || null;
    } catch (error) {
      console.error(`Error retrieving item ${key} from localStorage:`, error);
      return defaultValue || null;
    }
  }

  /**
   * Remove an item from localStorage
   * @param key The key to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// src/utils/storage.ts
class Storage {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  save<T>(key: string, data: T): void {
    if (!this.isClient()) return;

    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  load<T>(key: string, defaultValue: T): T {
    if (!this.isClient()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    if (!this.isClient()) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  clear(): void {
    if (!this.isClient()) return;

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

export const storage = new Storage();

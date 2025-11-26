import type { StorageBackend, StorageOptions } from '../types';

const defaultSerializer = {
  serialize: (value: unknown): string => JSON.stringify(value),
  deserialize: <T>(value: string): T => JSON.parse(value),
};

/**
 * LocalStorage backend
 * Uses browser's localStorage for persistence
 */
export class LocalStorageBackend implements StorageBackend {
  private prefix: string;
  private serializer: StorageOptions['serializer'];

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || '';
    this.serializer = options.serializer || defaultSerializer;
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return null;
      return this.serializer!.deserialize<T>(item);
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = this.serializer!.serialize(value);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    if (this.prefix) {
      // Only clear keys with our prefix
      const keysToRemove = await this.keys();
      keysToRemove.forEach((key) => {
        localStorage.removeItem(this.getKey(key));
      });
    } else {
      localStorage.clear();
    }
  }

  async keys(): Promise<string[]> {
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (this.prefix) {
          if (key.startsWith(`${this.prefix}:`)) {
            allKeys.push(key.slice(this.prefix.length + 1));
          }
        } else {
          allKeys.push(key);
        }
      }
    }
    return allKeys;
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}


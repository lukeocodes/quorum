import type { StorageBackend, StorageOptions } from '../types';

const defaultSerializer = {
  serialize: (value: unknown): string => JSON.stringify(value),
  deserialize: <T>(value: string): T => JSON.parse(value),
};

/**
 * Memory storage backend
 * Useful for testing or SSR where localStorage is not available
 */
export class MemoryStorageBackend implements StorageBackend {
  private store: Map<string, string> = new Map();
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
      const item = this.store.get(this.getKey(key));
      if (item === undefined) return null;
      return this.serializer!.deserialize<T>(item);
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = this.serializer!.serialize(value);
      this.store.set(this.getKey(key), serialized);
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    this.store.delete(this.getKey(key));
  }

  async clear(): Promise<void> {
    if (this.prefix) {
      // Only clear keys with our prefix
      const prefixWithColon = `${this.prefix}:`;
      for (const key of this.store.keys()) {
        if (key.startsWith(prefixWithColon)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.clear();
    }
  }

  async keys(): Promise<string[]> {
    const allKeys: string[] = [];
    for (const key of this.store.keys()) {
      if (this.prefix) {
        const prefixWithColon = `${this.prefix}:`;
        if (key.startsWith(prefixWithColon)) {
          allKeys.push(key.slice(prefixWithColon.length));
        }
      } else {
        allKeys.push(key);
      }
    }
    return allKeys;
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(this.getKey(key));
  }

  /** Get the internal store (useful for testing) */
  getStore(): Map<string, string> {
    return this.store;
  }
}


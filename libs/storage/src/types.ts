/**
 * Storage backend interface
 */
export interface StorageBackend {
  /** Get an item from storage */
  get<T>(key: string): Promise<T | null>;
  
  /** Set an item in storage */
  set<T>(key: string, value: T): Promise<void>;
  
  /** Remove an item from storage */
  remove(key: string): Promise<void>;
  
  /** Clear all items from storage */
  clear(): Promise<void>;
  
  /** Get all keys in storage */
  keys(): Promise<string[]>;
  
  /** Check if a key exists */
  has(key: string): Promise<boolean>;
}

/**
 * Storage options
 */
export interface StorageOptions {
  /** Prefix for all keys */
  prefix?: string;
  /** Serializer for values (default: JSON) */
  serializer?: {
    serialize: (value: unknown) => string;
    deserialize: <T>(value: string) => T;
  };
}

/**
 * Session data structure
 */
export interface StoredSession {
  userId: number;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
  token: string;
  apiUrl: string;
  addedAt: number;
}

/**
 * Account store structure
 */
export interface AccountStore {
  accounts: StoredSession[];
  currentUserId: number | null;
}


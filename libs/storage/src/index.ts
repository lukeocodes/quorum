/**
 * @quorum/storage
 * 
 * Storage abstractions for Quorum apps
 * Provides a unified interface for storing data across different backends
 */

// Types
export type {
  StorageBackend,
  StorageOptions,
  StoredSession,
  AccountStore,
} from './types';

// Backends
export { LocalStorageBackend } from './backends/localStorage';
export { MemoryStorageBackend } from './backends/memory';

// Account management
export { AccountManager } from './accounts';

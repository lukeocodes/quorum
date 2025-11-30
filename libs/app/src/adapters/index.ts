/**
 * @quorum/app - Platform Adapters
 * 
 * Platform adapter types and context for cross-platform support.
 */

// Types
export type { PlatformAdapter, PlatformAdapterContextValue } from './types';

// Context and hooks
export {
  PlatformAdapterProvider,
  usePlatformAdapter,
  useAdapterReady,
  usePlatformAdapterSafe,
} from './context';


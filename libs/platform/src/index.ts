/**
 * @quorum/platform
 * 
 * Platform detection and capabilities for Quorum apps
 * Provides utilities to detect whether running in Electron or Web,
 * and what capabilities are available on each platform.
 */

// Types
export type {
  PlatformType,
  PlatformInfo,
  PlatformCapabilities,
  WindowState,
  PlatformAPI,
  NotificationOptions,
} from './types';

// Detection utilities
export {
  isElectron,
  isWeb,
  isDev,
  detectOS,
  detectPlatformType,
  detectCapabilities,
  getPlatformInfo,
} from './detect';

// React hooks
export {
  usePlatform,
  useIsElectron,
  useIsWeb,
  useIsDev,
  useCapabilities,
  useHasCapability,
} from './hooks';

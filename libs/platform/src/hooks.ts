import { useMemo } from 'react';
import { getPlatformInfo, isElectron, isWeb, isDev } from './detect';
import type { PlatformInfo, PlatformCapabilities } from './types';

/**
 * Hook to get platform information
 */
export function usePlatform(): PlatformInfo {
  return useMemo(() => getPlatformInfo(), []);
}

/**
 * Hook to check if running in Electron
 */
export function useIsElectron(): boolean {
  return useMemo(() => isElectron(), []);
}

/**
 * Hook to check if running in web browser
 */
export function useIsWeb(): boolean {
  return useMemo(() => isWeb(), []);
}

/**
 * Hook to check if running in development mode
 */
export function useIsDev(): boolean {
  return useMemo(() => isDev(), []);
}

/**
 * Hook to get platform capabilities
 */
export function useCapabilities(): PlatformCapabilities {
  return useMemo(() => getPlatformInfo().capabilities, []);
}

/**
 * Hook to check if a specific capability is available
 */
export function useHasCapability(capability: keyof PlatformCapabilities): boolean {
  return useMemo(() => getPlatformInfo().capabilities[capability], [capability]);
}


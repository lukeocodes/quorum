/**
 * @quorum/app - Platform Adapter Context
 * 
 * React context for providing the platform adapter throughout the app.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { PlatformAdapter, PlatformAdapterContextValue } from './types';

const PlatformAdapterContext = createContext<PlatformAdapterContextValue>({
  adapter: null,
  isReady: false,
});

interface PlatformAdapterProviderProps {
  adapter: PlatformAdapter;
  children: ReactNode;
}

/**
 * Provider component for the platform adapter
 */
export function PlatformAdapterProvider({ adapter, children }: PlatformAdapterProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready after adapter is set
    if (adapter) {
      setIsReady(true);
    }
  }, [adapter]);

  return (
    <PlatformAdapterContext.Provider value={{ adapter, isReady }}>
      {children}
    </PlatformAdapterContext.Provider>
  );
}

/**
 * Hook to access the platform adapter
 * @throws Error if used outside of PlatformAdapterProvider
 */
export function usePlatformAdapter(): PlatformAdapter {
  const { adapter } = useContext(PlatformAdapterContext);
  
  if (!adapter) {
    throw new Error('usePlatformAdapter must be used within a PlatformAdapterProvider');
  }
  
  return adapter;
}

/**
 * Hook to check if the platform adapter is ready
 */
export function useAdapterReady(): boolean {
  const { isReady } = useContext(PlatformAdapterContext);
  return isReady;
}

/**
 * Hook to safely access the platform adapter (returns null if not available)
 */
export function usePlatformAdapterSafe(): PlatformAdapter | null {
  const { adapter } = useContext(PlatformAdapterContext);
  return adapter;
}

/**
 * @quorum/app - Store Context
 * 
 * React context for providing all stores to the application.
 * The app shell is responsible for creating and configuring the stores.
 */

import { createContext, useContext, type ReactNode, type ReactElement } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type {
  ChannelStore,
  MessageStore,
  SessionStore,
  UIStore,
} from '@quorum/app-state';

/**
 * All stores available to the application
 */
export interface AppStores {
  sessionStore: UseBoundStore<StoreApi<SessionStore>>;
  channelStore: UseBoundStore<StoreApi<ChannelStore>>;
  messageStore: UseBoundStore<StoreApi<MessageStore>>;
  uiStore: UseBoundStore<StoreApi<UIStore>>;
}

const StoreContext = createContext<AppStores | null>(null);

interface StoreProviderProps {
  stores: AppStores;
  children: ReactNode;
}

/**
 * Provider component for all application stores
 */
export function StoreProvider({ stores, children }: StoreProviderProps): ReactElement {
  return (
    <StoreContext.Provider value={stores}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to access all stores
 * @throws Error if used outside of StoreProvider
 */
export function useStores(): AppStores {
  const stores = useContext(StoreContext);
  
  if (!stores) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  
  return stores;
}

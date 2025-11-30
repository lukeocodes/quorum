/**
 * @quorum/app - Store Hooks
 * 
 * Convenient hooks for accessing individual stores from context
 */

import { useStores, type AppStores } from './context';

/**
 * Hook to access the session store
 */
export function useSessionStore(): AppStores['sessionStore'] {
  const { sessionStore } = useStores();
  return sessionStore;
}

/**
 * Hook to access the channel store
 */
export function useChannelStore(): AppStores['channelStore'] {
  const { channelStore } = useStores();
  return channelStore;
}

/**
 * Hook to access the message store
 */
export function useMessageStore(): AppStores['messageStore'] {
  const { messageStore } = useStores();
  return messageStore;
}

/**
 * Hook to access the UI store
 */
export function useAppUIStore(): AppStores['uiStore'] {
  const { uiStore } = useStores();
  return uiStore;
}

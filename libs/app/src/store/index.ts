/**
 * @quorum/app - Store Context
 * 
 * Re-exports stores from @quorum/app-state and provides context for wiring them together.
 */

// Re-export all stores and types from app-state
export {
  // Types
  type User,
  type Server,
  type Channel,
  type Message,
  type ApiConfig,
  type AuthState,
  type ChannelState,
  type MessageState,
  type UserSession,
  
  // Store types
  type ChannelStore,
  type MessageStore,
  type SessionStore,
  type UIStore,
  
  // Store factories
  createChannelStore,
  createMessageStore,
  createSessionStore,
  createUIStore,
  
  // Singleton instances
  useUIStore,
} from '@quorum/app-state';

export { StoreProvider, useStores, type AppStores } from './context';

export {
  useSessionStore,
  useChannelStore,
  useMessageStore,
  useAppUIStore,
} from './hooks';

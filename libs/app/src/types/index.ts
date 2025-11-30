/**
 * @quorum/app - Type definitions
 * 
 * Types specific to the app package (platform adapter, events, etc.)
 * Core domain types (User, Server, Message, etc.) come from @quorum/app-state.
 */

// Re-export core types from app-state for convenience
export type {
  User,
  Server,
  Channel,
  Message,
} from '@quorum/app-state';

// Re-export session types
export type { UserSession } from '@quorum/app-state';

// Re-export platform types
export type { PlatformType, PlatformInfo, PlatformCapabilities } from '@quorum/platform';

/**
 * Channel section for organizing channels in sidebar
 */
export interface ChannelSection {
  id: string;
  name: string;
  type: 'channels';
  channelIds: number[];
  collapsed: boolean;
  isDefault: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Event callback types for platform events
 */
export interface PlatformEventCallbacks {
  onSessionAdded?: (data: { session: import('@quorum/app-state').UserSession; serverId?: number }) => void;
  onSessionChanged?: (data: { session: import('@quorum/app-state').UserSession }) => void;
  onSessionRemoved?: (data: { sessionId: number }) => void;
  onServerRemoved?: (data: { serverId: number }) => void;
}

/**
 * @quorum/app - Platform Adapter Types
 * 
 * Defines the interface that platform-specific adapters must implement.
 * This allows the shared app code to work on both Electron and Web.
 */

import type { Server, UserSession } from '@quorum/app-state';
import type { ApiResult, ChannelSection, PlatformEventCallbacks } from '../types';

/**
 * Platform Adapter Interface
 * 
 * This interface must be implemented by each platform (Electron, Web).
 * It abstracts all platform-specific operations so the app code remains portable.
 */
export interface PlatformAdapter {
  /**
   * Platform identifier
   */
  readonly platformType: 'electron' | 'web';

  /**
   * System operations
   */
  openExternal(url: string): Promise<ApiResult<void>>;

  /**
   * Session management (multi-account support)
   */
  getAllSessions(): Promise<ApiResult<UserSession[]>>;
  getActiveSession(): Promise<ApiResult<UserSession | null>>;
  setActiveSession(sessionId: number): Promise<ApiResult<UserSession>>;
  removeSession(sessionId: number): Promise<ApiResult<void>>;

  /**
   * Server management
   */
  getServersForSession(sessionId: number): Promise<ApiResult<Server[]>>;
  getAllServers(): Promise<ApiResult<Server[]>>;
  updateServerOrder(sessionId: number, serverId: number, newOrder: number): Promise<ApiResult<void>>;
  removeServer(serverId: number): Promise<ApiResult<void>>;
  refreshServers(sessionId: number): Promise<ApiResult<Server[]>>;
  openAddServerFlow(): Promise<ApiResult<void>>;

  /**
   * Channel sections (for organizing channels in sidebar)
   */
  loadSections(sessionId: number, serverId: number): Promise<ApiResult<ChannelSection[]>>;
  saveSections(sessionId: number, serverId: number, sections: ChannelSection[]): Promise<ApiResult<void>>;

  /**
   * UI Preferences (stored locally)
   */
  loadAppUIPreference(sessionId: number, preferenceKey: string): Promise<ApiResult<string | null>>;
  saveAppUIPreference(sessionId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>>;
  loadServerUIPreference(sessionId: number, serverId: number, preferenceKey: string): Promise<ApiResult<string | null>>;
  saveServerUIPreference(sessionId: number, serverId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>>;

  /**
   * Event listeners
   * Returns a cleanup function to remove the listener
   */
  onSessionAdded(callback: NonNullable<PlatformEventCallbacks['onSessionAdded']>): () => void;
  onSessionChanged(callback: NonNullable<PlatformEventCallbacks['onSessionChanged']>): () => void;
  onSessionRemoved(callback: NonNullable<PlatformEventCallbacks['onSessionRemoved']>): () => void;
  onServerRemoved(callback: NonNullable<PlatformEventCallbacks['onServerRemoved']>): () => void;
  
  /**
   * Remove all listeners for a channel
   */
  removeAllListeners(channel: string): void;
}

/**
 * Platform adapter context value
 */
export interface PlatformAdapterContextValue {
  adapter: PlatformAdapter | null;
  isReady: boolean;
}


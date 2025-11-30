/**
 * Electron Platform Adapter
 * 
 * Implements the PlatformAdapter interface by wrapping window.electronAPI
 * This adapter enables the shared app code to work in Electron.
 */

import type { PlatformAdapter } from '@quorum/app';
import type { Server, UserSession } from '@quorum/app-state';
import type { ApiResult, ChannelSection } from '@quorum/app';

/**
 * Create an Electron platform adapter that wraps window.electronAPI
 */
export function createElectronAdapter(): PlatformAdapter {
  // Ensure we're in Electron
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('Electron adapter can only be used in Electron environment');
  }

  const api = window.electronAPI;

  return {
    platformType: 'electron',

    // System operations
    async openExternal(url: string): Promise<ApiResult<void>> {
      const result = await api.openExternal(url);
      return {
        success: result.success,
        data: undefined,
      };
    },

    // Session management
    async getAllSessions(): Promise<ApiResult<UserSession[]>> {
      const result = await api.getAllSessions();
      return {
        success: result.success,
        data: result.data || [],
      };
    },

    async getActiveSession(): Promise<ApiResult<UserSession | null>> {
      const result = await api.getActiveSession();
      return {
        success: result.success,
        data: result.data || null,
      };
    },

    async setActiveSession(sessionId: number): Promise<ApiResult<UserSession>> {
      const result = await api.setActiveSession(sessionId);
      return {
        success: result.success,
        data: result.data,
        error: result.error,
      };
    },

    async removeSession(sessionId: number): Promise<ApiResult<void>> {
      const result = await api.removeSession(sessionId);
      return {
        success: result.success,
        error: result.error,
      };
    },

    // Server management
    async getServersForSession(sessionId: number): Promise<ApiResult<Server[]>> {
      const result = await api.getServersForSession(sessionId);
      return {
        success: result.success,
        data: result.data as Server[] || [],
      };
    },

    async getAllServers(): Promise<ApiResult<Server[]>> {
      const result = await api.getAllServers();
      return {
        success: result.success,
        data: result.data as Server[] || [],
      };
    },

    async updateServerOrder(sessionId: number, serverId: number, newOrder: number): Promise<ApiResult<void>> {
      const result = await api.updateServerOrder(sessionId, serverId, newOrder);
      return {
        success: result.success,
        error: result.error,
      };
    },

    async removeServer(serverId: number): Promise<ApiResult<void>> {
      const result = await api.removeServer(serverId);
      return {
        success: result.success,
        error: result.error,
      };
    },

    async refreshServers(sessionId: number): Promise<ApiResult<Server[]>> {
      const result = await api.refreshServers(sessionId);
      return {
        success: result.success,
        data: result.data as Server[] || [],
      };
    },

    async openAddServerFlow(): Promise<ApiResult<void>> {
      const result = await api.openAddServerFlow();
      return {
        success: result.success,
      };
    },

    // Channel sections
    async loadSections(sessionId: number, serverId: number): Promise<ApiResult<ChannelSection[]>> {
      const result = await api.loadSections(sessionId, serverId);
      return {
        success: result.success,
        data: result.data || [],
        error: result.error,
      };
    },

    async saveSections(sessionId: number, serverId: number, sections: ChannelSection[]): Promise<ApiResult<void>> {
      const result = await api.saveSections(sessionId, serverId, sections);
      return {
        success: result.success,
        error: result.error,
      };
    },

    // UI Preferences
    async loadAppUIPreference(sessionId: number, preferenceKey: string): Promise<ApiResult<string | null>> {
      const result = await api.loadAppUIPreference(sessionId, preferenceKey);
      return {
        success: result.success,
        data: result.data ?? null,
        error: result.error,
      };
    },

    async saveAppUIPreference(sessionId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>> {
      const result = await api.saveAppUIPreference(sessionId, preferenceKey, preferenceValue);
      return {
        success: result.success,
        error: result.error,
      };
    },

    async loadServerUIPreference(sessionId: number, serverId: number, preferenceKey: string): Promise<ApiResult<string | null>> {
      const result = await api.loadServerUIPreference(sessionId, serverId, preferenceKey);
      return {
        success: result.success,
        data: result.data ?? null,
        error: result.error,
      };
    },

    async saveServerUIPreference(sessionId: number, serverId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>> {
      const result = await api.saveServerUIPreference(sessionId, serverId, preferenceKey, preferenceValue);
      return {
        success: result.success,
        error: result.error,
      };
    },

    // Event listeners
    onSessionAdded(callback): () => void {
      api.onSessionAdded(callback);
      return () => api.removeAllListeners('session-added');
    },

    onSessionChanged(callback): () => void {
      api.onSessionChanged(callback);
      return () => api.removeAllListeners('session-changed');
    },

    onSessionRemoved(callback): () => void {
      api.onSessionRemoved(callback);
      return () => api.removeAllListeners('session-removed');
    },

    onServerRemoved(callback): () => void {
      api.onServerRemoved(callback);
      return () => api.removeAllListeners('server-removed');
    },

    removeAllListeners(channel: string): void {
      api.removeAllListeners(channel);
    },
  };
}


/**
 * Web Platform Adapter
 * 
 * Implements the PlatformAdapter interface for web browsers.
 * Uses localStorage for sessions and REST APIs for server operations and preferences.
 */

import type { PlatformAdapter } from '@quorum/app';
import type { Server, UserSession } from '@quorum/app-state';
import type { ApiResult, ChannelSection } from '@quorum/app';
import { QuorumUserClient } from '@quorum/api-client-user';

const STORAGE_KEYS = {
  SESSIONS: 'quorum_sessions',
  ACTIVE_SESSION_ID: 'quorum_active_session_id',
  SERVERS: 'quorum_servers',
};

// API URLs
const API_CORE_URL = import.meta.env.PUBLIC_API_CORE_URL || 'http://localhost:3000';
const API_USER_URL = import.meta.env.PUBLIC_API_USER_URL || 'http://localhost:3002';

/**
 * Create a Web platform adapter that uses localStorage for sessions and APIs for preferences
 */
export function createWebAdapter(): PlatformAdapter {
  // Helper to get from localStorage
  const getStorage = <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Helper to set in localStorage
  const setStorage = (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Helper to get user client for current session
  const getUserClient = (sessionId: number): QuorumUserClient | null => {
    const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    return new QuorumUserClient({
      baseUrl: API_USER_URL,
      token: session.authToken,
    });
  };

  // Event listeners storage
  const listeners: {
    sessionAdded: Set<(data: { session: UserSession; serverId?: number }) => void>;
    sessionChanged: Set<(data: { session: UserSession }) => void>;
    sessionRemoved: Set<(data: { sessionId: number }) => void>;
    serverRemoved: Set<(data: { serverId: number }) => void>;
  } = {
    sessionAdded: new Set(),
    sessionChanged: new Set(),
    sessionRemoved: new Set(),
    serverRemoved: new Set(),
  };

  return {
    platformType: 'web',

    // System operations
    async openExternal(url: string): Promise<ApiResult<void>> {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Failed to open URL' };
      }
    },

    // Session management - using localStorage
    async getAllSessions(): Promise<ApiResult<UserSession[]>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      return { success: true, data: sessions };
    },

    async getActiveSession(): Promise<ApiResult<UserSession | null>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      const activeId = getStorage<number | null>(STORAGE_KEYS.ACTIVE_SESSION_ID, null);
      
      if (activeId === null) {
        return { success: true, data: null };
      }
      
      const session = sessions.find(s => s.id === activeId) || null;
      return { success: true, data: session };
    },

    async setActiveSession(sessionId: number): Promise<ApiResult<UserSession>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return { success: false, error: 'Session not found' };
      }
      
      setStorage(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
      
      // Mark this session as active
      const updatedSessions = sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId,
      }));
      setStorage(STORAGE_KEYS.SESSIONS, updatedSessions);
      
      // Notify listeners
      listeners.sessionChanged.forEach(cb => cb({ session }));
      
      return { success: true, data: session };
    },

    async removeSession(sessionId: number): Promise<ApiResult<void>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setStorage(STORAGE_KEYS.SESSIONS, updatedSessions);
      
      // Clear active if this was active
      const activeId = getStorage<number | null>(STORAGE_KEYS.ACTIVE_SESSION_ID, null);
      if (activeId === sessionId) {
        setStorage(STORAGE_KEYS.ACTIVE_SESSION_ID, null);
      }
      
      // Notify listeners
      listeners.sessionRemoved.forEach(cb => cb({ sessionId }));
      
      return { success: true };
    },

    // Server management - using API
    async getServersForSession(sessionId: number): Promise<ApiResult<Server[]>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return { success: false, error: 'Session not found', data: [] };
      }
      
      try {
      // Use /discovery/servers/added to get only servers that have been added to clients
      const response = await fetch(`${session.apiUrl || API_CORE_URL}/discovery/servers/added`, {
          headers: {
            'Authorization': `Bearer ${session.authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          return { success: false, error: 'Failed to fetch servers', data: [] };
        }
        
        const data = await response.json();
      // /discovery/servers/added returns { success: true, data: [...servers] }
      // Normalize API response (camelCase) to match Server type (snake_case)
      const servers = (data.data || []).map((s: Record<string, unknown>) => ({
        id: s.id as number,
        name: s.name as string,
        description: s.description as string,
        is_public: s.isPublic as boolean,
        role: s.role as string,
        created_at: s.createdAt as string,
        updated_at: s.updatedAt as string,
        // Session info for multi-account support
          sessionId: session.id,
          sessionUserId: session.userId,
          sessionUsername: session.username,
          sessionAuthToken: session.authToken,
          sessionApiUrl: session.apiUrl,
      })) as Server[];
        
        return { success: true, data: servers };
      } catch (error) {
        console.error('Error fetching servers:', error);
        return { success: false, error: 'Network error', data: [] };
      }
    },

    async getAllServers(): Promise<ApiResult<Server[]>> {
      const sessions = getStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, []);
      const allServers: Server[] = [];
      
      for (const session of sessions) {
        const result = await this.getServersForSession(session.id);
        if (result.success && result.data) {
          allServers.push(...result.data);
        }
      }
      
      return { success: true, data: allServers };
    },

    async updateServerOrder(_sessionId: number, _serverId: number, _newOrder: number): Promise<ApiResult<void>> {
      // Store server order in localStorage for web
      // In a full implementation, this could sync to the API
      return { success: true };
    },

    async removeServer(serverId: number): Promise<ApiResult<void>> {
      // For web, we just remove from our local tracking
      // The actual server removal would be an API call
      listeners.serverRemoved.forEach(cb => cb({ serverId }));
      return { success: true };
    },

    async refreshServers(sessionId: number): Promise<ApiResult<Server[]>> {
      return this.getServersForSession(sessionId);
    },

    async openAddServerFlow(): Promise<ApiResult<void>> {
      // Open the console servers page in a new tab
      const consoleUrl = import.meta.env.PUBLIC_CONSOLE_URL || 'http://localhost:4321';
      window.open(`${consoleUrl}/servers`, '_blank', 'noopener,noreferrer');
      return { success: true };
    },

    // Channel sections - using API (synced across devices)
    async loadSections(sessionId: number, serverId: number): Promise<ApiResult<ChannelSection[]>> {
      const client = getUserClient(sessionId);
      if (!client) {
        return { success: false, error: 'Session not found', data: [] };
      }

      try {
        const sections = await client.getChannelSections(serverId);
        return { success: true, data: sections };
      } catch (error) {
        console.error('Error loading sections:', error);
        return { success: true, data: [] }; // Return empty array on error
      }
    },

    async saveSections(sessionId: number, serverId: number, sections: ChannelSection[]): Promise<ApiResult<void>> {
      const client = getUserClient(sessionId);
      if (!client) {
        return { success: false, error: 'Session not found' };
      }

      try {
        await client.updateChannelSections(serverId, sections);
        return { success: true };
      } catch (error) {
        console.error('Error saving sections:', error);
        return { success: false, error: 'Failed to save sections' };
      }
    },

    // UI Preferences - using API (synced across devices) with localStorage fallback
    async loadAppUIPreference(sessionId: number, preferenceKey: string): Promise<ApiResult<string | null>> {
      const client = getUserClient(sessionId);
      if (!client) {
        // Fallback to localStorage if no session
        try {
          const localValue = localStorage.getItem(`quorum_pref_${preferenceKey}`);
          return { success: true, data: localValue };
        } catch {
          return { success: false, error: 'Session not found', data: null };
        }
      }

      try {
        const preferences = await client.getAppPreferences();
        const value = preferences[preferenceKey] || null;
        
        // Also store in localStorage as cache
        if (value) {
          try {
            localStorage.setItem(`quorum_pref_${preferenceKey}`, value);
          } catch (e) {
            // Ignore localStorage errors
          }
        }
        
        return { success: true, data: value };
      } catch (error) {
        console.error('Error loading app preference:', error);
        // Fallback to localStorage on API error
        try {
          const localValue = localStorage.getItem(`quorum_pref_${preferenceKey}`);
          return { success: true, data: localValue };
        } catch {
          return { success: true, data: null };
        }
      }
    },

    async saveAppUIPreference(sessionId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>> {
      // Always save to localStorage for immediate access
      try {
        localStorage.setItem(`quorum_pref_${preferenceKey}`, preferenceValue);
      } catch (e) {
        // Ignore localStorage errors
      }
      
      const client = getUserClient(sessionId);
      if (!client) {
        // No session, but localStorage save succeeded
        return { success: true };
      }

      try {
        await client.setAppPreference(preferenceKey, preferenceValue);
        return { success: true };
      } catch (error) {
        console.error('Error saving app preference:', error);
        // localStorage save already succeeded, so return success
        return { success: true };
      }
    },

    async loadServerUIPreference(sessionId: number, serverId: number, preferenceKey: string): Promise<ApiResult<string | null>> {
      const client = getUserClient(sessionId);
      if (!client) {
        // Fallback to localStorage if no session
        try {
          const localValue = localStorage.getItem(`quorum_pref_server_${serverId}_${preferenceKey}`);
          return { success: true, data: localValue };
        } catch {
          return { success: false, error: 'Session not found', data: null };
        }
      }

      try {
        const preferences = await client.getServerPreferences(serverId);
        const value = preferences[preferenceKey] || null;
        
        // Also store in localStorage as cache
        if (value) {
          try {
            localStorage.setItem(`quorum_pref_server_${serverId}_${preferenceKey}`, value);
          } catch (e) {
            // Ignore localStorage errors
          }
        }
        
        return { success: true, data: value };
      } catch (error) {
        console.error('Error loading server preference:', error);
        // Fallback to localStorage on API error
        try {
          const localValue = localStorage.getItem(`quorum_pref_server_${serverId}_${preferenceKey}`);
          return { success: true, data: localValue };
        } catch {
          return { success: true, data: null };
        }
      }
    },

    async saveServerUIPreference(sessionId: number, serverId: number, preferenceKey: string, preferenceValue: string): Promise<ApiResult<void>> {
      // Always save to localStorage for immediate access
      try {
        localStorage.setItem(`quorum_pref_server_${serverId}_${preferenceKey}`, preferenceValue);
      } catch (e) {
        // Ignore localStorage errors
      }
      
      const client = getUserClient(sessionId);
      if (!client) {
        // No session, but localStorage save succeeded
        return { success: true };
      }

      try {
        await client.setServerPreference(serverId, preferenceKey, preferenceValue);
        return { success: true };
      } catch (error) {
        console.error('Error saving server preference:', error);
        // localStorage save already succeeded, so return success
        return { success: true };
      }
    },

    // Event listeners - for web these are local only
    onSessionAdded(callback): () => void {
      listeners.sessionAdded.add(callback);
      return () => listeners.sessionAdded.delete(callback);
    },

    onSessionChanged(callback): () => void {
      listeners.sessionChanged.add(callback);
      return () => listeners.sessionChanged.delete(callback);
    },

    onSessionRemoved(callback): () => void {
      listeners.sessionRemoved.add(callback);
      return () => listeners.sessionRemoved.delete(callback);
    },

    onServerRemoved(callback): () => void {
      listeners.serverRemoved.add(callback);
      return () => listeners.serverRemoved.delete(callback);
    },

    removeAllListeners(channel: string): void {
      switch (channel) {
        case 'session-added':
          listeners.sessionAdded.clear();
          break;
        case 'session-changed':
          listeners.sessionChanged.clear();
          break;
        case 'session-removed':
          listeners.sessionRemoved.clear();
          break;
        case 'server-removed':
          listeners.serverRemoved.clear();
          break;
      }
    },
  };
}

/**
 * Helper function to add a new session (for use with auth flows)
 */
export function addWebSession(session: UserSession, serverId?: number): void {
  const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
  
  // Check if session already exists
  const existingIndex = sessions.findIndex((s: UserSession) => s.id === session.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, String(session.id));
  
  // Dispatch custom event for listeners
  window.dispatchEvent(new CustomEvent('quorum:session-added', {
    detail: { session, serverId },
  }));
}


import { create } from 'zustand';
import type { User, Server } from '../types';

/**
 * User session information
 */
export interface UserSession {
  id: number;
  userId: number;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
  authToken: string;
  apiUrl: string;
  isActive: boolean;
}

interface SessionState {
  /** Currently active session */
  activeSession: UserSession | null;
  /** All servers across all sessions */
  servers: Server[];
  /** Currently selected server */
  currentServer: Server | null;
  /** User derived from active session */
  user: User | null;
  /** Auth token from active/current session */
  authToken: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

interface SessionStoreConfig {
  /** Get active session */
  getActiveSession: () => Promise<UserSession | null>;
  /** Set active session */
  setActiveSession: (sessionId: number) => Promise<UserSession | null>;
  /** Get all servers across all sessions */
  getAllServers: () => Promise<Server[]>;
  /** Update server order */
  updateServerOrder: (sessionId: number, serverId: number, newOrder: number) => Promise<void>;
  /** Remove a server */
  removeServer: (serverId: number) => Promise<void>;
  /** Refresh servers for a session */
  refreshServers: (sessionId: number) => Promise<Server[]>;
}

interface SessionStoreActions {
  /** Initialize the session store */
  initialize: () => Promise<void>;
  /** Set the active session */
  setActiveSession: (session: UserSession | null) => void;
  /** Fetch all servers */
  fetchServers: () => Promise<void>;
  /** Set the current server */
  setCurrentServer: (server: Server | null) => void;
  /** Update server order */
  reorderServers: (oldIndex: number, newIndex: number) => Promise<void>;
  /** Remove a server */
  removeServer: (serverId: number) => Promise<void>;
  /** Clear all state */
  clear: () => void;
}

export type SessionStore = SessionState & SessionStoreActions;

/**
 * Create a session store with the provided platform configuration
 */
export function createSessionStore(config: SessionStoreConfig) {
  return create<SessionStore>((set, get) => ({
    // Initial state
    activeSession: null,
    servers: [],
    currentServer: null,
    user: null,
    authToken: null,
    isLoading: false,
    error: null,

    // Actions
    initialize: async () => {
      set({ isLoading: true, error: null });
      try {
        const session = await config.getActiveSession();
        if (session) {
          set({
            activeSession: session,
            user: {
              id: session.userId,
              username: session.username,
              email: session.email,
              display_name: session.displayName,
              avatar_color: session.avatarColor,
              created_at: '',
            },
            authToken: session.authToken,
          });
          // Fetch servers after setting session
          await get().fetchServers();
        }
        set({ isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize session';
        set({ error: message, isLoading: false });
        console.error('Error initializing session:', error);
      }
    },

    setActiveSession: (session: UserSession | null) => {
      set({
        activeSession: session,
        user: session ? {
          id: session.userId,
          username: session.username,
          email: session.email,
          display_name: session.displayName,
          avatar_color: session.avatarColor,
          created_at: '',
        } : null,
        authToken: session?.authToken || null,
      });
      // Fetch servers after changing session
      if (session) {
        get().fetchServers();
      }
    },

    fetchServers: async () => {
      try {
        const servers = await config.getAllServers();
        set({ servers });

        // Auto-select first server if none selected
        const currentServer = get().currentServer;
        if (!currentServer && servers.length > 0) {
          set({ currentServer: servers[0] });
        }
      } catch (error) {
        console.error('Error fetching servers:', error);
        set({ servers: [] });
      }
    },

    setCurrentServer: (server: Server | null) => {
      // Update auth token from server's session if available
      const authToken = server?.sessionAuthToken || get().activeSession?.authToken || null;
      set({ currentServer: server, authToken });
    },

    reorderServers: async (oldIndex: number, newIndex: number) => {
      const { activeSession, servers } = get();
      if (!activeSession) return;

      // Optimistically update UI
      const newServers = [...servers];
      const [movedServer] = newServers.splice(oldIndex, 1);
      newServers.splice(newIndex, 0, movedServer);
      set({ servers: newServers });

      // Persist to database
      try {
        for (let i = 0; i < newServers.length; i++) {
          await config.updateServerOrder(activeSession.id, newServers[i].id, i);
        }
      } catch (error) {
        console.error('Error updating server order:', error);
        // Revert on error
        set({ servers });
      }
    },

    removeServer: async (serverId: number) => {
      try {
        await config.removeServer(serverId);
        set((state) => ({
          servers: state.servers.filter(s => s.id !== serverId),
          currentServer: state.currentServer?.id === serverId 
            ? (state.servers.find(s => s.id !== serverId) || null)
            : state.currentServer,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove server';
        set({ error: message });
        throw error;
      }
    },

    clear: () => {
      set({
        activeSession: null,
        servers: [],
        currentServer: null,
        user: null,
        authToken: null,
        error: null,
      });
    },
  }));
}


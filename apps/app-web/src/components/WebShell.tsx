/**
 * Web Shell
 *
 * Main entry point for the web application.
 * Uses the shared session store from @quorum/app-state configured with the web adapter.
 */

import { useEffect, useState, useMemo } from "react";
import {
  PlatformAdapterProvider,
  LoadingScreen,
  MainLayout,
  createSessionStore,
  StoreProvider,
  type AppStores,
  createChannelStore,
  createMessageStore,
  createUIStore,
} from "@quorum/app";
import type { UserSession } from "@quorum/app-state";
import { createWebAdapter } from "../adapters";

type AppState = "initializing" | "loading-servers" | "ready";

// API URLs
const API_CORE_URL = import.meta.env.PUBLIC_API_CORE_URL || 'http://localhost:3000';
const API_SERVER_URL = import.meta.env.PUBLIC_API_SERVER_URL || 'http://localhost:3001';

export default function WebShell() {
  const [appState, setAppState] = useState<AppState>("initializing");

  // Create adapter once
  const adapter = useMemo(() => createWebAdapter(), []);

  // Create all stores configured with the web adapter
  const stores: AppStores = useMemo(() => {
    const sessionStore = createSessionStore({
      getActiveSession: async (): Promise<UserSession | null> => {
        const result = await adapter.getActiveSession();
        return result.success && result.data ? result.data : null;
      },
      setActiveSession: async (sessionId: number) => {
        const result = await adapter.setActiveSession(sessionId);
        return result.success ? result.data ?? null : null;
      },
      getAllServers: async () => {
        const result = await adapter.getAllServers();
        return result.success && result.data ? result.data : [];
      },
      updateServerOrder: async (
        sessionId: number,
        serverId: number,
        newOrder: number
      ) => {
        await adapter.updateServerOrder(sessionId, serverId, newOrder);
      },
      removeServer: async (serverId: number) => {
        await adapter.removeServer(serverId);
      },
      refreshServers: async (sessionId: number) => {
        const result = await adapter.refreshServers(sessionId);
        return result.success && result.data ? result.data : [];
      },
    });

    // Create channel store
    const channelStore = createChannelStore({
      fetchChannels: async (serverId: number) => {
        // Get the server from session store to find its auth token
        const state = sessionStore.getState();
        const server = state.servers.find(s => s.id === serverId);
        
        if (!server?.sessionAuthToken) {
          console.error('No auth token for server:', serverId);
          return [];
        }
        
        try {
          // Channels are on api-server (port 3001)
          const response = await fetch(`${API_SERVER_URL}/servers/${serverId}/channels`, {
            headers: {
              'Authorization': `Bearer ${server.sessionAuthToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.error('Failed to fetch channels:', response.status);
            return [];
          }
          
          const data = await response.json();
          return data.data?.channels || [];
        } catch (error) {
          console.error('Error fetching channels:', error);
          return [];
        }
      },
      createChannel: async (serverId: number, name: string, description: string) => {
        const state = sessionStore.getState();
        const server = state.servers.find(s => s.id === serverId);
        
        if (!server?.sessionAuthToken) {
          throw new Error('Not authenticated');
        }
        
        // Channels are on api-server (port 3001)
        const response = await fetch(`${API_SERVER_URL}/servers/${serverId}/channels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${server.sessionAuthToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, description }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create channel');
        }
        
        const data = await response.json();
        return data.data?.channel;
      },
      deleteChannel: async (channelId: number) => {
        const state = sessionStore.getState();
        const server = state.currentServer;
        
        if (!server?.sessionAuthToken) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${API_SERVER_URL}/channels/${channelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${server.sessionAuthToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete channel');
        }
      },
    });
    
    // Helper to normalize message format from API to what components expect
    const normalizeMessage = (msg: any) => {
      if (!msg.author) return msg;
      
      return {
        ...msg,
        // Flatten author info for user messages
        member_name: msg.author.username || msg.author.name,
        member_display_name: msg.author.display_name,
        member_avatar_color: msg.author.avatar_color,
      };
    };

    // Create message store
    const messageStore = createMessageStore({
      fetchMessages: async (channelId: number, limit = 100) => {
        const state = sessionStore.getState();
        const server = state.currentServer;
        
        if (!server?.sessionAuthToken) {
          console.error('No auth token for current server');
          return [];
        }
        
        try {
          const response = await fetch(`${API_SERVER_URL}/channels/${channelId}/messages?limit=${limit}`, {
            headers: {
              'Authorization': `Bearer ${server.sessionAuthToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.error('Failed to fetch messages:', response.status);
            return [];
          }
          
          const data = await response.json();
          const messages = data.data?.data || [];
          // Normalize all messages to flatten author info
          return messages.map(normalizeMessage);
        } catch (error) {
          console.error('Error fetching messages:', error);
          return [];
        }
      },
      sendMessage: async (channelId: number, content: string, replyToMessageId?: number) => {
        const state = sessionStore.getState();
        const server = state.currentServer;
        
        if (!server?.sessionAuthToken) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${API_SERVER_URL}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${server.sessionAuthToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            reply_to_message_id: replyToMessageId,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send message');
        }
        
        const data = await response.json();
        console.log('Message sent, response:', data);
        const message = data.data?.message || data.data;
        // Normalize the message to flatten author info
        return normalizeMessage(message);
      },
      deleteMessage: async (messageId: number) => {
        const state = sessionStore.getState();
        const server = state.currentServer;
        
        if (!server?.sessionAuthToken) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${API_SERVER_URL}/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${server.sessionAuthToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete message');
        }
      },
    });
    
    const uiStore = createUIStore();

    return {
      sessionStore,
      channelStore,
      messageStore,
      uiStore,
    };
  }, [adapter]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the session store
        await stores.sessionStore.getState().initialize();

        // Check if we have a session
        const state = stores.sessionStore.getState();
        if (state.activeSession) {
          setAppState("loading-servers");
          // Small delay for smooth transition
          setTimeout(() => setAppState("ready"), 300);
        } else {
          setAppState("ready");
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setAppState("ready");
      }
    };

    initialize();

    // Listen for session-added events from auth flow
    const handleSessionAdded = async (
      event: CustomEvent<{ session: UserSession; serverId?: number }>
    ) => {
      console.log("Session added:", event.detail);
      const { session, serverId } = event.detail;

      const state = stores.sessionStore.getState();
      state.setActiveSession(session);
      await state.fetchServers();

      // If a specific server was requested, select it
      if (serverId) {
        const newState = stores.sessionStore.getState();
        const targetServer = newState.servers.find((s) => s.id === serverId);
        if (targetServer) {
          state.setCurrentServer(targetServer);
        }
      }

      setAppState("ready");
    };

    window.addEventListener(
      "quorum:session-added",
      handleSessionAdded as unknown as EventListener
    );

    return () => {
      window.removeEventListener(
        "quorum:session-added",
        handleSessionAdded as unknown as EventListener
      );
    };
  }, [stores]);

  if (appState === "initializing" || appState === "loading-servers") {
    return <LoadingScreen />;
  }

  return (
    <PlatformAdapterProvider adapter={adapter}>
      <StoreProvider stores={stores}>
        <div className="animate-fadeIn">
          <MainLayout />
        </div>
      </StoreProvider>
    </PlatformAdapterProvider>
  );
}

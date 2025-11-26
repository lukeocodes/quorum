import { create } from 'zustand';
import type { Channel, ChannelState } from '../types';

interface ChannelStoreConfig {
  /** Function to fetch channels for a server */
  fetchChannels: (serverId: number) => Promise<Channel[]>;
  /** Function to create a channel */
  createChannel: (serverId: number, name: string, description: string) => Promise<Channel>;
  /** Function to delete a channel */
  deleteChannel: (channelId: number) => Promise<void>;
}

interface ChannelStoreActions {
  /** Load channels for a server */
  loadChannels: (serverId: number) => Promise<void>;
  /** Create a new channel */
  create: (serverId: number, name: string, description: string) => Promise<Channel>;
  /** Delete a channel */
  remove: (channelId: number) => Promise<void>;
  /** Select a channel as current */
  selectChannel: (channel: Channel | null) => void;
  /** Update a channel in the list */
  updateChannel: (channel: Channel) => void;
  /** Clear all channels */
  clear: () => void;
}

export type ChannelStore = ChannelState & ChannelStoreActions;

/**
 * Create a channel store with the provided API configuration
 */
export function createChannelStore(config: ChannelStoreConfig) {
  return create<ChannelStore>((set) => ({
    // Initial state
    channels: [],
    currentChannel: null,
    isLoading: false,
    error: null,

    // Actions
    loadChannels: async (serverId: number) => {
      set({ isLoading: true, error: null });
      try {
        const channels = await config.fetchChannels(serverId);
        set({ channels, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load channels';
        set({ error: message, isLoading: false, channels: [] });
        console.error('Error loading channels:', error);
      }
    },

    create: async (serverId: number, name: string, description: string) => {
      try {
        const channel = await config.createChannel(serverId, name, description);
        set((state) => ({
          channels: [channel, ...state.channels],
        }));
        return channel;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create channel';
        set({ error: message });
        throw error;
      }
    },

    remove: async (channelId: number) => {
      try {
        await config.deleteChannel(channelId);
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== channelId),
          currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete channel';
        set({ error: message });
        throw error;
      }
    },

    selectChannel: (channel: Channel | null) => {
      set({ currentChannel: channel });
    },

    updateChannel: (channel: Channel) => {
      set((state) => ({
        channels: state.channels.map((c) => (c.id === channel.id ? channel : c)),
        currentChannel: state.currentChannel?.id === channel.id ? channel : state.currentChannel,
      }));
    },

    clear: () => {
      set({ channels: [], currentChannel: null, error: null });
    },
  }));
}


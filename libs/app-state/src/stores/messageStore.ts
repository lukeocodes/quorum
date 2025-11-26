import { create } from 'zustand';
import type { Message, MessageState } from '../types';

interface MessageStoreConfig {
  /** Function to fetch messages for a channel */
  fetchMessages: (channelId: number, limit?: number) => Promise<Message[]>;
  /** Function to send a message */
  sendMessage: (channelId: number, content: string, replyToMessageId?: number) => Promise<Message>;
  /** Function to delete a message */
  deleteMessage: (messageId: number) => Promise<void>;
}

interface MessageStoreActions {
  /** Load messages for a channel */
  loadMessages: (channelId: number, limit?: number) => Promise<void>;
  /** Send a new message */
  send: (channelId: number, content: string, replyToMessageId?: number) => Promise<Message>;
  /** Delete a message */
  remove: (messageId: number) => Promise<void>;
  /** Add a message to the list (for SSE events) */
  addMessage: (message: Message) => void;
  /** Update a message in the list */
  updateMessage: (message: Message) => void;
  /** Remove a message from the list by ID */
  removeById: (messageId: number) => void;
  /** Clear all messages */
  clear: () => void;
}

export type MessageStore = MessageState & MessageStoreActions;

/**
 * Create a message store with the provided API configuration
 */
export function createMessageStore(config: MessageStoreConfig) {
  return create<MessageStore>((set) => ({
    // Initial state
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,

    // Actions
    loadMessages: async (channelId: number, limit = 100) => {
      set({ isLoading: true, error: null });
      try {
        const messages = await config.fetchMessages(channelId, limit);
        set({ messages, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load messages';
        set({ error: message, isLoading: false, messages: [] });
        console.error('Error loading messages:', error);
      }
    },

    send: async (channelId: number, content: string, replyToMessageId?: number) => {
      set({ isSending: true, error: null });
      try {
        const message = await config.sendMessage(channelId, content, replyToMessageId);
        set((state) => ({
          messages: [...state.messages, message],
          isSending: false,
        }));
        return message;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        set({ error: errorMessage, isSending: false });
        throw error;
      }
    },

    remove: async (messageId: number) => {
      try {
        await config.deleteMessage(messageId);
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
        set({ error: errorMessage });
        throw error;
      }
    },

    addMessage: (message: Message) => {
      set((state) => {
        // Avoid duplicates
        if (state.messages.some((m) => m.id === message.id)) {
          return state;
        }
        return { messages: [...state.messages, message] };
      });
    },

    updateMessage: (message: Message) => {
      set((state) => ({
        messages: state.messages.map((m) => (m.id === message.id ? message : m)),
      }));
    },

    removeById: (messageId: number) => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    },

    clear: () => {
      set({ messages: [], error: null });
    },
  }));
}


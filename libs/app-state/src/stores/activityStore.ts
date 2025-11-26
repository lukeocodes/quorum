import { create } from 'zustand';

interface ActivityState {
  /** Channels with unread activity */
  channelsWithActivity: Set<number>;
  /** Whether an AI is currently generating a response */
  aiThinking: boolean;
  /** Map of channelId to Set of userIds who are typing */
  typingUsers: Map<number, Set<number>>;
}

interface ActivityStoreActions {
  /** Mark a channel as having activity */
  setChannelActivity: (channelId: number, hasActivity: boolean) => void;
  /** Set AI thinking state */
  setAIThinking: (thinking: boolean) => void;
  /** Add a typing user to a channel */
  addTypingUser: (channelId: number, userId: number) => void;
  /** Remove a typing user from a channel */
  removeTypingUser: (channelId: number, userId: number) => void;
  /** Clear typing users for a channel */
  clearTypingUsers: (channelId: number) => void;
  /** Clear all activity */
  clear: () => void;
}

export type ActivityStore = ActivityState & ActivityStoreActions;

/**
 * Create an activity store for tracking real-time activity
 */
export function createActivityStore() {
  return create<ActivityStore>((set) => ({
    // Initial state
    channelsWithActivity: new Set(),
    aiThinking: false,
    typingUsers: new Map(),

    // Actions
    setChannelActivity: (channelId: number, hasActivity: boolean) => {
      set((state) => {
        const newActivity = new Set(state.channelsWithActivity);
        if (hasActivity) {
          newActivity.add(channelId);
        } else {
          newActivity.delete(channelId);
        }
        return { channelsWithActivity: newActivity };
      });
    },

    setAIThinking: (thinking: boolean) => {
      set({ aiThinking: thinking });
    },

    addTypingUser: (channelId: number, userId: number) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        const channelTyping = newTypingUsers.get(channelId) || new Set();
        channelTyping.add(userId);
        newTypingUsers.set(channelId, channelTyping);
        return { typingUsers: newTypingUsers };
      });
    },

    removeTypingUser: (channelId: number, userId: number) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        const channelTyping = newTypingUsers.get(channelId);
        if (channelTyping) {
          channelTyping.delete(userId);
          if (channelTyping.size === 0) {
            newTypingUsers.delete(channelId);
          } else {
            newTypingUsers.set(channelId, channelTyping);
          }
        }
        return { typingUsers: newTypingUsers };
      });
    },

    clearTypingUsers: (channelId: number) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        newTypingUsers.delete(channelId);
        return { typingUsers: newTypingUsers };
      });
    },

    clear: () => {
      set({
        channelsWithActivity: new Set(),
        aiThinking: false,
        typingUsers: new Map(),
      });
    },
  }));
}

// Export a default singleton instance
export const useActivityStore = createActivityStore();


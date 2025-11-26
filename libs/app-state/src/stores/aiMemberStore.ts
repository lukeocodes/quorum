import { create } from 'zustand';
import type { AIMember, AIMemberState } from '../types';

interface CreateAIMemberData {
  name: string;
  provider: 'openai' | 'anthropic';
  model: string;
  persona: string;
  system_instructions: string;
  avatar_color?: string;
  api_key: string;
}

interface AIMemberStoreConfig {
  /** Function to fetch AI members for a channel */
  fetchAIMembers: (channelId: number) => Promise<AIMember[]>;
  /** Function to create an AI member */
  createAIMember: (channelId: number, data: CreateAIMemberData) => Promise<AIMember>;
  /** Function to delete an AI member */
  deleteAIMember: (aiMemberId: number) => Promise<void>;
}

interface AIMemberStoreActions {
  /** Load AI members for a channel */
  loadAIMembers: (channelId: number) => Promise<void>;
  /** Create a new AI member */
  create: (channelId: number, data: CreateAIMemberData) => Promise<AIMember>;
  /** Delete an AI member */
  remove: (aiMemberId: number) => Promise<void>;
  /** Update an AI member in the list */
  updateAIMember: (aiMember: AIMember) => void;
  /** Clear all AI members */
  clear: () => void;
}

export type AIMemberStore = AIMemberState & AIMemberStoreActions;

/**
 * Create an AI member store with the provided API configuration
 */
export function createAIMemberStore(config: AIMemberStoreConfig) {
  return create<AIMemberStore>((set) => ({
    // Initial state
    aiMembers: [],
    isLoading: false,
    error: null,

    // Actions
    loadAIMembers: async (channelId: number) => {
      set({ isLoading: true, error: null });
      try {
        const aiMembers = await config.fetchAIMembers(channelId);
        set({ aiMembers, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load AI members';
        set({ error: message, isLoading: false, aiMembers: [] });
        console.error('Error loading AI members:', error);
      }
    },

    create: async (channelId: number, data: CreateAIMemberData) => {
      try {
        const aiMember = await config.createAIMember(channelId, data);
        set((state) => ({
          aiMembers: [...state.aiMembers, aiMember],
        }));
        return aiMember;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create AI member';
        set({ error: message });
        throw error;
      }
    },

    remove: async (aiMemberId: number) => {
      try {
        await config.deleteAIMember(aiMemberId);
        set((state) => ({
          aiMembers: state.aiMembers.filter((m) => m.id !== aiMemberId),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete AI member';
        set({ error: message });
        throw error;
      }
    },

    updateAIMember: (aiMember: AIMember) => {
      set((state) => ({
        aiMembers: state.aiMembers.map((m) => (m.id === aiMember.id ? aiMember : m)),
      }));
    },

    clear: () => {
      set({ aiMembers: [], error: null });
    },
  }));
}


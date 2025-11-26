/**
 * @quorum/app-state
 * 
 * Shared client state management for Quorum apps
 * 
 * This library provides modular Zustand stores that can be configured
 * with platform-specific API implementations.
 */

// Types
export type {
  User,
  Server,
  Channel,
  AIMember,
  Message,
  MentionableMembers,
  ApiConfig,
  AuthState,
  ChannelState,
  MessageState,
  AIMemberState,
  ActivityState,
} from './types';

// Store factories
export { createChannelStore } from './stores/channelStore';
export type { ChannelStore } from './stores/channelStore';

export { createMessageStore } from './stores/messageStore';
export type { MessageStore } from './stores/messageStore';

export { createAIMemberStore } from './stores/aiMemberStore';
export type { AIMemberStore } from './stores/aiMemberStore';

export { createActivityStore, useActivityStore } from './stores/activityStore';
export type { ActivityStore } from './stores/activityStore';

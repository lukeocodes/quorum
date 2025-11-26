/**
 * Shared types for Quorum app state
 */

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
}

export interface Server {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
  // Session info for multi-account support
  sessionApiUrl?: string;
  sessionAuthToken?: string;
  sessionUserId?: number;
}

export interface Channel {
  id: number;
  server_id: number;
  name: string;
  description: string;
  archived: boolean;
  is_shared?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMember {
  id: number;
  room_id: number;
  name: string;
  provider: 'openai' | 'anthropic';
  model: string;
  persona: string;
  system_instructions: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  room_id: number;
  member_type: 'user' | 'ai';
  member_id: number;
  content: string;
  created_at: string;
  reply_to_message_id?: number;
  // Joined data
  member_name?: string;
  member_display_name?: string;
  member_avatar_color?: string;
  // Reply data
  reply_to_content?: string;
  reply_to_member_type?: 'user' | 'ai';
  reply_to_member_name?: string;
}

export interface MentionableMembers {
  users: Array<{ id: number; username: string; display_name: string; avatar_color: string }>;
  aiMembers: Array<{ id: number; name: string; avatar_color: string }>;
}

/**
 * API configuration for the app
 */
export interface ApiConfig {
  /** Base URL for api-core (auth, servers, discovery) */
  coreUrl: string;
  /** Base URL for api-server (channels, messages, ai, sse) */
  serverUrl: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Channel state slice
 */
export interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Message state slice
 */
export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

/**
 * AI Member state slice
 */
export interface AIMemberState {
  aiMembers: AIMember[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Activity state (typing indicators, AI thinking, etc.)
 */
export interface ActivityState {
  channelsWithActivity: Set<number>;
  aiThinking: boolean;
  typingUsers: Map<number, Set<number>>; // channelId -> Set of userIds
}


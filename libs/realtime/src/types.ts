/**
 * Realtime connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * SSE Event types supported by Quorum
 */
export type SSEEventType =
  | 'connected'
  | 'ping'
  | 'message'
  | 'message_deleted'
  | 'typing_start'
  | 'typing_stop'
  | 'member_join'
  | 'member_leave'
  | 'ai_response_start'
  | 'ai_response_chunk'
  | 'ai_response_end'
  | 'ai_response_error'
  | 'channel_updated'
  | 'channel_deleted'
  | 'server_updated';

/**
 * Base SSE event structure
 */
export interface RealtimeEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
  channelId?: number;
}

/**
 * Message event data
 */
export interface MessageEventData {
  id: number;
  room_id: number;
  member_type: 'user' | 'ai';
  member_id: number;
  content: string;
  created_at: string;
  reply_to_message_id?: number;
  member_name?: string;
  member_display_name?: string;
  member_avatar_color?: string;
  reply_to_content?: string;
  reply_to_member_type?: 'user' | 'ai';
  reply_to_member_name?: string;
}

/**
 * AI response chunk data
 */
export interface AIResponseChunkData {
  chunk: string;
  messageId: number;
  aiMemberId: number;
}

/**
 * Configuration for the realtime client
 */
export interface RealtimeConfig {
  /** Base URL for the SSE endpoint */
  baseUrl: string;
  /** Authentication token */
  token?: string;
  /** Enable auto-reconnection (default: true) */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnection delay in ms (default: 30000) */
  maxReconnectDelay?: number;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;

/**
 * Connection state change handler
 */
export type ConnectionStateHandler = (state: ConnectionState) => void;

/**
 * Error handler
 */
export type ErrorHandler = (error: Error) => void;


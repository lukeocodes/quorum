/**
 * @quorum/realtime
 * 
 * Real-time communication utilities for Quorum apps
 * Provides SSE client with automatic reconnection and event management
 */

export { SSEClient } from './sse-client';

export type {
  ConnectionState,
  SSEEventType,
  RealtimeEvent,
  MessageEventData,
  AIResponseChunkData,
  RealtimeConfig,
  EventHandler,
  ConnectionStateHandler,
  ErrorHandler,
} from './types';

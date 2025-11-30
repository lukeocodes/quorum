/**
 * API request and response types
 */

import type {
  User,
  Server,
  ServerMember,
  ServerInvite,
  Channel,
  AIMember,
  AIProvider,
  MessageWithAuthor,
  ServerWithMembers,
  ChannelWithDetails,
} from './models';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * Authentication
 */

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface SignupResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  user: User;
}

/**
 * Servers
 */

export interface CreateServerRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface CreateServerResponse {
  server: Server;
}

export interface UpdateServerRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  archived?: boolean;
}

export interface UpdateServerResponse {
  server: Server;
}

export interface GetServersResponse {
  servers: ServerWithMembers[];
}

export interface GetServerResponse {
  server: ServerWithMembers;
}

export interface GetServerMembersResponse {
  members: (ServerMember & { user: User })[];
}

export interface CreateInviteRequest {
  max_uses?: number;
  expires_in_days?: number;
}

export interface CreateInviteResponse {
  invite: ServerInvite;
}

export interface JoinServerRequest {
  code: string;
}

export interface JoinServerResponse {
  server: Server;
  member: ServerMember;
}

export interface DiscoveryServer extends ServerWithMembers {
  role: string;
  channelCount: number;
  isAdded: boolean;
}

export interface GetDiscoveryServersResponse {
  servers: DiscoveryServer[];
}

export interface AddServerResponse {
  success: boolean;
  server_id: number;
}

export interface RemoveServerResponse {
  success: boolean;
}

/**
 * Channels
 */

export interface CreateChannelRequest {
  name: string;
  description?: string;
}

export interface CreateChannelResponse {
  channel: Channel;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  archived?: boolean;
}

export interface UpdateChannelResponse {
  channel: Channel;
}

export interface GetChannelsResponse {
  channels: ChannelWithDetails[];
}

export interface GetChannelResponse {
  channel: ChannelWithDetails;
}

export interface ShareChannelRequest {
  target_server_id: number;
}

export interface ShareChannelResponse {
  success: boolean;
}

/**
 * Messages
 */

export interface SendMessageRequest {
  content: string;
  reply_to_message_id?: number;
}

export interface SendMessageResponse {
  message: MessageWithAuthor;
}

export interface GetMessagesRequest {
  page?: number;
  limit?: number;
  before?: string; // ISO timestamp
  after?: string; // ISO timestamp
}

export interface GetMessagesResponse {
  messages: MessageWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface GetMessageContextResponse {
  message: MessageWithAuthor;
  context: {
    before: MessageWithAuthor[];
    after: MessageWithAuthor[];
  };
}

/**
 * AI Members
 */

export interface CreateAIMemberRequest {
  name: string;
  provider: AIProvider;
  model: string;
  api_key: string;
  persona?: string;
  system_instructions?: string;
}

export interface CreateAIMemberResponse {
  ai_member: AIMember;
}

export interface UpdateAIMemberRequest {
  name?: string;
  model?: string;
  api_key?: string;
  persona?: string;
  system_instructions?: string;
}

export interface UpdateAIMemberResponse {
  ai_member: AIMember;
}

export interface GetAIMembersResponse {
  ai_members: AIMember[];
}

export interface GetAIMemberResponse {
  ai_member: AIMember;
}

/**
 * Real-time events
 */

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

export enum SSEEventType {
  // Messages
  Message = 'message',
  MessageDeleted = 'message_deleted',

  // Typing indicators
  TypingStart = 'typing_start',
  TypingStop = 'typing_stop',

  // Members
  MemberJoin = 'member_join',
  MemberLeave = 'member_leave',

  // AI responses
  AIResponseStart = 'ai_response_start',
  AIResponseChunk = 'ai_response_chunk',
  AIResponseEnd = 'ai_response_end',
  AIResponseError = 'ai_response_error',

  // Channel updates
  ChannelUpdated = 'channel_updated',
  ChannelDeleted = 'channel_deleted',

  // Server updates
  ServerUpdated = 'server_updated',

  // Connection
  Connected = 'connected',
  Ping = 'ping',
}

export interface MessageEvent {
  message: MessageWithAuthor;
}

export interface MessageDeletedEvent {
  message_id: number;
  channel_id: number;
}

export interface TypingEvent {
  channel_id: number;
  user_id: number;
  username: string;
}

export interface MemberJoinEvent {
  server_id: number;
  member: ServerMember & { user: User };
}

export interface MemberLeaveEvent {
  server_id: number;
  user_id: number;
}

export interface AIResponseStartEvent {
  message_id: number;
  channel_id: number;
  ai_member_id: number;
}

export interface AIResponseChunkEvent {
  message_id: number;
  channel_id: number;
  ai_member_id: number;
  chunk: string;
  accumulated: string;
}

export interface AIResponseEndEvent {
  message_id: number;
  channel_id: number;
  ai_member_id: number;
  full_content: string;
}

export interface AIResponseErrorEvent {
  message_id: number;
  channel_id: number;
  ai_member_id: number;
  error: string;
}

export interface ChannelUpdatedEvent {
  channel: Channel;
}

export interface ChannelDeletedEvent {
  channel_id: number;
  server_id: number;
}

export interface ServerUpdatedEvent {
  server: Server;
}

export interface ConnectedEvent {
  connection_id: string;
}

export interface PingEvent {
  timestamp: string;
}


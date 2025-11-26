/**
 * Database model types
 */

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Server {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  is_public: boolean;
  invite_code: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: number;
  server_id: number;
  user_id: number;
  role: ServerRole;
  joined_at: string;
}

export interface ServerInvite {
  id: number;
  server_id: number;
  created_by: number;
  code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

export interface Channel {
  id: number;
  server_id: number;
  name: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelShare {
  id: number;
  channel_id: number;
  source_server_id: number;
  target_server_id: number;
  shared_by: number;
  created_at: string;
}

export interface AIMember {
  id: number;
  channel_id: number;
  name: string;
  provider: AIProvider;
  model: string;
  persona: string | null;
  system_instructions: string | null;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  channel_id: number;
  member_type: MemberType;
  member_id: number;
  reply_to_message_id: number | null;
  content: string;
  created_at: string;
}

export interface MessageMention {
  id: number;
  message_id: number;
  mentioned_member_type: MemberType;
  mentioned_member_id: number;
  created_at: string;
}

export interface ChannelSummary {
  id: number;
  channel_id: number;
  summary: string | null;
  message_count: number;
  updated_at: string;
}

/**
 * Enums
 */

export enum MemberType {
  User = 'user',
  AI = 'ai',
}

export enum ServerRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
}

export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
}

/**
 * Tag Types for mentions and references in messages
 */

export enum TagType {
  User = 'user',
  AI = 'ai',
  Channel = 'channel',
  App = 'app',
  Server = 'server',
  URL = 'url',
}

/**
 * Parsed tag information
 */
export interface ParsedTag {
  type: TagType;
  id?: string | number;
  text?: string;
  url?: string;
  raw: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Tag patterns for different tag types
 * - Users: <@user:123>
 * - AI: <@ai:123>
 * - Channels: <#channel:123>
 * - Apps: <#app:123>
 * - Servers: <!server:123>
 * - URLs (direct): <https://google.com>
 * - URLs (markdown): [text](https://google.com)
 */
export const TAG_PATTERNS = {
  user: /<@user:(\d+)>/g,
  ai: /<@ai:(\d+)>/g,
  channel: /<#channel:(\d+)>/g,
  app: /<#app:(\d+)>/g,
  server: /<!server:(\d+)>/g,
  urlDirect: /<(https?:\/\/[^\s>]+)>/g,
  urlMarkdown: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
} as const;

/**
 * Extended types with joined data
 */

export interface MessageWithAuthor extends Message {
  author?: User | AIMember;
  mentions?: MessageMention[];
  reply_to?: Message;
}

export interface ServerWithMembers extends Server {
  members?: ServerMember[];
  member_count?: number;
}

export interface ChannelWithDetails extends Channel {
  server?: Server;
  ai_members?: AIMember[];
  summary?: ChannelSummary;
}


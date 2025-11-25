import { TagType } from '@quorum/types';
import { parseAllTags } from './parser';

/**
 * Entity lookup interface for resolving tags
 */
export interface EntityLookup {
  users?: Array<{ id: number; username: string; display_name: string; avatar_color?: string }>;
  aiMembers?: Array<{ id: number; name: string; avatar_color?: string }>;
  channels?: Array<{ id: number; name: string }>;
  apps?: Array<{ id: number; name: string }>;
  servers?: Array<{ id: number; name: string }>;
}

/**
 * Entity resolvers for async resolution (server-side)
 */
export interface EntityResolvers {
  getUser?: (id: number) => Promise<{ username: string; display_name: string }>;
  getAI?: (id: number) => Promise<{ name: string }>;
  getChannel?: (id: number) => Promise<{ name: string }>;
  getApp?: (id: number) => Promise<{ name: string }>;
  getServer?: (id: number) => Promise<{ name: string }>;
}

/**
 * Mentioned entities result
 */
export interface MentionedEntities {
  users: Array<{ id: number; username: string; display_name: string }>;
  ai: Array<{ id: number; name: string }>;
  channels: Array<{ id: number; name: string }>;
  servers: Array<{ id: number; name: string }>;
}

/**
 * Convert user-typed @mentions and #channels to database tags
 * @param content - Message content with @names, #channels, !servers
 * @param entities - Available entities for resolution
 * @returns Object with tagged content and mentioned entities
 */
export function convertMentionsToTags(
  content: string,
  entities: EntityLookup = {}
): { content: string; mentioned: MentionedEntities } {
  const { users = [], aiMembers = [], channels = [], servers = [] } = entities;

  const mentioned: MentionedEntities = {
    users: [],
    ai: [],
    channels: [],
    servers: [],
  };

  let taggedContent = content;

  // Match @name or @"name with spaces"
  const mentionPattern = /@(?:"([^"]+)"|(\w+))/g;
  const mentionMatches = Array.from(content.matchAll(mentionPattern));

  // Process mentions in reverse order to maintain string positions
  for (let i = mentionMatches.length - 1; i >= 0; i--) {
    const match = mentionMatches[i];
    const mentionName = (match[1] || match[2]).toLowerCase().trim();
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    // Try to find user first
    const user = users.find(
      (u) => u.username.toLowerCase() === mentionName || u.display_name.toLowerCase() === mentionName
    );

    if (user) {
      const tag = `<@user:${user.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentioned.users.find((u) => u.id === user.id)) {
        mentioned.users.push(user);
      }
      continue;
    }

    // Try to find AI member
    const ai = aiMembers.find((a) => a.name.toLowerCase().replace(/\s+/g, '') === mentionName);

    if (ai) {
      const tag = `<@ai:${ai.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentioned.ai.find((a) => a.id === ai.id)) {
        mentioned.ai.push(ai);
      }
    }
  }

  // Match #channel
  const channelPattern = /#(\w+)/g;
  const channelMatches = Array.from(taggedContent.matchAll(channelPattern));

  for (let i = channelMatches.length - 1; i >= 0; i--) {
    const match = channelMatches[i];
    const channelName = match[1].toLowerCase();
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    const channel = channels.find((c) => c.name.toLowerCase() === channelName);

    if (channel) {
      const tag = `<#channel:${channel.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentioned.channels.find((c) => c.id === channel.id)) {
        mentioned.channels.push(channel);
      }
    }
  }

  // Match !server
  const serverPattern = /!(\w+)/g;
  const serverMatches = Array.from(taggedContent.matchAll(serverPattern));

  for (let i = serverMatches.length - 1; i >= 0; i--) {
    const match = serverMatches[i];
    const serverName = match[1].toLowerCase();
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    const server = servers.find((s) => s.name.toLowerCase() === serverName);

    if (server) {
      const tag = `<!server:${server.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentioned.servers.find((s) => s.id === server.id)) {
        mentioned.servers.push(server);
      }
    }
  }

  return {
    content: taggedContent,
    mentioned,
  };
}

/**
 * Convert storage tags to display names (sync version with entity lookup)
 * @param content - Message content with tags
 * @param entities - Entity lookup objects
 * @returns Content with display names
 */
export function convertTagsToDisplay(content: string, entities: EntityLookup = {}): string {
  const { users = [], aiMembers = [], channels = [], apps = [], servers = [] } = entities;
  const tags = parseAllTags(content);
  let result = content;
  let offset = 0;

  for (const tag of tags) {
    const adjustedStart = tag.startIndex + offset;
    const adjustedEnd = tag.endIndex + offset;
    let replacement = tag.raw;

    switch (tag.type) {
      case TagType.User: {
        const user = users.find((u) => u.id === tag.id);
        if (user) {
          replacement = `@${user.display_name || user.username}`;
        }
        break;
      }

      case TagType.AI: {
        const ai = aiMembers.find((a) => a.id === tag.id);
        if (ai) {
          replacement = `@${ai.name}`;
        }
        break;
      }

      case TagType.Channel: {
        const channel = channels.find((c) => c.id === tag.id);
        if (channel) {
          replacement = `#${channel.name}`;
        }
        break;
      }

      case TagType.App: {
        const app = apps.find((a) => a.id === tag.id);
        if (app) {
          replacement = `#${app.name}`;
        }
        break;
      }

      case TagType.Server: {
        const server = servers.find((s) => s.id === tag.id);
        if (server) {
          replacement = `!${server.name}`;
        }
        break;
      }

      case TagType.URL:
        // For markdown URLs, show the text; for direct URLs, show the URL
        replacement = tag.text || tag.url || tag.raw;
        break;
    }

    result = result.substring(0, adjustedStart) + replacement + result.substring(adjustedEnd);
    offset += replacement.length - tag.raw.length;
  }

  return result;
}

/**
 * Convert storage tags to display names (async version with resolvers)
 * @param content - Message content with tags
 * @param resolvers - Entity resolver functions
 * @returns Promise with content with display names
 */
export async function convertTagsToDisplayAsync(
  content: string,
  resolvers: EntityResolvers
): Promise<string> {
  const tags = parseAllTags(content);
  let result = content;
  let offset = 0;

  for (const tag of tags) {
    const adjustedStart = tag.startIndex + offset;
    const adjustedEnd = tag.endIndex + offset;
    let replacement = tag.raw;

    try {
      switch (tag.type) {
        case TagType.User:
          if (resolvers.getUser && tag.id) {
            const user = await resolvers.getUser(tag.id as number);
            replacement = `@${user.display_name || user.username}`;
          }
          break;

        case TagType.AI:
          if (resolvers.getAI && tag.id) {
            const ai = await resolvers.getAI(tag.id as number);
            replacement = `@${ai.name}`;
          }
          break;

        case TagType.Channel:
          if (resolvers.getChannel && tag.id) {
            const channel = await resolvers.getChannel(tag.id as number);
            replacement = `#${channel.name}`;
          }
          break;

        case TagType.App:
          if (resolvers.getApp && tag.id) {
            const app = await resolvers.getApp(tag.id as number);
            replacement = `#${app.name}`;
          }
          break;

        case TagType.Server:
          if (resolvers.getServer && tag.id) {
            const server = await resolvers.getServer(tag.id as number);
            replacement = `!${server.name}`;
          }
          break;

        case TagType.URL:
          // URLs are already in display format
          replacement = tag.raw;
          break;
      }

      result = result.substring(0, adjustedStart) + replacement + result.substring(adjustedEnd);
      offset += replacement.length - tag.raw.length;
    } catch (error) {
      // If resolution fails, leave tag as-is
      console.error(`Failed to resolve tag: ${tag.raw}`, error);
    }
  }

  return result;
}


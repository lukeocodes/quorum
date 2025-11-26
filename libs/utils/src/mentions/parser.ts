import { TagType, ParsedTag, TAG_PATTERNS } from '@quorum/proto';

/**
 * Parse all tags from message content
 * Supports: users, AI, channels, apps, servers, and URLs
 */
export function parseAllTags(content: string): ParsedTag[] {
  const tags: ParsedTag[] = [];

  // Parse user mentions: <@user:123>
  const userMatches = Array.from(content.matchAll(TAG_PATTERNS.user));
  for (const match of userMatches) {
    tags.push({
      type: TagType.User,
      id: parseInt(match[1]),
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse AI mentions: <@ai:123>
  const aiMatches = Array.from(content.matchAll(TAG_PATTERNS.ai));
  for (const match of aiMatches) {
    tags.push({
      type: TagType.AI,
      id: parseInt(match[1]),
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse channel references: <#channel:123>
  const channelMatches = Array.from(content.matchAll(TAG_PATTERNS.channel));
  for (const match of channelMatches) {
    tags.push({
      type: TagType.Channel,
      id: parseInt(match[1]),
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse app references: <#app:123>
  const appMatches = Array.from(content.matchAll(TAG_PATTERNS.app));
  for (const match of appMatches) {
    tags.push({
      type: TagType.App,
      id: parseInt(match[1]),
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse server references: <!server:123>
  const serverMatches = Array.from(content.matchAll(TAG_PATTERNS.server));
  for (const match of serverMatches) {
    tags.push({
      type: TagType.Server,
      id: parseInt(match[1]),
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse direct URLs: <https://google.com>
  const urlDirectMatches = Array.from(content.matchAll(TAG_PATTERNS.urlDirect));
  for (const match of urlDirectMatches) {
    tags.push({
      type: TagType.URL,
      url: match[1],
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Parse markdown URLs: [text](https://google.com)
  const urlMarkdownMatches = Array.from(content.matchAll(TAG_PATTERNS.urlMarkdown));
  for (const match of urlMarkdownMatches) {
    tags.push({
      type: TagType.URL,
      text: match[1],
      url: match[2],
      raw: match[0],
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
    });
  }

  // Sort by position
  return tags.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Extract all tag IDs by type
 */
export function extractAllTagIds(content: string): {
  users: number[];
  ai: number[];
  channels: number[];
  apps: number[];
  servers: number[];
} {
  const tags = parseAllTags(content);

  return {
    users: tags.filter((t) => t.type === TagType.User && t.id).map((t) => t.id as number),
    ai: tags.filter((t) => t.type === TagType.AI && t.id).map((t) => t.id as number),
    channels: tags.filter((t) => t.type === TagType.Channel && t.id).map((t) => t.id as number),
    apps: tags.filter((t) => t.type === TagType.App && t.id).map((t) => t.id as number),
    servers: tags.filter((t) => t.type === TagType.Server && t.id).map((t) => t.id as number),
  };
}

/**
 * Extract mention IDs (users and AI only) - for backward compatibility
 */
export function extractMentionIds(content: string): Array<{ type: 'user' | 'ai'; id: number }> {
  const tags = parseAllTags(content);
  const mentions: Array<{ type: 'user' | 'ai'; id: number }> = [];

  for (const tag of tags) {
    if ((tag.type === TagType.User || tag.type === TagType.AI) && tag.id) {
      mentions.push({
        type: tag.type as 'user' | 'ai',
        id: tag.id as number,
      });
    }
  }

  return mentions;
}


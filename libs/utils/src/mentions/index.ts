/**
 * Mentions - Tag and mention utilities
 * Supports: users, AI, channels, apps, servers, URLs, and markdown
 */

// Re-export types from @quorum/proto
export { TagType, TAG_PATTERNS } from '@quorum/proto';
export type { ParsedTag } from '@quorum/proto';

// Parser utilities
export { parseAllTags, extractAllTagIds, extractMentionIds } from './parser';

// Converter utilities
export {
  convertMentionsToTags,
  convertTagsToDisplay,
  convertTagsToDisplayAsync,
  type EntityLookup,
  type EntityResolvers,
  type MentionedEntities,
} from './converter';

// React renderer utilities (optional - only imported if React is available)
export {
  renderMessageWithTags,
  MessageWithTags,
  type TagClickHandlers,
  type TagStyles,
  type MessageWithTagsProps,
} from './renderer';


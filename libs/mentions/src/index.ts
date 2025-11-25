/**
 * @quorum/mentions
 * 
 * Comprehensive tagging and mention system for Quorum
 * Supports: users, AI, channels, apps, servers, URLs, and markdown
 */

// Re-export types from @quorum/types
export { TagType, TAG_PATTERNS } from '@quorum/types';
export type { ParsedTag } from '@quorum/types';

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


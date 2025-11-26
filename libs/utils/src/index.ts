/**
 * @quorum/utils
 * 
 * Common utility functions for Quorum apps
 */

// Formatting utilities
export {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatMessageTime,
  formatNumber,
  formatBytes,
  truncate,
  pluralize,
} from './format';

// Validation utilities
export {
  isValidEmail,
  isValidUrl,
  isValidUsername,
  validatePassword,
  isEmpty,
  isNumber,
} from './validation';

// Async utilities
export {
  debounce,
  throttle,
  sleep,
  retry,
  createDeferred,
  asyncPool,
} from './async';

// Mentions utilities (merged from @quorum/mentions)
export {
  // Types from proto
  TagType,
  TAG_PATTERNS,
  type ParsedTag,
  // Parser
  parseAllTags,
  extractAllTagIds,
  extractMentionIds,
  // Converter
  convertMentionsToTags,
  convertTagsToDisplay,
  convertTagsToDisplayAsync,
  type EntityLookup,
  type EntityResolvers,
  type MentionedEntities,
  // React renderer
  renderMessageWithTags,
  MessageWithTags,
  type TagClickHandlers,
  type TagStyles,
  type MessageWithTagsProps,
} from './mentions';

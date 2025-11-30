/**
 * @quorum/api-client-user
 * 
 * Client SDK for Quorum API User (user profiles, preferences, app customization)
 */

export { QuorumUserClient } from './client';
export type {
  QuorumUserClientConfig,
  UserProfile,
  UserProfileUpdate,
  UserPreference,
  ChannelSection,
} from './client';

// Re-export types from @quorum/proto for convenience
export * from '@quorum/proto';


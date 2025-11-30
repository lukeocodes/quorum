/**
 * @quorum/api-client-auth
 * 
 * Client SDK for Quorum API Core (auth, identity, discovery, server directory)
 */

export { QuorumAuthClient, QuorumApiClient } from './client';
export type { QuorumAuthClientConfig, QuorumApiClientConfig } from './client';

// Re-export types from @quorum/proto for convenience
export * from '@quorum/proto';

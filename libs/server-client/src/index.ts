/**
 * @quorum/server-client
 * 
 * Client SDK for Quorum API Server (channels, messages, ai-members, real-time)
 */

export { QuorumServerClient } from './client';
export type { QuorumServerClientConfig } from './client';

// Re-export types from @quorum/proto for convenience
export * from '@quorum/proto';

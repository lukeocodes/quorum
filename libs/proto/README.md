# @quorum/types

Shared TypeScript types for Quorum API contracts.

## Installation

This package is part of the Quorum monorepo and is automatically available to all apps.

```bash
# Build the types
pnpm nx run types:build

# Watch mode
pnpm nx run types:dev
```

## Usage

```typescript
import type { 
  User, 
  Server, 
  Room, 
  Message,
  ApiResponse,
  LoginRequest,
  LoginResponse 
} from '@quorum/types';

// Use types in your code
const handleLogin = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  // ...
};
```

## Type Categories

- **Models**: Database entity types (User, Server, Room, Message, etc.)
- **API Requests**: Request payload types for API endpoints
- **API Responses**: Response types from API endpoints
- **SSE Events**: Server-Sent Event types for real-time updates
- **Enums**: Shared enumerations (MemberType, ServerRole, etc.)

## Building

The package uses `tsup` to build both CommonJS and ESM outputs with TypeScript declarations.


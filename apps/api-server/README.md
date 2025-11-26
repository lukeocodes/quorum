# @quorum/api-server

Server data API for Quorum - handles messages, channels, media, and real-time events.

## Overview

This API server is designed to be self-hostable and handles all server-specific data operations. It works in conjunction with `api-core` (which handles auth and identity).

## Development

```bash
# From workspace root
pnpm nx run api-server:dev

# Or using npm script
npm run dev:server
```

## Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `/channels/*` - Channel CRUD operations
- `/messages/*` - Message CRUD operations
- `/ai-members/*` - AI member management
- `/sse/*` - Server-Sent Events for real-time updates

## Architecture

- **Express.js** - HTTP server
- **PostgreSQL** - Data persistence
- **SSE** - Real-time event streaming

## Dependencies

- `@quorum/proto` - Shared types and schemas
- `@quorum/utils` - Common utilities including mentions/tags

## Future Features

- Message fan-out to multiple servers
- Media upload and processing
- WebSocket support
- Rate limiting and quota management

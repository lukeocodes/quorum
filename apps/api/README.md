# Quorum API

The centralized Express API server for Quorum. Handles all data access, authentication, and real-time updates.

## Features

- 🔐 **Session-based Authentication**: Secure token-based auth with PostgreSQL storage
- 🗄️ **PostgreSQL Database**: Full CRUD operations for servers, rooms, messages, and AI members
- 🔄 **Real-time Updates**: Server-Sent Events (SSE) for live message streaming
- 🔒 **Encrypted API Keys**: AES-256-GCM encryption for AI provider API keys
- 🌐 **CORS Support**: Configurable allowed origins
- 📝 **TypeScript**: Full type safety with shared types library

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm

### Installation

```bash
# From the workspace root
pnpm install

# Navigate to API directory
cd apps/api
```

### Environment Variables

Copy `example.env` to `.env` and configure:

```bash
cp example.env .env
```

Required variables:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quorum

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_character_hex_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4321
```

### Database Setup

```bash
# Create database
createdb quorum

# Run migrations
psql -d quorum -f ../electron/database/schema.sql
```

## Development

```bash
# Start in watch mode
pnpm run dev

# Or from workspace root
pnpm nx run api:dev
```

## Build

```bash
# Build TypeScript
pnpm run build

# Start production server
pnpm run start
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Create new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `POST /auth/validate` - Validate session token

### Servers

- `GET /servers` - List user's servers
- `POST /servers` - Create server
- `GET /servers/public` - List public servers
- `GET /servers/:id` - Get server details
- `PUT /servers/:id` - Update server
- `DELETE /servers/:id` - Delete server
- `GET /servers/:id/members` - List server members
- `POST /servers/:id/invites` - Create invite code
- `POST /servers/join/:code` - Join via invite
- `POST /servers/public/:id/join` - Join public server
- `POST /servers/:id/leave` - Leave server

### Rooms

- `GET /servers/:serverId/rooms` - List rooms in server
- `POST /servers/:serverId/rooms` - Create room
- `GET /rooms/:id` - Get room details
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room
- `POST /rooms/:id/share` - Share room with another server

### Messages

- `GET /rooms/:roomId/messages` - List messages (paginated)
- `POST /rooms/:roomId/messages` - Send message
- `DELETE /messages/:id` - Delete message
- `GET /messages/:id/context` - Get message with context

### AI Members

- `GET /rooms/:roomId/ai-members` - List AI members
- `POST /rooms/:roomId/ai-members` - Add AI member
- `GET /ai-members/:id` - Get AI member details
- `PUT /ai-members/:id` - Update AI member
- `DELETE /ai-members/:id` - Remove AI member

### Real-time (SSE)

- `GET /sse/rooms/:roomId` - Subscribe to room updates
- `GET /sse/subscribe` - Subscribe to all user updates

#### SSE Events

- `connected` - Initial connection established
- `ping` - Keep-alive ping (every 30s)
- `message` - New message in room
- `message_deleted` - Message deleted
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `member_join` - User joined server
- `member_leave` - User left server
- `ai_response_start` - AI started generating response
- `ai_response_chunk` - AI response chunk
- `ai_response_end` - AI finished response
- `room_updated` - Room settings changed
- `server_updated` - Server settings changed

## Authentication

All endpoints except `/auth/signup`, `/auth/login`, `/auth/validate`, and `/servers/public` require authentication.

Send the session token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## HTTP/2 Support

While the current implementation uses HTTP/1.1, you can easily upgrade to HTTP/2 by:

1. Using a reverse proxy (nginx, caddy) with HTTP/2 support
2. Or by modifying the server to use Node.js's `http2` module

### Example with nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name api.quorum.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE specific
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

## Security

- Passwords are hashed using `scrypt` with random salts
- Session tokens are cryptographically secure random bytes
- AI API keys are encrypted using AES-256-GCM
- All database queries use parameterized statements to prevent SQL injection
- CORS is configured to allow only specified origins

## Architecture

See [/docs/API_ARCHITECTURE.md](../../docs/API_ARCHITECTURE.md) for detailed architecture documentation.

## Troubleshooting

### Database Connection Error

```bash
# Ensure PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep quorum

# Verify credentials in .env match your PostgreSQL setup
```

### ENCRYPTION_KEY Not Set

```bash
# Generate a new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "ENCRYPTION_KEY=<generated_key>" >> .env
```

### CORS Errors

Ensure the requesting origin is in `ALLOWED_ORIGINS` in `.env`:

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4321,https://yourdomain.com
```

## License

MIT

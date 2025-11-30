# @quorum/api-client-auth

Auth API client library for Quorum. Provides a typed interface for authentication, identity, discovery, and server directory endpoints.

## Installation

This package is part of the Quorum monorepo and is automatically available to all apps.

```bash
# Build the client
pnpm nx run api-client-auth:build

# Watch mode
pnpm nx run api-client-auth:dev
```

## Usage

### Basic Setup

```typescript
import { QuorumAuthClient } from "@quorum/api-client-auth";

const client = new QuorumAuthClient({
  baseUrl: "http://localhost:3000",
  token: "your-session-token", // Optional
  onTokenChange: (token) => {
    // Save token to storage
    localStorage.setItem("token", token || "");
  },
});
```

### Authentication

```typescript
// Sign up
const { user, token } = await client.signup({
  username: "john",
  email: "john@example.com",
  password: "password123",
  display_name: "John Doe",
});

// Login
const { user, token } = await client.login({
  username_or_email: "john",
  password: "password123",
});

// Logout
await client.logout();

// Get current user
const { user } = await client.getCurrentUser();

// Validate token
const { user } = await client.validateToken("token-here");
```

### Servers

```typescript
// Get all servers
const { servers } = await client.getServers();

// Create server
const { server } = await client.createServer({
  name: "My Server",
  description: "A cool server",
  is_public: false,
});

// Update server
const { server } = await client.updateServer(1, {
  name: "Updated Name",
});

// Delete server
await client.deleteServer(1);

// Get server members
const { members } = await client.getServerMembers(1);

// Create invite
const { invite } = await client.createInvite(1, {
  max_uses: 10,
  expires_in_days: 7,
});

// Join with invite
const { server, member } = await client.joinServerWithInvite("invite-code");

// Get public servers
const { servers } = await client.getPublicServers();

// Join public server
const { member } = await client.joinPublicServer(1);

// Leave server
await client.leaveServer(1);
```

### Rooms

```typescript
// Get rooms in server
const { rooms } = await client.getRooms(1);

// Create room
const { room } = await client.createRoom(1, {
  name: "General",
  description: "General discussion",
});

// Update room
const { room } = await client.updateRoom(1, {
  name: "Updated Room",
});

// Delete room
await client.deleteRoom(1);

// Share channel
await client.shareChannel(1, {
  target_server_id: 2,
});
```

### Messages

```typescript
// Get messages
const result = await client.getMessages(1, {
  page: 1,
  limit: 50,
});

// Send message
const { message } = await client.sendMessage(1, {
  content: "Hello, world!",
  reply_to_message_id: 123, // Optional
});

// Delete message
await client.deleteMessage(1);

// Get message context
const { message, context } = await client.getMessageContext(1, 5);
```

### AI Members

```typescript
// Get AI members
const { ai_members } = await client.getAIMembers(1);

// Create AI member
const { ai_member } = await client.createAIMember(1, {
  name: "GPT-4",
  provider: "openai",
  model: "gpt-4",
  api_key: "sk-...",
  persona: "A helpful assistant",
  system_instructions: "You are helpful",
});

// Update AI member
const { ai_member } = await client.updateAIMember(1, {
  name: "GPT-4 Turbo",
  model: "gpt-4-turbo",
});

// Delete AI member
await client.deleteAIMember(1);
```

### Real-time Updates (SSE)

```typescript
// Subscribe to room updates
const unsubscribe = client.subscribeToRoom(
  1,
  (event) => {
    console.log("Event:", event.type, event.data);

    switch (event.type) {
      case "message":
        // Handle new message
        break;
      case "ai_response_chunk":
        // Handle AI response streaming
        break;
      // ... other event types
    }
  },
  (error) => {
    console.error("SSE error:", error);
  }
);

// Later: unsubscribe
unsubscribe();

// Subscribe to all user updates
const unsubscribeAll = client.subscribeToUpdates(
  (event) => {
    console.log("Global event:", event.type, event.data);
  },
  (error) => {
    console.error("SSE error:", error);
  }
);
```

### SSE Event Types

- `connected` - Initial connection established
- `ping` - Keep-alive ping
- `message` - New message
- `message_deleted` - Message deleted
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `member_join` - User joined server
- `member_leave` - User left server
- `ai_response_start` - AI started generating
- `ai_response_chunk` - AI response chunk
- `ai_response_end` - AI finished
- `ai_response_error` - AI error
- `room_updated` - Room settings changed
- `room_deleted` - Room deleted
- `server_updated` - Server settings changed

## Error Handling

```typescript
try {
  const { user } = await client.login({
    username_or_email: "john",
    password: "wrong-password",
  });
} catch (error) {
  console.error("Login failed:", error.message);
}
```

## TypeScript

The client is fully typed using types from `@quorum/types`. All requests and responses are type-safe.

```typescript
import type {
  User,
  Server,
  Room,
  Message,
  AIMember,
  SSEEvent,
} from "@quorum/api-client-auth";
```

## License

MIT

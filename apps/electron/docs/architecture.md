# Quorum Architecture

## Overview

Quorum is an Electron-based desktop application that enables multi-user collaborative discussions between humans and multiple AI agents across different servers and channels.

## Key Architectural Decisions

### Multi-User Authentication System

Quorum implements a secure user authentication system:

- **User Accounts**: Each user has their own account with username, email, and encrypted password
- **Session Management**: Sessions are stored in PostgreSQL with token-based authentication
- **Persistent Sessions**: Auth tokens are stored in localStorage for seamless re-authentication
- **Password Security**: Passwords are hashed using Node.js's scrypt algorithm with salts

### Server/Workspace System

Users can create and join multiple servers (workspaces):

- **Server Ownership**: Each server has an owner who controls server settings
- **Server Members**: Users can be owners, admins, or regular members
- **Server Visibility**: Servers can be public (anyone can join) or private (invite-only)
- **Invite System**: Admins and owners can generate invite codes with optional expiration and usage limits
- **Channel Sharing**: Server owners can share specific channels with other servers (cross-server collaboration)

### Encrypted API Key Storage

Each AI member stores its own encrypted API key:

- **Per-Member Keys**: Users provide API keys when adding AI members to a room
- **AES-256-GCM Encryption**: API keys are encrypted using industry-standard encryption
- **Secure Storage**: Encrypted keys are stored in PostgreSQL, never exposed to the frontend
- **Encryption Key**: A master encryption key is stored in the `.env` file (must be generated for production)
- **No Shared Keys**: Each AI can use a different API key, allowing team members to use their own accounts

### Provider-Level Request Queuing

To support concurrent multi-room discussions while respecting API rate limits, Quorum implements a **provider-level queue system**:

- **One queue per AI provider** (OpenAI, Anthropic, Deepgram, ElevenLabs)
- **Rooms operate independently** - Users can switch between rooms while AIs are responding
- **Parallel processing** - Multiple rooms can have active AI conversations simultaneously
- **Context isolation** - Each request contains the full context for its specific room

#### Example Flow:

1. User enters "fix my problem" room and asks a question
2. AI responses are queued for each AI member in that room
3. User switches to "i have an idea" room and shares an idea
4. AI responses for the second room are also queued
5. Behind the scenes:
   - OpenAI queue processes requests from both rooms sequentially
   - Anthropic queue processes its requests from both rooms sequentially
   - User sees responses appear in real-time in whichever room they're viewing

### Benefits:

- **Rate limit protection** - Provider queues prevent overwhelming APIs
- **Fair resource allocation** - FIFO processing ensures all rooms get responses
- **Non-blocking UX** - Users don't wait idle while AIs respond
- **Concurrent discussions** - Multiple topics can progress simultaneously
- **Individual API Keys** - Users can use their own API keys for cost control

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop Framework**: Electron
- **State Management**: Zustand
- **Database**: PostgreSQL
- **Encryption**: Node.js Crypto (AES-256-GCM)
- **Authentication**: Custom session-based auth with scrypt password hashing
- **AI Providers**: OpenAI, Anthropic
- **Voice Providers**: Deepgram (STT/TTS), ElevenLabs (TTS)

## Directory Structure

```
/electron          - Electron main process
  /main.js         - App entry point
  /preload.js      - IPC bridge
  /database.js     - PostgreSQL connection
  /ipc-handlers.js - IPC event handlers
  /auth-service.js - User authentication and session management
  /server-service.js - Server/workspace operations
  /encryption-service.js - API key encryption/decryption
  /ai-service.js   - AI response generation
  /voice-service.js - STT/TTS integration
  /queue-manager.js - Provider-level request queues

/src               - React frontend
  /components      - UI components
    /AuthScreen.tsx - Login/signup interface
    /ServerSelection.tsx - Server selection and creation
    /MainLayout.tsx - Main app layout
    /RoomSidebar.tsx - Room list sidebar
    /ChatArea.tsx - Message display and input
    /AIMemberManager.tsx - AI member configuration
    /CreateRoomModal.tsx - Room creation modal
  /store           - Zustand state management
    /appStore.ts - Global application state
  /types           - TypeScript definitions

/database          - Database schema
  /schema.sql      - PostgreSQL schema with users, servers, rooms, etc.
/scripts           - Utility scripts
/docs              - Documentation
```

## Database Schema

### User Management
- `users` - User accounts with encrypted passwords
- `sessions` - Active user sessions with tokens

### Server/Workspace System
- `servers` - Workspaces that contain rooms
- `server_members` - User membership in servers (with roles)
- `server_invites` - Invite codes for joining servers
- `channel_shares` - Cross-server room sharing

### Communication
- `rooms` - Discussion channels (linked to servers)
- `ai_members` - AI agents with encrypted API keys
- `messages` - All chat messages using polymorphic member references
  - Uses `member_type` ('user' or 'ai') and `member_id` for unified member handling
  - Supports `reply_to_message_id` for threaded conversations
- `message_mentions` - Tracks @mentions of users and AIs
- `room_summaries` - Auto-maintained conversation summaries

### Polymorphic Member System

Messages and mentions use a polymorphic pattern where both users and AI members are treated as "members":

```sql
-- Messages reference either users or AIs
member_type: 'user' | 'ai'
member_id: references users.id OR ai_members.id

-- Same pattern for mentions
mentioned_member_type: 'user' | 'ai'
mentioned_member_id: references users.id OR ai_members.id
```

This allows unified handling of both user and AI participants in conversations.

## Security Features

1. **Password Hashing**: Scrypt algorithm with random salts
2. **Session Tokens**: Cryptographically secure random tokens
3. **API Key Encryption**: AES-256-GCM encryption for stored API keys
4. **Database Isolation**: Users can only access their own servers and messages
5. **Role-Based Access**: Server owners, admins, and members have different permissions

## IPC Communication

The app uses Electron's IPC for frontend-backend communication:

### Authentication
- User signup/login/logout
- Session validation
- Token management

### Server Management
- Server CRUD operations
- Member management
- Invite creation and validation
- Public server browsing
- Channel sharing

### Room & AI Management
- Room CRUD operations (within servers)
- AI member management (with API key encryption)
- Message sending/receiving
- AI response streaming
- Summary updates

## Environment Variables

Required environment variables in `.env`:

```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quorum

# Encryption Key (REQUIRED - Generate using crypto.randomBytes(32).toString('hex'))
ENCRYPTION_KEY=your_64_character_hex_encryption_key_here

# Development Mode
NODE_ENV=development
```

## API Key Flow

1. **User adds AI member** → Frontend prompts for API key
2. **Key submission** → Sent to backend via IPC
3. **Encryption** → Backend encrypts key using ENCRYPTION_KEY
4. **Storage** → Encrypted key stored in `ai_members.api_key_encrypted`
5. **Usage** → When AI generates response, key is decrypted on-the-fly
6. **Security** → Encrypted key never sent to frontend

## Mention and Reply System

### Mention Tags

Messages use a Discord/Slack-style tagging system:

**Storage Format** (in database):
```
Hey <@user:123> and <@ai:456>, what do you think?
```

**Display Format** (in UI):
```
Hey @JohnDoe and @GPT4, what do you think?
```

### Mention Workflow

1. **User types**: `@JohnDoe hello`
2. **Frontend autocomplete**: Suggests matching users/AIs as you type
3. **Backend conversion**: `@JohnDoe` → `<@user:123>`
4. **Storage**: Tags stored in database
5. **Mentions table**: Tracks all mentions for notifications
6. **AI activation**: If AI is mentioned, queued to respond
7. **Display**: `<@user:123>` → `@JohnDoe` when rendering

### Reply System

1. **Click reply** on any message
2. **Visual indicator** shows in message input
3. **Send message** with `reply_to_message_id` reference
4. **Display**: Shows "Replying to @Name" above message content
5. **Threading**: Creates visual conversation threads

### AI Activation Rules

- AIs **only** respond when explicitly @mentioned
- Multiple AIs can be mentioned in one message
- Each mentioned AI replies to the message they were tagged in
- AI responses include `reply_to_message_id` pointing to the mention

## Multi-User Workflow

1. **Authentication**: User signs up or logs in
2. **Server Selection**: User chooses or creates a server
3. **Room Access**: User interacts with rooms within the server
4. **AI Collaboration**: User adds AI members with their own API keys
5. **Discussion**: User and AIs participate in conversations
6. **Cross-Server Sharing**: Server owners can share channels with other servers

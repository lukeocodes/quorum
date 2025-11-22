# Migration Guide - Quorum Multi-User Update

## Overview

Quorum has been completely refactored from a single-user desktop app to a multi-user collaborative platform with authentication, servers, and advanced messaging features.

## Major Changes

### 1. Multi-User Authentication ✅
- User accounts with signup/login
- Session-based authentication (30-day sessions)
- Secure password hashing (scrypt with salts)
- Persistent sessions via localStorage

### 2. Server/Workspace System ✅
- Users create or join servers (workspaces)
- Server roles: owner, admin, member
- Public servers (anyone can join)
- Private servers (invite-only with invite codes)
- Cross-server channel sharing

### 3. Encrypted API Key Storage ✅
- API keys stored per AI member (not globally)
- AES-256-GCM encryption
- Users provide API key when adding AI to a room
- Keys never exposed to frontend

### 4. Mention System ✅
- Discord/Slack-style @mentions
- Storage: `<@user:123>` or `<@ai:456>`
- Display: `@Username` or `@AIName`
- Real-time autocomplete while typing
- Mentions work for both users and AIs

### 5. Reply System ✅
- Click "Reply" on any message
- Visual reply indicator
- Threaded conversations
- Works for both user and AI messages

### 6. AI Activation Changes ✅
- **OLD**: AIs auto-respond to every message
- **NEW**: AIs only respond when @mentioned
- Better control over AI participation

### 7. Polymorphic Member System ✅
- Unified "member" concept
- Both users and AIs are members
- Cleaner database schema
- Simpler code logic

### 8. Service Organization ✅
- `voice-service.js` - STT (Speech-To-Text)
- `speech-service.js` - TTS (Text-To-Speech)
- Better semantic naming

## Database Changes

### New Tables
- `users` - User accounts
- `sessions` - Auth sessions
- `servers` - Workspaces
- `server_members` - User-server relationships
- `server_invites` - Invite codes
- `channel_shares` - Cross-server sharing
- `message_mentions` - @mention tracking

### Modified Tables
- `messages` - Now uses polymorphic references:
  - `member_type` + `member_id` instead of `user_id` + `ai_member_id`
  - Added `reply_to_message_id`
  - Removed `is_user` flag
- `ai_members` - Added `api_key_encrypted` field
- `rooms` - Added `server_id` foreign key

### Removed Tables
- `settings` - No longer storing API keys globally

## Environment Variables

### Required
```bash
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quorum

# Encryption (REQUIRED - generate with crypto.randomBytes(32).toString('hex'))
ENCRYPTION_KEY=your_64_char_hex_key_here

# Development
NODE_ENV=development
```

### Removed
- `OPENAI_API_KEY` - Now per-AI-member
- `ANTHROPIC_API_KEY` - Now per-AI-member
- `DEEPGRAM_API_KEY` - Optional (for voice features)
- `ELEVENLABS_API_KEY` - Optional (for speech features)

## Updated Dependencies

### Changed Package Names
- `anthropic` → `@anthropic-ai/sdk@^0.32.1`
- `deepgram-client` → `@deepgram/sdk@^3.9.0`
- `elevenlabs` → `@elevenlabs/elevenlabs-js@^2.25.0`

### Version Bumps
- `openai`: `^4.20.0` → `^4.77.0`
- `pg`: `^8.11.3` → `^8.13.1`
- `react`: `^18.2.0` → `^18.3.1`
- `zustand`: `^4.4.7` → `^5.0.2`

### Removed
- `@openai/realtime-api-beta` - Not needed

## New Files

### Backend
- `electron/auth-service.js` - Authentication logic
- `electron/server-service.js` - Server operations
- `electron/encryption-service.js` - API key encryption
- `electron/mention-utils.js` - Mention tag conversion
- `electron/speech-service.js` - TTS (split from voice-service)

### Frontend
- `src/components/AuthScreen.tsx` - Login/signup UI
- `src/components/ServerSelection.tsx` - Server selection UI
- `src/utils/mention-utils.ts` - Frontend mention utilities

### Documentation
- `docs/mentions-and-replies.md` - Mention/reply system docs
- `docs/MIGRATION_GUIDE.md` - This file

## Migration Steps

### 1. Update Dependencies
```bash
pnpm install
```

### 2. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Environment
```bash
cp example.env .env
# Edit .env and set ENCRYPTION_KEY
```

### 4. Reset Database
```bash
# Drop old database
dropdb quorum

# Create fresh database
createdb quorum

# Run migrations
npm run db:migrate
```

### 5. Start Application
```bash
npm run dev
```

## User Flow

### First Time Setup
1. **Sign Up** - Create account
2. **Create Server** - Or join existing server
3. **Create Room** - Start a discussion channel
4. **Add AI** - Add AI member with your API key
5. **Start Chatting** - @mention AI to get responses

### Daily Usage
1. **Login** - Auto-login if session valid
2. **Select Server** - Choose workspace
3. **Select Room** - Choose channel
4. **Message** - Chat with @mentions and replies
5. **Add AIs** - Each with their own API key

## Breaking Changes

### API Changes
- `sendMessage(roomId, content)` → `sendMessage(roomId, content, replyToMessageId?)`
- `getRooms()` → `getRooms(serverId)`
- `createRoom(name, desc)` → `createRoom(serverId, name, desc)`
- `getAIMembers()` requires API key in data parameter

### Message Structure
- `is_user` → `member_type`
- `user_id`/`ai_member_id` → `member_id`
- `ai_name` → `member_name`
- Added `reply_to_message_id`, `reply_to_content`, etc.

### Store Changes
- Added `user`, `authToken`, `currentServer`
- Added `mentionableMembers`
- `sendMessage()` now accepts `replyToMessageId`
- Removed `settings` state (API keys per AI now)

## Features Added

### @Mentions
- Type `@` to see autocomplete
- Works for users and AIs
- Stored as tags, displayed as names
- AIs only respond when mentioned

### Replies
- Click "Reply" button on any message
- Visual indicator shows what you're replying to
- Creates threaded conversations
- Cancel reply with X button

### Server System
- Multi-server support
- Public/private servers
- Invite codes with expiration
- Channel sharing between servers
- Role-based permissions

### Security
- Password hashing (scrypt)
- Session management
- API key encryption (AES-256-GCM)
- Per-user data isolation

## Testing Checklist

- [ ] Sign up new user
- [ ] Login with credentials
- [ ] Create server
- [ ] Create room in server
- [ ] Add AI member (with API key)
- [ ] Send message with @AI mention
- [ ] Verify AI responds
- [ ] Click reply on message
- [ ] Send reply
- [ ] Verify reply indicator shows
- [ ] Create invite code
- [ ] Join server with invite
- [ ] Browse public servers
- [ ] Share channel to another server

## Known Limitations

- Voice input (STT) - Coming soon
- Click mention to view profile - Coming soon
- Click reply to scroll to original - Coming soon
- Notification system - Coming soon
- Edit/delete messages - Coming soon
- File attachments - Coming soon

## Support

If you encounter issues:
1. Check database is running: `pg_isready`
2. Verify migrations ran: Check tables exist
3. Check `.env` has valid `ENCRYPTION_KEY`
4. Check API keys are valid when adding AI members
5. Check browser console for frontend errors
6. Check terminal for Electron main process errors


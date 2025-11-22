# Mentions and Replies System

## Overview

Quorum implements a Discord/Slack-style mention and reply system with:
- **@mentions** for users and AI members
- **Reply functionality** to create conversation threads
- **AI activation via @mention** - AIs only respond when explicitly tagged

## Database Storage

### Tagged Mention Format

Messages are stored with special tags in the content:
- User mentions: `<@user:123>`
- AI mentions: `<@ai:456>`

Example stored message:
```
Hey <@user:42> and <@ai:7>, what do you think about this?
```

### Tables

1. **messages** - Polymorphic member references
   - `member_type`: 'user' or 'ai'
   - `member_id`: ID of the user or AI member
   - `reply_to_message_id`: Optional reference to replied message

2. **message_mentions** - Track all mentions
   - `mentioned_member_type`: 'user' or 'ai'
   - `mentioned_member_id`: ID of mentioned user/AI

## Display Format

The frontend converts tags to readable names:
```
<@user:42>  → @JohnDoe
<@ai:7>     → @GPT4
```

## Mention Workflow

### Sending a Message with Mentions

1. User types: `Hey @JohnDoe what's up?`
2. Frontend sends raw text to backend
3. Backend converts to: `Hey <@user:42> what's up?`
4. Backend saves tagged content to database
5. Backend stores mention in `message_mentions` table

### Displaying Messages

1. Backend sends message with tags: `Hey <@user:42>`
2. Frontend converts to display: `Hey @JohnDoe`
3. Mentions are styled/clickable in UI

## AI Mention Behavior

- AIs **only** respond when explicitly mentioned with @
- When `<@ai:123>` is detected:
  - AI is queued to generate a response
  - AI's response includes `reply_to_message_id` pointing to the mentioning message
- Multiple AIs can be mentioned in one message

## Reply Functionality

### Creating a Reply

1. User clicks "Reply" button on any message
2. MessageInput shows reply indicator with message preview
3. User types response
4. Message is sent with `reply_to_message_id` set

### Displaying Replies

- Messages with `reply_to_message_id` show a visual indicator
- Shows: "Replying to @Name: [message preview]"
- Click to scroll to original message (future feature)

## Implementation Files

### Backend
- `electron/mention-utils.js` - Tag conversion utilities
- `electron/ipc-handlers.js` - Message handling with mentions
- `electron/queue-manager.js` - AI response queuing
- `database/schema.sql` - Polymorphic member schema

### Frontend (To Be Implemented)
- `src/utils/mention-utils.ts` - Frontend tag conversion
- `src/components/MessageInput.tsx` - Reply state & mention autocomplete
- `src/components/MessageList.tsx` - Display mentions & replies
- `src/store/appStore.ts` - Member handling

## API Endpoints

### Get Mentionable Members
```typescript
window.electronAPI.getMentionableMembers(roomId)
// Returns: { users: User[], aiMembers: AIMember[] }
```

### Send Message with Reply
```typescript
window.electronAPI.sendMessage(roomId, content, replyToMessageId?)
```

## Future Enhancements

- [ ] Mention autocomplete dropdown
- [ ] Click mention to view profile
- [ ] Click reply indicator to scroll to original
- [ ] Notification system for user mentions
- [ ] Mention highlighting in message content


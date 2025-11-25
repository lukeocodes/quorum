# Tags, Mentions, and Replies System

## Overview

Quorum implements a comprehensive tagging system inspired by Discord/Slack with support for:
- **@mentions** for users and AI members
- **#channels** for channel/room references
- **#apps** for application references (future feature)
- **!servers** for server references
- **URLs** with both direct and markdown formatting
- **Reply functionality** to create conversation threads
- **AI activation via @mention** - AIs only respond when explicitly tagged
- **Full markdown support** for rich text formatting

## Tag Formats

### Built-in Tags

Messages support the following tag formats:

| Tag Type | Format | Example | Description |
|----------|--------|---------|-------------|
| User | `<@user:ID>` | `<@user:123>` | Mention a user |
| AI | `<@ai:ID>` | `<@ai:456>` | Mention an AI member |
| Channel | `<#channel:ID>` | `<#channel:789>` | Reference a channel/room |
| App | `<#app:ID>` | `<#app:101>` | Reference an application (future) |
| Server | `<!server:ID>` | `<!server:202>` | Reference a server |
| URL (direct) | `<URL>` | `<https://google.com>` | Direct URL link |
| URL (markdown) | `[text](URL)` | `[Google](https://google.com)` | Markdown-style link |

### Display Format

Tags are stored in their tagged format in the database but displayed with friendly names in the UI:

| Stored | Displayed |
|--------|-----------|
| `<@user:123>` | `@JohnDoe` |
| `<@ai:456>` | `@GPT4` |
| `<#channel:789>` | `#general` |
| `<#app:101>` | `#bot-commands` |
| `<!server:202>` | `!MyServer` |
| `<https://example.com>` | `https://example.com` (clickable) |
| `[Click here](https://example.com)` | `Click here` (clickable) |

Example stored message:
```
Hey <@user:42> and <@ai:7>, check out <#channel:123> on <!server:5>!
More info at <https://docs.example.com>
```

Example displayed message:
```
Hey @JohnDoe and @GPT4, check out #announcements on !ProductionServer!
More info at https://docs.example.com
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

## Tag Workflow

### Sending a Message with Tags

1. **User types in natural format:**
   ```
   Hey @JohnDoe, check #general on !ProductionServer
   Here's a link: [Documentation](https://docs.example.com)
   ```

2. **Frontend converts to tagged format:**
   ```
   Hey <@user:42>, check <#channel:123> on <!server:5>
   Here's a link: [Documentation](https://docs.example.com)
   ```

3. **Backend saves tagged content to database**
   - Stores the tagged message content
   - Extracts mention IDs for notifications
   - Stores mentions in `message_mentions` table

4. **Backend queues AI responses if mentioned**
   - Detects `<@ai:ID>` tags
   - Adds AI to response queue

### Displaying Messages

1. **Backend sends message with tags:**
   ```
   Hey <@user:42>, check <#channel:123>
   ```

2. **Frontend resolves tags to display names:**
   ```
   Hey @JohnDoe, check #general
   ```

3. **Frontend renders with styling:**
   - Mentions are highlighted with colored backgrounds
   - Links are clickable and styled
   - Hover states for interactive elements
   - Click handlers for navigation

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

### Shared Libraries

#### `@quorum/types` (`libs/types`)
- `src/models.ts` - Tag type definitions, enums, and patterns
  - `TagType` enum
  - `ParsedTag` interface
  - `TAG_PATTERNS` constants

#### `@quorum/mentions` (`libs/mentions`)
**Core mention and tag handling library - use this for all new code!**

- `src/parser.ts` - Tag parsing utilities
  - `parseAllTags()` - Parse all tag types from content
  - `extractAllTagIds()` - Extract all tag IDs by type
  - `extractMentionIds()` - Extract mention IDs (legacy)

- `src/converter.ts` - Tag conversion utilities
  - `convertMentionsToTags()` - Convert @names to storage tags
  - `convertTagsToDisplay()` - Convert tags to display (sync)
  - `convertTagsToDisplayAsync()` - Convert tags to display (async)
  - `EntityLookup` interface
  - `EntityResolvers` interface

- `src/renderer.tsx` - React rendering utilities
  - `renderMessageWithTags()` - Render tags as styled React elements
  - `<MessageWithTags />` - React component wrapper
  - `TagClickHandlers` interface
  - `TagStyles` interface

### Application Implementations

**All applications now import directly from `@quorum/mentions` - no wrapper files!**

#### API (`apps/api`)
- `src/services/message.service.ts` - Uses `@quorum/mentions` for tag extraction
- All API code imports directly: `import { ... } from '@quorum/mentions'`

#### Electron Backend (`apps/electron/electron`)
- `ipc-handlers.js` - Uses `@quorum/mentions` for tag conversion
  - `require('@quorum/mentions')` for CJS compatibility
- `queue-manager.js` - AI response queuing
- `database/schema.sql` - Polymorphic member schema

#### Electron Frontend (`apps/electron/src`)
- `components/MessageList.tsx` - Uses `renderMessageWithTags()` from `@quorum/mentions`
- `components/MessageInput.tsx` - Reply state & tag autocomplete
- `store/appStore.ts` - Entity management

**Import pattern:**
```typescript
// TypeScript/ESM
import { parseAllTags, renderMessageWithTags } from '@quorum/mentions';

// CommonJS (Node.js)
const { parseAllTags, convertMentionsToTags } = require('@quorum/mentions');
```

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

## Usage Examples

### Parsing Tags (TypeScript/React)

```typescript
import { parseAllTags, renderMessageWithTags } from '@quorum/mentions';
import { useAppStore } from '../store/appStore';

function MessageComponent({ content }: { content: string }) {
  const { mentionableMembers, rooms, currentServer } = useAppStore();
  
  // Parse tags to extract IDs
  const tags = parseAllTags(content);
  console.log('Found tags:', tags);
  
  // Render with styled components
  const renderedContent = renderMessageWithTags(
    content,
    {
      users: mentionableMembers?.users || [],
      aiMembers: mentionableMembers?.aiMembers || [],
      channels: rooms,
      servers: currentServer ? [currentServer] : [],
    },
    {
      handlers: {
        onUserClick: (userId) => console.log('User clicked:', userId),
        onChannelClick: (channelId) => console.log('Channel clicked:', channelId),
      }
    }
  );
  
  return <div className="message-content">{renderedContent}</div>;
}
```

### Converting User Input to Tags (Backend/Frontend)

```typescript
import { convertMentionsToTags, extractAllTagIds } from '@quorum/mentions';

// User types: "Hey @john, check #general"
const userInput = "Hey @john, check #general";

// Convert to tags
const result = convertMentionsToTags(userInput, {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
  channels: [{ id: 10, name: 'general' }],
});

// result.content: "Hey <@user:1>, check <#channel:10>"
// result.mentioned: { users: [...], channels: [...], ai: [], servers: [] }

// Extract IDs for database storage
const tagIds = extractAllTagIds(result.content);
// { users: [1], channels: [10], ai: [], apps: [], servers: [] }
```

### Displaying Tags

```typescript
import { convertTagsToDisplay } from '@quorum/mentions';

const storedContent = "Hey <@user:1>, check <#channel:10>";

// Sync version with entity lookup
const displayContent = convertTagsToDisplay(storedContent, {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
  channels: [{ id: 10, name: 'general' }],
});
// displayContent: "Hey @John Doe, check #general"

// Async version with resolvers (server-side)
import { convertTagsToDisplayAsync } from '@quorum/mentions';

const displayContentAsync = await convertTagsToDisplayAsync(storedContent, {
  getUser: async (id) => await database.getUserById(id),
  getChannel: async (id) => await database.getChannelById(id),
});
```

### URL Handling

```typescript
import { parseAllTags } from '@quorum/mentions';

// Direct URLs: <https://example.com>
const directURL = "Check out <https://example.com> for more info";

// Markdown URLs: [text](url)
const markdownURL = "Check out [our docs](https://docs.example.com) for more info";

// Both are parsed and rendered as clickable links
const tags = parseAllTags(markdownURL);
// tags[0]: { type: 'url', url: 'https://docs.example.com', text: 'our docs', ... }
```

## Styling Tags

Tags are rendered with different colors and backgrounds:

- **Users**: Color from `user.avatar_color` with 20% opacity background
- **AI Members**: Color from `ai.avatar_color` with 20% opacity background
- **Channels**: Blue (`#5865f2`) with 20% opacity background
- **Apps**: Purple (`#9b59b6`) with 20% opacity background
- **Servers**: Red (`#e74c3c`) with 20% opacity background
- **URLs**: Blue (`#00a8ff`) with underline

All tags have:
- `2px 6px` padding
- `4px` border radius
- `500` font weight
- Hover effects for clickable elements

## Future Enhancements

- [ ] Tag autocomplete dropdown (@ for mentions, # for channels, ! for servers)
- [ ] Click mention to view user/AI profile
- [ ] Click channel to navigate to channel
- [ ] Click server to switch servers
- [ ] Click reply indicator to scroll to original message
- [ ] Notification system for user mentions
- [ ] Tag highlighting in message editor
- [ ] Tag suggestions based on context
- [ ] App integration system (`<#app:ID>`)
- [ ] Rich hover cards for tags (preview info)
- [ ] Tag analytics (most mentioned users/channels)


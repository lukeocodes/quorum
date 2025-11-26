# Tag System Quick Reference

## Supported Tag Types

| Type | Format | Example | User Types | Storage Format |
|------|--------|---------|------------|----------------|
| **User** | `@username` | `@john` | `@john` or `@"John Doe"` | `<@user:123>` |
| **AI** | `@ainame` | `@gpt4` | `@gpt4` | `<@ai:456>` |
| **Channel** | `#channel` | `#general` | `#general` | `<#channel:789>` |
| **App** | `#app` | `#bot` | `#bot` | `<#app:101>` |
| **Server** | `!server` | `!prod` | `!prod` | `<!server:202>` |
| **URL Direct** | `<url>` | `<https://...>` | `<https://google.com>` | `<https://google.com>` |
| **URL Markdown** | `[text](url)` | `[Click](https://...)` | `[Google](https://google.com)` | `[Google](https://google.com)` |

## Tag Patterns (Regex)

```typescript
export const TAG_PATTERNS = {
  user: /<@user:(\d+)>/g,
  ai: /<@ai:(\d+)>/g,
  channel: /<#channel:(\d+)>/g,
  app: /<#app:(\d+)>/g,
  server: /<!server:(\d+)>/g,
  urlDirect: /<(https?:\/\/[^\s>]+)>/g,
  urlMarkdown: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
};
```

## Common Operations

### Parse Tags from Content

```typescript
import { parseAllTags } from '@quorum/types';

const content = "Hey <@user:1>, check <#channel:10>";
const tags = parseAllTags(content);
// Returns: [{ type: 'user', id: 1, ... }, { type: 'channel', id: 10, ... }]
```

### Convert User Input to Tags

```typescript
import { convertMentionsToTags } from '@quorum/utils';

const result = convertMentionsToTags("Hey @john #general", {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
  channels: [{ id: 10, name: 'general' }],
});
// result.content: "Hey <@user:1> <#channel:10>"
// result.mentioned: { users: [...], channels: [...], ai: [], servers: [] }
```

### Convert Tags to Display

```typescript
import { convertTagsToDisplay } from '@quorum/utils';

const display = convertTagsToDisplay("Hey <@user:1>", {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
});
// display: "Hey @John Doe"
```

### Render Tags in React

```tsx
import { renderMessageWithTags } from '@quorum/utils';

function Message({ content, entities }) {
  return (
    <div className="message">
      {renderMessageWithTags(content, entities, {
        handlers: {
          onUserClick: (id) => console.log('User:', id),
          onChannelClick: (id) => console.log('Channel:', id),
        }
      })}
    </div>
  );
}
```

### Extract Tag IDs

```typescript
import { extractAllTagIds } from '@quorum/utils';

const ids = extractAllTagIds("Hey <@user:1> <@ai:2> <#channel:3>");
// ids: { users: [1], ai: [2], channels: [3], apps: [], servers: [] }
```

## Tag Styling

Default styles applied by `renderMessageWithTags()`:

```css
/* Users & AI - Dynamic color based on avatar_color */
.mention-user, .mention-ai {
  background-color: {avatar_color}20; /* 20% opacity */
  color: {avatar_color};
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Channels */
.mention-channel {
  background-color: #5865f220;
  color: #5865f2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Apps */
.mention-app {
  background-color: #9b59b620;
  color: #9b59b6;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Servers */
.mention-server {
  background-color: #e74c3c20;
  color: #e74c3c;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* URLs */
.message-link {
  color: #00a8ff;
  text-decoration: underline;
}
```

## Database Storage

### Messages Table
- Store content with tags: `<@user:123>`, `<#channel:456>`, etc.
- Content is stored in tagged format for consistency

### Message Mentions Table
- Track all mentions for notifications
- Polymorphic: `mentioned_member_type` + `mentioned_member_id`

### Example Flow

1. **User types:** `Hey @john, check #general`
2. **Frontend converts:** `Hey <@user:1>, check <#channel:10>`
3. **Backend stores:** Content with tags in database
4. **Backend extracts:** User IDs `[1]`, Channel IDs `[10]`
5. **Backend creates:** Mention records for notifications
6. **Frontend displays:** `Hey @John Doe, check #general` (with styling)

## API Integration

### Get Mentionable Entities

```typescript
// Fetch users and AI members for autocomplete
const response = await fetch(`/api/rooms/${roomId}/mentionable-members`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { users, aiMembers } = await response.json();
```

### Send Message with Tags

```typescript
// Send message with tagged content
const response = await fetch(`/api/rooms/${roomId}/messages`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: "Hey <@user:1>, check <#channel:10>",
    reply_to_message_id: null, // Optional
  }),
});
```

## Markdown Support

All standard markdown is supported alongside tags:

```markdown
**Bold** _italic_ `code`

# Heading
## Subheading

- List item 1
- List item 2

> Blockquote

Hey <@user:1>, check this [link](https://example.com)!
```

## Files

- **Shared Library:** `libs/mentions/` - **Use this for all tag functionality!**
- **Types:** `libs/types/src/models.ts`
- **Documentation:** `apps/electron/docs/mentions-and-replies.md`

All apps import directly from `@quorum/utils` - no wrapper files needed!


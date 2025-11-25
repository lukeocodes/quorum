# @quorum/mentions

Comprehensive tagging and mention system for the Quorum platform.

## Features

- ✅ **User mentions**: `<@user:123>` → `@JohnDoe`
- ✅ **AI mentions**: `<@ai:456>` → `@GPT4`
- ✅ **Channel references**: `<#channel:789>` → `#general`
- ✅ **App references**: `<#app:101>` → `#bot` (future feature)
- ✅ **Server references**: `<!server:202>` → `!MyServer`
- ✅ **Direct URLs**: `<https://example.com>`
- ✅ **Markdown URLs**: `[text](https://example.com)`
- ✅ **React components** for styled rendering
- ✅ **TypeScript** with full type safety

## Installation

This library is part of the Quorum monorepo and uses workspace protocol:

```json
{
  "dependencies": {
    "@quorum/mentions": "workspace:*"
  }
}
```

## Usage

### Parsing Tags

```typescript
import { parseAllTags, extractAllTagIds } from '@quorum/mentions';

const content = "Hey <@user:1>, check <#channel:10>";
const tags = parseAllTags(content);
// Returns: [{ type: 'user', id: 1, ... }, { type: 'channel', id: 10, ... }]

const ids = extractAllTagIds(content);
// Returns: { users: [1], channels: [10], ai: [], apps: [], servers: [] }
```

### Converting User Input to Tags

```typescript
import { convertMentionsToTags } from '@quorum/mentions';

const result = convertMentionsToTags("Hey @john #general", {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
  channels: [{ id: 10, name: 'general' }],
});

// result.content: "Hey <@user:1> <#channel:10>"
// result.mentioned: { users: [...], channels: [...], ai: [], servers: [] }
```

### Converting Tags to Display

```typescript
import { convertTagsToDisplay } from '@quorum/mentions';

const display = convertTagsToDisplay("Hey <@user:1>", {
  users: [{ id: 1, username: 'john', display_name: 'John Doe' }],
});
// display: "Hey @John Doe"
```

### Rendering Tags in React

```tsx
import { renderMessageWithTags, MessageWithTags } from '@quorum/mentions';

// Method 1: Using the render function
function Message({ content, entities }) {
  return (
    <div className="message">
      {renderMessageWithTags(content, entities, {
        handlers: {
          onUserClick: (id) => console.log('User:', id),
          onChannelClick: (id) => console.log('Channel:', id),
        },
      })}
    </div>
  );
}

// Method 2: Using the component
function Message({ content, entities }) {
  return (
    <MessageWithTags
      content={content}
      entities={entities}
      handlers={{
        onUserClick: (id) => console.log('User:', id),
      }}
      className="message-content"
    />
  );
}
```

### Async Resolution (Server-side)

```typescript
import { convertTagsToDisplayAsync } from '@quorum/mentions';

const display = await convertTagsToDisplayAsync("Hey <@user:1>", {
  getUser: async (id) => {
    const user = await db.users.findById(id);
    return { username: user.username, display_name: user.display_name };
  },
});
```

## API Reference

### Parser

- `parseAllTags(content: string): ParsedTag[]` - Parse all tags from content
- `extractAllTagIds(content: string)` - Extract IDs by type
- `extractMentionIds(content: string)` - Extract user/AI mentions only (legacy)

### Converter

- `convertMentionsToTags(content, entities)` - Convert @names to tags
- `convertTagsToDisplay(content, entities)` - Convert tags to display (sync)
- `convertTagsToDisplayAsync(content, resolvers)` - Convert tags to display (async)

### Renderer (React)

- `renderMessageWithTags(content, entities, options)` - Render as React nodes
- `<MessageWithTags />` - React component wrapper

## Tag Formats

| Type | User Types | Storage | Display |
|------|------------|---------|---------|
| User | `@john` | `<@user:123>` | `@John Doe` |
| AI | `@gpt4` | `<@ai:456>` | `@GPT4` |
| Channel | `#general` | `<#channel:789>` | `#general` |
| App | `#bot` | `<#app:101>` | `#bot` |
| Server | `!prod` | `<!server:202>` | `!ProductionServer` |
| URL | `<https://...>` | `<https://...>` | `https://...` |
| Markdown | `[text](url)` | `[text](url)` | `text` (clickable) |

## Styling

Default styles for tags:

```css
/* Users & AI - Dynamic colors */
.mention-user, .mention-ai {
  background-color: {avatar_color}20;
  color: {avatar_color};
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

/* Channels */
.mention-channel {
  background-color: #5865f220;
  color: #5865f2;
}

/* Apps */
.mention-app {
  background-color: #9b59b620;
  color: #9b59b6;
}

/* Servers */
.mention-server {
  background-color: #e74c3c20;
  color: #e74c3c;
}

/* URLs */
.message-link {
  color: #00a8ff;
  text-decoration: underline;
}
```

Custom styles can be provided:

```tsx
<MessageWithTags
  content={content}
  entities={entities}
  styles={{
    user: { fontWeight: 600, padding: '4px 8px' },
    channel: { backgroundColor: 'blue' },
  }}
/>
```

## TypeScript

Full TypeScript support with comprehensive types:

```typescript
import type {
  ParsedTag,
  TagType,
  EntityLookup,
  EntityResolvers,
  MentionedEntities,
  TagClickHandlers,
  TagStyles,
} from '@quorum/mentions';
```

## Dependencies

- `@quorum/types` - Shared type definitions
- `react` (peer, optional) - For rendering utilities

## License

MIT


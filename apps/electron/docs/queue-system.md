# Provider-Level Queue System

## Overview

Quorum implements a sophisticated provider-level request queuing system that enables **concurrent multi-room discussions** while respecting API rate limits.

## The Problem We're Solving

Without proper queuing, several issues arise:

1. **Rate Limiting**: Sending too many requests to AI providers at once hits rate limits
2. **Resource Starvation**: One busy room could monopolize all API calls
3. **Poor UX**: Users would be blocked from switching rooms while waiting
4. **Context Confusion**: Parallel requests could mix contexts between rooms

## Our Solution: Provider-Level Queues

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Room A    │     │   Room B    │     │   Room C    │
│  (3 AIs)    │     │  (2 AIs)    │     │  (4 AIs)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │OpenAI Queue │          │Anthropic Q  │
       │ ┌─────────┐ │          │ ┌─────────┐ │
       │ │Request 1│ │          │ │Request 1│ │
       │ │Request 2│ │          │ │Request 2│ │
       │ │Request 3│ │          │ │Request 3│ │
       │ └─────────┘ │          │ └─────────┘ │
       └──────┬──────┘          └──────┬──────┘
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  OpenAI API │          │Anthropic API│
       └─────────────┘          └─────────────┘
```

### Key Features

#### 1. **One Queue Per Provider**

- Separate queues for OpenAI, Anthropic, Deepgram, ElevenLabs
- Each queue processes requests **sequentially**
- Different providers process **in parallel**

#### 2. **Room Independence**

- Multiple rooms can have active conversations simultaneously
- Each request contains full context for its specific room
- Rooms don't block each other

#### 3. **Non-Blocking UI**

- User messages are sent immediately
- AI responses are queued in the background
- Users can switch rooms while AIs are "thinking"
- Visual indicators show which rooms have pending responses

## Example Flow

Let's walk through a real scenario:

### Step 1: User in Room A

```
User: "Help me fix this bug"
→ Room A has 2 AI members: GPT-4o and Claude Sonnet
→ 2 requests are queued:
   - OpenAI Queue: [Room A - GPT-4o request]
   - Anthropic Queue: [Room A - Claude request]
```

### Step 2: User Switches to Room B

```
User navigates to Room B while AIs in Room A are still responding
User: "I have a new product idea"
→ Room B has 3 AI members: GPT-4o-mini, GPT-4o, Claude Haiku
→ 3 new requests are queued:
   - OpenAI Queue: [Room A - GPT-4o, Room B - GPT-4o-mini, Room B - GPT-4o]
   - Anthropic Queue: [Room A - Claude, Room B - Claude Haiku]
```

### Step 3: Parallel Processing

```
OpenAI Queue processes:
1. ✓ Room A - GPT-4o responds (500ms delay)
2. ✓ Room B - GPT-4o-mini responds (500ms delay)
3. ✓ Room B - GPT-4o responds (500ms delay)

Anthropic Queue processes (in parallel):
1. ✓ Room A - Claude Sonnet responds (500ms delay)
2. ✓ Room B - Claude Haiku responds (500ms delay)
```

### Step 4: Real-Time Updates

- Responses appear in their respective rooms in real-time
- User sees responses even if they're viewing a different room
- Green dots indicate rooms with pending responses
- "AI is thinking..." indicator shows in current room

## Implementation Details

### Queue Manager (`electron/queue-manager.js`)

```javascript
class ProviderQueue {
  constructor(providerName) {
    this.providerName = providerName
    this.queue = []
    this.processing = false
  }

  enqueue(request) {
    this.queue.push(request)
    if (!this.processing) {
      this.processNext()
    }
  }

  async processNext() {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true
    const request = this.queue.shift()
    
    await request.execute()
    
    // 500ms delay between requests to avoid rate limits
    setTimeout(() => this.processNext(), 500)
  }
}
```

### Request Structure

Each queued request contains:

```javascript
{
  roomId: 123,
  aiMember: {
    id: 456,
    name: "Sarah",
    provider: "openai",
    model: "gpt-4o",
    persona: "Product Manager",
    system_instructions: "Be concise..."
  },
  messages: [...], // Full conversation history
  summary: "...",  // Room summary for context
  execute: async () => {
    // Generate response
    // Save to database
    // Notify frontend
  },
  onError: (err) => {
    // Handle errors
  }
}
```

## Benefits

### For Users

✅ **Switch rooms freely** - No waiting for AI responses
✅ **Parallel discussions** - Have multiple conversations going
✅ **Visual feedback** - Know which rooms are active
✅ **No context confusion** - Each room maintains its own thread

### For the System

✅ **Rate limit protection** - Sequential processing per provider
✅ **Fair resource allocation** - FIFO ensures all rooms get attention
✅ **Scalability** - Can handle many concurrent rooms
✅ **Error isolation** - One failed request doesn't block others

## Configuration

### Delay Between Requests

Currently set to **500ms** in `queue-manager.js`:

```javascript
setTimeout(() => {
  this.processNext();
}, 500); // Adjust this value
```

Increase for stricter rate limiting, decrease for faster responses.

### Queue Monitoring

Get real-time queue status:

```javascript
// Frontend
const status = await window.electronAPI.getQueueStatus()
console.log(status)
// {
//   openai: { queueLength: 2, processing: true },
//   anthropic: { queueLength: 0, processing: false }
// }
```

## Future Enhancements

Potential improvements to the queue system:

1. **Priority Queues** - User-facing requests get priority
2. **Adaptive Delays** - Adjust delay based on rate limit headers
3. **Request Batching** - Combine similar requests
4. **Retry Logic** - Automatic retry with exponential backoff
5. **Queue Metrics** - Dashboard showing queue performance

## Debugging

Enable queue logging in `electron/queue-manager.js`:

```javascript
console.log(`[${this.providerName}] Enqueued request. Queue length: ${this.queue.length}`)
console.log(`[${this.providerName}] Processing request for room ${request.roomId}`)
```

Watch the console to see requests flowing through the queues in real-time.


# Quorum

A multi-user collaborative platform for discussions between humans and AI agents. Think Slack/Discord, but every participant can be a human or an AI with its own personality and expertise.

![Quorum](https://img.shields.io/badge/status-beta-blue)
![Electron](https://img.shields.io/badge/electron-28.3-blue)
![React](https://img.shields.io/badge/react-18.3-blue)

## ✨ Features

### 🔐 Multi-User Authentication
- OAuth-style flow (authentication in browser, redirect to app)
- User accounts with secure authentication
- Session-based login with 30-day persistence
- Password hashing with scrypt

### 🏢 Server/Workspace System
- Create unlimited servers (workspaces)
- Public servers (anyone can join) or private (invite-only)
- Invite codes with optional expiration and usage limits
- Cross-server channel sharing
- Role-based permissions (owner, admin, member)

### 🤖 AI Integration
- **Multiple AI Providers** - OpenAI (GPT-4o, GPT-4o-mini) and Anthropic (Claude Sonnet, Haiku)
- **Per-AI API Keys** - Each AI member uses its own encrypted API key
- **Custom Personas** - Give each AI a unique role and personality
- **@Mention Activation** - AIs only respond when explicitly tagged

### 💬 Advanced Messaging
- **@Mentions** - Tag users and AIs (like Discord/Slack)
- **Reply Threads** - Reply to any message to create conversation threads
- **Real-Time Updates** - Messages appear instantly
- **Auto Summaries** - Background conversation summarization

### 🎤 Voice Features (Optional)
- **Speech-to-Text** - Deepgram integration for voice input
- **Text-to-Speech** - Deepgram and ElevenLabs for vocalized responses

### ⚡ Smart Processing
- **Provider-Level Queuing** - Respects API rate limits
- **Concurrent Rooms** - Multiple rooms can have active discussions
- **Parallel Processing** - Different AI providers process in parallel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 12+

### Installation

```bash
# Install dependencies
pnpm install

# Generate encryption key for API key storage
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Configure environment
cp example.env .env
# Edit .env and set your ENCRYPTION_KEY and database credentials

# Set up database
createdb quorum
npm run db:migrate

# Start the app
npm run dev
```

### First Run

1. **Sign Up** - Create your account
2. **Create Server** - Set up your first workspace
3. **Create Room** - Add a discussion channel
4. **Add AI Member** - Provide an API key for OpenAI or Anthropic
5. **Start Chatting** - @mention the AI to get a response!

## 📖 How It Works

### Traditional Flow (Most Apps)
```
User → Message → All AIs respond automatically
```

### Quorum Flow
```
User → "Hey @GPT4 what do you think?" → Only GPT4 responds
User → "What about you @Claude?" → Only Claude responds
User → "@GPT4 @Claude discuss this" → Both respond to the message
```

### Example Use Case

Create a "Product Strategy" room with three AI members:

- **@Sarah** (Product Manager, using your OpenAI key) - Focuses on user value
- **@Alex** (Technical Architect, using team OpenAI key) - Considers implementation  
- **@Jamie** (Devil's Advocate, using Anthropic key) - Challenges assumptions

Ask: "@Sarah @Alex @Jamie should we build feature X?"

Each AI responds with their unique perspective, creating a multi-viewpoint discussion.

## 🏗️ Architecture

### Polymorphic Member System

Both users and AIs are treated as "members":

```sql
-- Messages use polymorphic references
member_type: 'user' | 'ai'
member_id: references users.id OR ai_members.id
```

This unified approach simplifies:
- Message handling
- @Mention system
- Reply threading
- Permission checks

### Mention Tag System

Mentions use internal tags for reliability:

**What you type**: `@JohnDoe what's up?`  
**Stored in DB**: `<@user:123> what's up?`  
**Displayed in UI**: `@JohnDoe what's up?`

Benefits:
- ✅ Mentions survive name changes
- ✅ Unique identification
- ✅ Easy to parse and highlight
- ✅ Works like Discord/Slack

### Encrypted API Keys

Each AI member stores its own encrypted API key:

```
User provides key → AES-256-GCM encryption → Store in DB → Decrypt on-the-fly
```

Why per-AI keys?
- Different team members can use their own accounts
- Better cost tracking
- No single point of failure
- Users control their own keys

### Provider-Level Queuing

```
┌─────────────┐     ┌─────────────┐
│   Room A    │     │   Room B    │
│ @GPT4 @Claude│    │ @GPT4       │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ OpenAI Queue │    │Anthropic Q   │
│ Room A: GPT4 │    │ Room A: Claude│
│ Room B: GPT4 │    │              │
└──────────────┘    └──────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed design.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Electron 28
- **State**: Zustand 5
- **Database**: PostgreSQL
- **Build**: Vite 5
- **AI SDKs**: 
  - `@anthropic-ai/sdk` (Claude)
  - `openai` (GPT)
  - `@deepgram/sdk` (Voice/Speech)
  - `@elevenlabs/elevenlabs-js` (Premium TTS)

## 📁 Project Structure

```
/electron          - Backend (main process)
  /auth-service.js      - User authentication
  /server-service.js    - Server/workspace operations
  /encryption-service.js - API key encryption
  /ai-service.js        - AI response generation
  /voice-service.js     - Speech-to-text (STT)
  /speech-service.js    - Text-to-speech (TTS)
  /queue-manager.js     - Provider queuing
  /ipc-handlers.js      - IPC endpoints (uses @quorum/mentions)
  /database.js          - PostgreSQL connection
  /main.js              - App entry point
  /preload.js           - IPC bridge

/src               - Frontend (React)
  /components           - UI components
  /store                - Zustand state
  /utils                - Utilities
  /types                - TypeScript types

/database          - Schema and migrations
/docs              - Documentation
/scripts           - Utility scripts
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Architecture Overview](docs/architecture.md)
- [Queue System](docs/queue-system.md)
- [Mentions & Replies](docs/mentions-and-replies.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)

## 🔒 Security

- **Password Hashing**: Scrypt with random salts
- **API Key Encryption**: AES-256-GCM
- **Session Management**: Secure token-based sessions
- **Data Isolation**: Users only access their own servers
- **Role-Based Access**: Owners, admins, and members have different permissions

## 🎮 Usage Examples

### Basic Chat
```
You: @GPT4 explain quantum computing
GPT4: *responds with explanation*
```

### Multi-AI Discussion
```
You: @Claude @GPT4 debate: tabs vs spaces
Claude: *gives perspective*
GPT4: *gives counter-perspective*
You: @Claude what do you think of @GPT4's point?
Claude: *responds to GPT4's argument*
```

### Threaded Replies
```
You: What's the best database?
@GPT4: *suggests PostgreSQL*
You: [clicks Reply on GPT4's message]
You: Why PostgreSQL over MySQL?
GPT4: *responds specifically to your question*
```

## 🚧 Roadmap

### Coming Soon
- [ ] Message editing and deletion
- [ ] File attachments
- [ ] Rich text formatting
- [ ] Voice input (STT UI)
- [ ] Click mention to view profile
- [ ] Click reply to jump to message
- [ ] User mention notifications
- [ ] Search messages
- [ ] Export conversations

### Future Features
- [ ] AI memory/context management
- [ ] Custom AI model parameters
- [ ] Voice channels
- [ ] Reaction emojis
- [ ] Message threads (separate from replies)
- [ ] Server templates
- [ ] Integration webhooks

## 🐛 Known Issues

- Voice input UI not yet implemented (backend ready)
- Large codebases may need context window management
- API rate limits depend on your provider tier

## 💡 Tips

- **Multiple Perspectives**: Add 2-4 AI members with different personas
- **Model Variety**: Mix GPT and Claude for diverse viewpoints
- **Smart Mentions**: Only @mention AIs when you need their input
- **Use Replies**: Create threaded discussions for complex topics
- **Server Organization**: Create separate servers for different projects/teams

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with Electron + React
- Powered by OpenAI and Anthropic
- Voice capabilities via Deepgram and ElevenLabs
- Inspired by Slack and Discord

---

**Questions?** Check out the [docs](docs/) or open an issue!

# Getting Started with Quorum

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (running locally or remotely)

## Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up PostgreSQL**:
   - Ensure PostgreSQL is running
   - Create a database named `quorum`:
     ```bash
     createdb quorum
     ```
   - Or use custom database settings by creating a `.env` file (see `.env.example`)

3. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

## First Run Setup

On first launch, Quorum will prompt you to configure your AI providers:

### Required (at least one):
- **OpenAI API Key** - For GPT models
- **Anthropic API Key** - For Claude models

### Optional:
- **Deepgram API Key** - For speech-to-text and text-to-speech
- **ElevenLabs API Key** - For high-quality text-to-speech

You can get API keys from:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Deepgram: https://console.deepgram.com/
- ElevenLabs: https://elevenlabs.io/

## Using Quorum

### Creating a Room

1. Click "New Room" in the sidebar
2. Give it a name (e.g., "Product Brainstorm")
3. Optionally add a description
4. Click "Create Room"

### Adding AI Members

1. Select a room
2. Click "AI Members" in the top right
3. Click "Add AI Member"
4. Configure:
   - **Name**: Give your AI a name
   - **Provider**: Choose OpenAI or Anthropic
   - **Model**: Select the model
   - **Persona**: (Optional) Define their role (e.g., "Product Manager")
   - **System Instructions**: (Optional) Custom instructions for behavior
5. Click "Add Member"

### Starting a Discussion

1. Type your message in the input field
2. Press Enter or click "Send"
3. Watch as each AI member responds in turn
4. The conversation summary updates automatically

### Parallel Discussions

- You can create multiple rooms
- Switch between rooms while AIs are responding
- Green dots indicate rooms with active AI responses
- Each room maintains its own context and conversation

## Tips

- **Multiple Perspectives**: Add 2-3 AI members with different personas for richer discussions
- **Model Variety**: Mix different models (GPT-4o, Claude Sonnet) for diverse viewpoints
- **Clear Instructions**: Use system instructions to guide AI behavior
- **Summary View**: Click "Summary" to see a condensed version of the conversation

## Troubleshooting

### Database Connection Issues

If you see database errors:
1. Ensure PostgreSQL is running: `ps aux | grep postgres`
2. Check your database credentials in `.env`
3. Verify the database exists: `psql -l | grep quorum`

### API Key Issues

- Keys are stored in the database after initial setup
- To update keys, you'll need to modify the `settings` table directly
- Future releases will include a settings UI

### Performance

- The app uses provider-level queuing to avoid rate limits
- Delays between AI responses are normal and intentional
- Multiple rooms can run concurrently without issues

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run database migrations
npm run db:migrate
```

## Architecture

See [architecture.md](./architecture.md) for detailed information about:
- Provider-level request queuing
- Concurrent multi-room support
- Database schema
- IPC communication


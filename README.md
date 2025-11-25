# Quorum Monorepo

A Slack-like desktop application for discussions between humans and AIs, built with NX monorepo architecture.

## ✨ Key Features

- **🖥️ Multi-Server Support**: Connect to multiple Quorum servers simultaneously, just like Slack or Discord
- **👥 Isolated User Sessions**: Use different accounts on different servers
- **🔐 Independent Authentication**: Each server maintains its own session
- **🎨 Discord/Slack-Style UI**: Servers displayed in a narrow left sidebar with easy switching
- **🌐 Web-Based Setup**: Add servers via browser authentication
- **🤖 AI Collaboration**: Discuss with multiple AI agents (OpenAI, Anthropic)
- **💬 Rich Messaging**: Mentions, replies, threaded conversations
- **🏢 Workspace Management**: Servers, rooms, members, and roles
- **🔒 Secure**: Encrypted API keys, session management, role-based access

## Project Structure

This is an NX monorepo (`@quorum/nx`) containing:

### Applications

- **apps/electron** (`@quorum/electron`) - Electron desktop application
- **apps/api** (`@quorum/api`) - Express.js REST API backend
- **apps/web** (`@quorum/web`) - Astro marketing/documentation website

### Shared Libraries

- **libs/components** (`@quorum/components`) - Shared React components (Button, Card, Badge, etc.)
- **libs/types** (`@quorum/types`) - Shared TypeScript types for API contracts
- **libs/api-client** (`@quorum/api-client`) - Type-safe API client library
- **libs/eslint-config** (`@quorum/eslint-config`) - Shared ESLint configuration
- **libs/prettier-config** (`@quorum/prettier-config`) - Shared Prettier configuration
- **libs/tailwind-config** (`@quorum/tailwind-config`) - Shared Tailwind CSS configuration
- **libs/tsconfig** (`@quorum/tsconfig`) - Shared TypeScript configurations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- PostgreSQL database (for Electron app)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared libraries (REQUIRED - run before first start)
pnpm run setup

# 3. Set up environment variables
cp apps/api/example.env apps/api/.env
cp apps/web/example.env apps/web/.env
cp apps/electron/example.env apps/electron/.env

# 4. Generate encryption key for API
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add the output to apps/api/.env as ENCRYPTION_KEY=<generated-key>

# 5. Run database migrations
pnpm db:migrate

# 6. Start everything
pnpm run dev:all
```

**Important**: You must run `pnpm run setup` before the first start to build the shared libraries (`@quorum/types`, `@quorum/api-client`, `@quorum/components`).

## Available Commands

### Development

- `pnpm dev:all` - Start all applications in parallel
- `pnpm dev:electron` - Start the Electron app only
- `pnpm dev:api` - Start the API server only
- `pnpm dev:web` - Start the Astro website only

### Building

- `pnpm build` - Build all applications
- `pnpm build:electron` - Build the Electron app
- `pnpm build:api` - Build the API server
- `pnpm build:web` - Build the Astro website

### Other Commands

- `pnpm preview:web` - Preview the built Astro website
- `pnpm start:api` - Start the API server in production mode
- `pnpm package:electron` - Package the Electron app for distribution
- `pnpm db:migrate` - Run database migrations
- `pnpm graph` - Visualize the project dependency graph
- `pnpm reset` - Clear NX cache

## Multi-Server Architecture

Quorum supports connecting to multiple independent Quorum API servers, similar to how Slack and Discord work. This allows you to:

- **Connect to multiple workspaces**: Personal server, work server, community servers, etc.
- **Use different accounts**: Each server can have a different user login
- **Independent sessions**: Desktop app maintains connections without requiring the web app
- **Easy switching**: Click between servers in the left sidebar

### How It Works

1. **Add a Server**: Click the "+" button in the server sidebar
2. **Authenticate via Web**: System browser opens to the web app for login
3. **Select Server**: Choose which server to add to your desktop app
4. **Automatic Setup**: Connection is established and server appears in sidebar
5. **Switch Anytime**: Click any server icon to switch between them

Each server connection stores:
- API endpoint URL
- Authentication token
- User info for that server
- Cached data for offline access

### Technical Details

- **Local Storage**: SQLite database for connection management
- **Protocol Handler**: Custom `quorum://` protocol for web-to-desktop communication
- **API Discovery**: REST endpoints for server listing and connection setup
- **State Management**: Zustand store with per-connection state isolation

For more information, see:
- [Multi-Server Architecture Documentation](./docs/MULTI_SERVER_ARCHITECTURE.md)
- [OAuth Flow Documentation](./apps/electron/docs/oauth-flow.md)

## Apps

### Electron App (`apps/electron`)

**@quorum/electron** - The main desktop application

**Tech Stack:**

- Electron
- React + TypeScript
- Vite
- Tailwind CSS
- PostgreSQL

**Port:** N/A (Desktop app)

See [apps/electron/README.md](./apps/electron/README.md) for more details.

### API Server (`apps/api`)

**@quorum/api** - Centralized REST API backend server

**Tech Stack:**

- Express.js + TypeScript
- PostgreSQL (via pg)
- Server-Sent Events (SSE) for real-time updates
- AES-256-GCM encryption
- Session-based authentication

**Features:**
- Full REST API with 36 endpoints
- User authentication (signup, login, session management)
- Server/workspace management
- Room/channel management
- Real-time messaging with SSE
- AI member management with encrypted API keys
- CORS support

**Port:** 3000 (configurable via PORT env var)

See [apps/api/README.md](./apps/api/README.md) for more details.

### Web App (`apps/web`)

**@quorum/web** - OAuth authentication portal and marketing website

**Tech Stack:**

- Astro + TypeScript
- React (via @quorum/components)
- Tailwind CSS

**Features:**
- OAuth-style authentication flow
- Login and signup pages
- Redirect back to Electron with session token
- Marketing pages

**Port:** 4321

See [apps/web/README.md](./apps/web/README.md) for more details.

## Development

This monorepo uses:

- **NX** for build orchestration and task running
- **pnpm** for package management with workspace support
- **TypeScript** for type safety across all apps
- **Tailwind CSS** for styling (Electron and Web apps)
- **Shared configurations** for consistent tooling across projects

### Shared Configurations & Components

All apps use shared configurations and components from `libs/`:

- **Components** (`@quorum/components`): Reusable React UI components
- **Types** (`@quorum/types`): Shared TypeScript types for API contracts
- **API Client** (`@quorum/api-client`): Type-safe API client library with SSE support
- **ESLint** (v9+): Consistent linting rules with framework-specific presets using flat config format
- **Prettier**: Unified code formatting with plugin support
- **Tailwind**: Common design tokens and utilities
- **TypeScript**: Base compiler options with framework-specific extensions

### Editor Configuration

The repository includes VSCode/Cursor settings for:

- Tailwind CSS IntelliSense (using root `tailwind.config.js`)
- ESLint integration
- Prettier formatting
- TypeScript support
- Astro language support

### Running All Apps Together

```bash
pnpm dev:all
```

This will start:

- Electron app on http://localhost:5173 (Vite dev server)
- API server on http://localhost:3000
- Web app on http://localhost:4321

### Project Graph

Visualize the project structure and dependencies:

```bash
pnpm graph
```

## Architecture

See [apps/electron/docs/architecture.md](./apps/electron/docs/architecture.md) for detailed architectural information about the Electron app.

## Adding New Apps or Libraries

### Create a New Library

```bash
pnpm nx g @nx/js:library my-lib --directory=libs/my-lib
```

Or manually create the library following the pattern of existing shared configs.

### Create a New Application

Manually create the app directory and configuration files, following the pattern of existing apps:

1. Create `apps/my-app/` directory
2. Add `package.json` with `@quorum/my-app` name
3. Add `project.json` with NX configuration
4. Extend shared configs (`@quorum/tsconfig`, `@quorum/eslint-config`, etc.)
5. Update root scripts if needed

### Using Shared Configs

In your new app:

```js
// tsconfig.json
{
  "extends": "@quorum/tsconfig/node.json", // or /react.json or /astro.json
  "compilerOptions": { /* overrides */ }
}

// .eslintrc.js
module.exports = {
  extends: ['@quorum/eslint-config'], // or /react or /astro
};

// .prettierrc.js
module.exports = {
  ...require('@quorum/prettier-config'), // or /react or /astro
};

// tailwind.config.js (if using Tailwind)
const baseConfig = require('@quorum/tailwind-config');
module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
};
```

## Architecture

Quorum uses a **centralized API architecture** where all data flows through the Express API:

```
┌─────────────────┐
│  Electron App   │  ← Desktop client
│  (In Progress)  │
└────────┬────────┘
         │ HTTP/2 + SSE
         │
    ┌────▼─────────────┐
    │   Express API    │  ← Central server
    │   (@quorum/api)  │
    └────────┬─────────┘
             │ PostgreSQL
    ┌────────▼─────────┐
    │   PostgreSQL     │  ← Database
    └──────────────────┘

┌─────────────────┐
│   Web App       │  ← OAuth portal
│ (@quorum/web)   │
└────────┬────────┘
         │ HTTP
         │
    ┌────▼─────────────┐
    │   Express API    │
    └──────────────────┘
```

### Key Features

- **Centralized Data Access**: All data flows through the API
- **OAuth Authentication**: Web-based login redirects to Electron with token
- **Real-time Updates**: Server-Sent Events (SSE) for live messaging
- **Type Safety**: Shared types across all apps via `@quorum/types`
- **API Client**: Type-safe client library via `@quorum/api-client`
- **Encrypted Storage**: AI API keys encrypted with AES-256-GCM

### Documentation

- **Architecture**: [docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)
- **Migration Guide**: [docs/API_MIGRATION_GUIDE.md](./docs/API_MIGRATION_GUIDE.md)
- **Implementation Summary**: [docs/API_IMPLEMENTATION_SUMMARY.md](./docs/API_IMPLEMENTATION_SUMMARY.md)
- **Shared Libraries**: [docs/SHARED_LIBRARIES.md](./docs/SHARED_LIBRARIES.md)

### Current Status

✅ API server fully implemented  
✅ Web OAuth flow complete  
✅ Type system established  
✅ API client library ready  
⏳ Electron migration pending (see migration guide)

## Troubleshooting

### Clear NX Cache

If you encounter build issues:

```bash
pnpm reset
```

### Reinstall Dependencies

```bash
pnpm install
```

## Recent Updates

### ESLint 9 Migration

The project has been upgraded to ESLint 9 with the new flat config format. See [ESLINT_MIGRATION.md](./ESLINT_MIGRATION.md) for details.

### Key Changes

- ✅ ESLint upgraded from v8 to v9
- ✅ All deprecation warnings resolved
- ✅ Flat config format (`eslint.config.js`) for better composition
- ✅ Improved performance and TypeScript support

## License

MIT

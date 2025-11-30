# @quorum/app-web

Main chat client for Quorum (Astro + React).

## Overview

This is the web-based chat client that provides the same functionality as the Electron app but runs in a browser. It shares UI components and state management with the Electron app through shared libraries.

## Development

```bash
# From workspace root
pnpm nx run app-web:dev

# Or using npm script
npm run dev:web
```

## Architecture

- **Astro** - Static site generation and routing
- **React** - UI components and interactivity
- **Tailwind CSS** - Styling
- **Zustand** - State management (shared with app-electron)

## Dependencies

- `@quorum/app` - Shared application core (components, store, adapters)
- `@quorum/proto` - Shared types and schemas
- `@quorum/api-client-auth` - API Core SDK (auth, identity, discovery)
- `@quorum/api-client-user` - API User SDK (profiles, preferences, customization)
- `@quorum/utils` - Common utilities including mentions/tags


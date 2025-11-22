# Migration to NX Monorepo

This document describes the migration from a single-app structure to an NX monorepo.

## Changes Made

### Structure
- All application code moved to `apps/electron/`
- Root now contains only monorepo configuration
- Created `nx.json` for NX configuration
- Created `tsconfig.base.json` for shared TypeScript configuration
- Updated `pnpm-workspace.yaml` to support monorepo structure

### Configuration Files
- Root `package.json` now contains only NX dependencies and monorepo scripts
- App-specific dependencies moved to `apps/electron/package.json`
- Created `apps/electron/project.json` for NX project configuration
- TypeScript configs now extend from root `tsconfig.base.json`

### Scripts
All scripts are now run through NX:
- `pnpm dev` or `pnpm dev:all` - Start the Electron app
- `pnpm build` - Build the Electron app
- `pnpm build:all` - Build all apps in the monorepo
- `pnpm db:migrate` - Run database migrations
- `pnpm package` - Package the Electron app for distribution

### Important Notes

#### Environment Variables
- **The .env file remains at the root** for now
- You may want to move it to `apps/electron/.env` manually
- Remember to update the path in `apps/electron/electron/database.js` if you move it

#### Dependencies
- Root dependencies are NX-related only
- App-specific dependencies are in `apps/electron/package.json`
- Both are managed through the pnpm workspace

## Benefits of NX Monorepo

1. **Scalability**: Easy to add more apps (e.g., a separate admin panel, web version, etc.)
2. **Code Sharing**: Can create shared libraries in `libs/` folder
3. **Build Orchestration**: NX handles dependencies between projects
4. **Caching**: NX caches build results for faster rebuilds
5. **Task Running**: Run tasks across multiple projects efficiently

## Current Apps

The monorepo now includes:

### apps/electron (@quorum/electron)
- **Tech Stack:** Electron, React, TypeScript, Tailwind CSS
- **Purpose:** Desktop application for AI-powered discussions
- **Run:** `pnpm dev:electron`
- **Build:** `pnpm build:electron`

### apps/api (@quorum/api)
- **Tech Stack:** Express.js, TypeScript
- **Purpose:** REST API backend server
- **Port:** 3000
- **Run:** `pnpm dev:api`
- **Build:** `pnpm build:api`

### apps/web (@quorum/web)
- **Tech Stack:** Astro, TypeScript, Tailwind CSS
- **Purpose:** Marketing and documentation website
- **Port:** 4321
- **Run:** `pnpm dev:web`
- **Build:** `pnpm build:web`

## Future Expansion

You can still add more:
- `apps/admin` - Admin dashboard
- `apps/mobile` - Mobile application
- `libs/shared` - Shared code between apps
- `libs/ui` - Shared UI components

## Development Workflow

### Running Apps
```bash
# Run all apps in parallel
pnpm dev:all

# Run individual apps
pnpm dev:electron  # Electron desktop app
pnpm dev:api       # Express API server (port 3000)
pnpm dev:web       # Astro website (port 4321)

# Or directly with NX
pnpm nx run electron:dev
pnpm nx run api:dev
pnpm nx run web:dev
```

### Adding Dependencies
```bash
# Add to specific app
cd apps/electron  # or apps/api or apps/web
pnpm add <package-name>

# Add dev dependency to specific app
cd apps/api
pnpm add -D <package-name>

# Add to root (NX plugins, etc.)
cd /path/to/root
pnpm add -D -w <package-name>
```

### Creating a New App/Library
```bash
# Generate a new library
pnpm nx g @nx/js:library my-lib

# Generate a new application (when plugins are available)
pnpm nx g @nx/node:application my-app
```

## Troubleshooting

### NX Cache
If you encounter issues with cached builds:
```bash
pnpm nx reset
```

### Dependencies
If dependencies aren't resolving correctly:
```bash
pnpm install
```

### Project Graph
To visualize the project structure:
```bash
pnpm nx graph
```


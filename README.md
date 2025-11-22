# Quorum Monorepo

A Slack-like desktop application for discussions between humans and AIs, built with NX monorepo architecture.

## Project Structure

This is an NX monorepo (`@quorum/nx`) containing:

### Applications

- **apps/electron** (`@quorum/electron`) - Electron desktop application
- **apps/api** (`@quorum/api`) - Express.js REST API backend
- **apps/web** (`@quorum/web`) - Astro marketing/documentation website

### Shared Libraries

- **libs/components** (`@quorum/components`) - Shared React components (Button, Card, Badge, etc.)
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
# Install dependencies
pnpm install

# Set up environment variables
# Copy example.env to .env in apps/electron and configure it
cp apps/electron/example.env apps/electron/.env

# Copy example.env to .env in apps/api and configure it (optional)
cp apps/api/example.env apps/api/.env

# Run database migrations (for Electron app)
pnpm db:migrate
```

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

**@quorum/api** - REST API backend server

**Tech Stack:**

- Express.js
- TypeScript
- tsx (for development)

**Port:** 3000 (configurable via PORT env var)

See [apps/api/README.md](./apps/api/README.md) for more details.

### Web App (`apps/web`)

**@quorum/web** - Marketing and documentation website

**Tech Stack:**

- Astro
- TypeScript
- Tailwind CSS

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

# Quorum

Serious attempt at a Slack alternative.

## Quick Start

```bash
pnpm install
pnpm run setup
cp apps/api/example.env apps/api/.env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add output to apps/api/.env as ENCRYPTION_KEY
pnpm db:migrate
pnpm dev:all
```

## Structure

**Apps:**

- `apps/electron` - Desktop client
- `apps/api` - Express REST API (port 3000)
- `apps/web` - Astro auth portal (port 4321)

**Libs:**

- `libs/types` - Shared TypeScript types
- `libs/api-client` - Type-safe API client
- `libs/components` - React components
- `libs/*-config` - ESLint, Prettier, Tailwind, TypeScript configs

## Commands

- `pnpm dev:all` - Start everything
- `pnpm build` - Build all
- `pnpm graph` - View dependency graph

## License

[MIT License](LICENSE).

## Copyright

Copyright (c) 2025 Luke Oliff

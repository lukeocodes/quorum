# Troubleshooting Guide

Common issues and solutions for the Quorum monorepo.

## Configuration Issues

### Shared Config Resolution

**Problem:** Cannot find `@quorum/eslint-config`, `@quorum/tailwind-config`, or other shared configs.

**Solution:** The shared configurations use relative paths, not npm package names. Make sure your config files use the correct paths:

```js
// ✅ Correct - Use relative paths
module.exports = {
  extends: ['../../libs/eslint-config/react'],
};

// ❌ Wrong - Don't use @quorum/ package names
module.exports = {
  extends: ['@quorum/eslint-config/react'],
};
```

### Command Not Found (astro, tsx, etc.)

**Problem:** `sh: astro: command not found` or `sh: tsx: command not found`

**Solution:** The NX targets are configured to use pnpm filters. Make sure:

1. Dependencies are installed: `pnpm install`
2. NX targets use the correct command format:

```json
{
  "executor": "nx:run-commands",
  "options": {
    "command": "pnpm --filter @quorum/web dev",
    "cwd": "{workspaceRoot}"
  }
}
```

## Build Issues

### Components Library Not Building

**Problem:** Apps can't import from `@quorum/components`

**Solution:**

1. Build the components library first:
   ```bash
   pnpm nx run components:build
   ```

2. Or use watch mode during development:
   ```bash
   pnpm nx run components:dev
   ```

### Tailwind CSS Not Working

**Problem:** Tailwind styles not applying or IntelliSense not working

**Solution:**

1. Ensure each app has its own `tailwind.config.js` that extends the shared config
2. Check that the root `tailwind.config.js` exists (for editor support)
3. Make sure content paths include all relevant files:

```js
module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
};
```

4. Restart your editor to reload the Tailwind IntelliSense

## Development Workflow

### Running Multiple Apps

**Problem:** Want to run all apps simultaneously

**Solution:**

```bash
# Run all apps in parallel
pnpm dev:all

# Run specific apps
pnpm dev:electron
pnpm dev:api
pnpm dev:web
```

### Port Conflicts

**Problem:** Port already in use errors

**Solution:**

Default ports:
- Electron (Vite): 5173
- API: 3000
- Web: 4321

Change ports in:
- **Electron:** `apps/electron/vite.config.ts`
- **API:** `apps/api/.env` (PORT variable)
- **Web:** `apps/web/astro.config.mjs`

## TypeScript Issues

### Cannot Find Module

**Problem:** TypeScript can't resolve imports from shared configs

**Solution:**

1. Check that tsconfig extends are using relative paths:
   ```json
   {
     "extends": "../../libs/tsconfig/node.json"
   }
   ```

2. Make sure the shared tsconfig files exist in `libs/tsconfig/`

### Type Errors in Components

**Problem:** Type errors when using `@quorum/components`

**Solution:**

1. Build the components library to generate `.d.ts` files:
   ```bash
   pnpm nx run components:build
   ```

2. Check that `tsconfig.json` includes the correct paths

## pnpm Workspace Issues

### Workspace Not Linking

**Problem:** Shared libraries not accessible to apps

**Solution:**

1. Check `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - apps/*
     - libs/*
   ```

2. Reinstall dependencies:
   ```bash
   pnpm install
   ```

3. Clear pnpm cache if needed:
   ```bash
   pnpm store prune
   pnpm install
   ```

## NX Issues

### NX Cache Problems

**Problem:** Builds failing due to stale cache

**Solution:**

```bash
# Clear NX cache
pnpm nx reset

# Rebuild everything
pnpm install
pnpm build
```

### Project Not Found

**Problem:** NX can't find a project

**Solution:**

1. Check that `project.json` exists in the app/lib directory
2. Verify the project name in `project.json` matches usage
3. Run `pnpm nx show projects` to list all projects

## Electron-Specific Issues

### Electron Won't Start

**Problem:** Electron app doesn't launch

**Solution:**

1. Ensure PostgreSQL is running
2. Check `.env` file exists in `apps/electron/` with correct database credentials
3. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

4. Check for port conflicts (Vite dev server on 5173)

## Astro-Specific Issues

### React Components Not Working in Astro

**Problem:** React components from `@quorum/components` not rendering

**Solution:**

1. Ensure `@astrojs/react` integration is installed:
   ```bash
   cd apps/web
   pnpm add @astrojs/react
   ```

2. Add `client:load` directive to React components:
   ```astro
   <Button client:load>Click Me</Button>
   ```

3. Check `astro.config.mjs` includes React integration:
   ```js
   import react from '@astrojs/react';
   
   export default defineConfig({
     integrations: [react()],
   });
   ```

## Getting Help

If you're still experiencing issues:

1. Check the [NX documentation](https://nx.dev)
2. Review the `SHARED_LIBRARIES.md` guide
3. Check the individual app README files
4. Look at the `.vscode/settings.json` for editor configuration

## Clean Slate

If all else fails, start fresh:

```bash
# Remove all dependencies
rm -rf node_modules apps/*/node_modules libs/*/node_modules

# Remove NX cache
pnpm nx reset

# Reinstall everything
pnpm install

# Build components library
pnpm nx run components:build

# Try running apps
pnpm dev:all
```


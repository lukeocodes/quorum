# Shared Libraries Guide

This document provides an overview of all shared libraries in the Quorum monorepo and how to use them.

## Overview

The `libs/` directory contains reusable configurations and components shared across all applications. This ensures consistency, reduces duplication, and makes maintenance easier.

## Libraries

### 1. @quorum/components

**Location:** `libs/components/`  
**Type:** React Component Library  
**Purpose:** Shared UI components for Electron and Astro (with React integration)

#### Components

- **Button**: Flexible button with variants (primary, secondary, success, warning, danger, ghost) and sizes (sm, md, lg)
- **Card**: Container component with variants (default, bordered, elevated) and padding options
- **Badge**: Label component for status indicators, tags, or counts

#### Usage in React/Electron

```tsx
import { Button, Card, Badge } from '@quorum/components';

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <Badge variant="success">Active</Badge>
      <Button variant="primary" onClick={() => console.log('clicked')}>
        Click Me
      </Button>
    </Card>
  );
}
```

#### Usage in Astro

```astro
---
import { Button, Card, Badge } from '@quorum/components';
---

<Card variant="elevated" padding="lg">
  <Badge variant="success">Active</Badge>
  <Button variant="primary" client:load>
    Click Me
  </Button>
</Card>
```

#### Building

```bash
# Build the library
pnpm nx run components:build

# Watch mode
pnpm nx run components:dev
```

---

### 2. @quorum/eslint-config

**Location:** `libs/eslint-config/`  
**Type:** ESLint Configuration  
**Purpose:** Consistent linting rules across all projects

#### Available Configs

- **Base** (`@quorum/eslint-config`): TypeScript + Node.js
- **React** (`@quorum/eslint-config/react`): React + React Hooks
- **Astro** (`@quorum/eslint-config/astro`): Astro projects

#### Usage

```js
// .eslintrc.js
module.exports = {
  extends: ['@quorum/eslint-config/react'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

---

### 3. @quorum/prettier-config

**Location:** `libs/prettier-config/`  
**Type:** Prettier Configuration  
**Purpose:** Consistent code formatting

#### Available Configs

- **Base** (`@quorum/prettier-config`): Standard formatting
- **React** (`@quorum/prettier-config/react`): React + Tailwind CSS
- **Astro** (`@quorum/prettier-config/astro`): Astro + Tailwind CSS

#### Usage

```js
// .prettierrc.js
module.exports = {
  ...require('@quorum/prettier-config/react'),
};
```

---

### 4. @quorum/tailwind-config

**Location:** `libs/tailwind-config/`  
**Type:** Tailwind CSS Configuration  
**Purpose:** Shared design tokens and utilities

#### Features

- Extended color palette (primary, secondary, success, warning, danger)
- Custom typography (Inter, JetBrains Mono)
- Extended spacing (128, 144)
- Additional border radius (4xl)

#### Usage

```js
// tailwind.config.js
const baseConfig = require('@quorum/tailwind-config');

module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Override or extend as needed
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Add app-specific extensions
    },
  },
};
```

---

### 5. @quorum/tsconfig

**Location:** `libs/tsconfig/`  
**Type:** TypeScript Configuration  
**Purpose:** Base compiler options for different project types

#### Available Configs

- **Base** (`@quorum/tsconfig/base.json`): Common settings
- **Node** (`@quorum/tsconfig/node.json`): Node.js/Express apps
- **React** (`@quorum/tsconfig/react.json`): React apps
- **Astro** (`@quorum/tsconfig/astro.json`): Astro projects

#### Usage

```json
// tsconfig.json
{
  "extends": "@quorum/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

---

## Editor Configuration

### Root Tailwind Config

The repository includes a root-level `tailwind.config.js` that extends the shared config. This is primarily for editor IntelliSense support.

**Location:** `tailwind.config.js`

```js
const baseConfig = require('./libs/tailwind-config');

module.exports = {
  ...baseConfig,
  content: [
    './apps/*/src/**/*.{js,jsx,ts,tsx,astro,html}',
    './apps/*/index.html',
    './libs/components/src/**/*.{js,jsx,ts,tsx}',
  ],
};
```

### VSCode/Cursor Settings

The repository includes `.vscode/settings.json` with:

- Tailwind CSS IntelliSense configuration
- ESLint integration
- Prettier formatting
- TypeScript support
- Astro language support

### EditorConfig

The repository includes `.editorconfig` for consistent editor behavior:

- LF line endings
- UTF-8 encoding
- 2-space indentation for JS/TS/JSON/YAML
- Trim trailing whitespace

---

## Best Practices

### Using Shared Libraries

1. **Always extend, don't copy**: Use shared configs as a base and extend them
2. **Keep app-specific changes minimal**: Only override what's necessary
3. **Update shared configs for common changes**: If multiple apps need it, add it to the shared config
4. **Document overrides**: Comment why you're overriding a shared setting

### Adding New Shared Resources

1. Create a new directory in `libs/`
2. Add `package.json` with `@quorum/<name>` naming
3. Add `project.json` for NX configuration
4. Add proper documentation in README.md
5. Update this guide
6. Test in multiple apps before finalizing

### Building Components

The components library uses `tsup` for building:

- Generates both CJS and ESM outputs
- Includes TypeScript declarations
- Supports watch mode for development

```bash
# Build once
pnpm nx run components:build

# Watch mode (rebuilds on changes)
pnpm nx run components:dev
```

---

## Troubleshooting

### Tailwind IntelliSense Not Working

1. Ensure VSCode/Cursor Tailwind CSS extension is installed
2. Check that `tailwind.config.js` exists at the root
3. Reload the editor window

### Components Not Found

1. Ensure you've run `pnpm install` in the root
2. Build the components library: `pnpm nx run components:build`
3. Check that the app's `package.json` includes `@quorum/components`

### ESLint/Prettier Conflicts

The ESLint config already extends `prettier` to disable conflicting rules. If you see conflicts:

1. Ensure `eslint-config-prettier` is installed
2. Verify ESLint config extends it properly
3. Run Prettier before ESLint

---

## Dependency Graph

```
Apps:
  @quorum/electron
    ├─> @quorum/components
    ├─> @quorum/eslint-config/react
    ├─> @quorum/prettier-config/react
    ├─> @quorum/tailwind-config
    └─> @quorum/tsconfig/react.json

  @quorum/api
    ├─> @quorum/eslint-config
    ├─> @quorum/prettier-config
    └─> @quorum/tsconfig/node.json

  @quorum/web
    ├─> @quorum/components
    ├─> @quorum/eslint-config/astro
    ├─> @quorum/prettier-config/astro
    ├─> @quorum/tailwind-config
    └─> @quorum/tsconfig/astro.json

Components:
  @quorum/components
    ├─> @quorum/eslint-config/react
    ├─> @quorum/prettier-config/react
    └─> @quorum/tsconfig/react.json
```

---

## Future Enhancements

Potential additions to the shared libraries:

- **@quorum/utils**: Shared utility functions
- **@quorum/hooks**: Shared React hooks
- **@quorum/types**: Shared TypeScript types/interfaces
- **@quorum/icons**: Icon components
- **@quorum/themes**: Additional Tailwind themes


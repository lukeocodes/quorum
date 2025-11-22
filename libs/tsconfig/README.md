# @quorum/tsconfig

Shared TypeScript configurations for the Quorum monorepo.

## Available Configurations

### Base Config (`base.json`)

Base configuration with common settings for all projects.

**Features:**
- ES2022 target
- Strict type checking
- ESNext module system
- Node module resolution

### Node Config (`node.json`)

For Node.js/Express applications.

```json
{
  "extends": "@quorum/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Features:**
- CommonJS module system
- Node types included
- Outputs to `dist/` directory

### React Config (`react.json`)

For React applications.

```json
{
  "extends": "@quorum/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Features:**
- React JSX support
- DOM types included
- No emit (bundler handles output)

### Astro Config (`astro.json`)

For Astro projects.

```json
{
  "extends": "@quorum/tsconfig/astro.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Features:**
- Extends Astro's strict config
- DOM types included
- Strict type checking

## Usage

In your app's `tsconfig.json`:

```json
{
  "extends": "@quorum/tsconfig/node.json",
  "compilerOptions": {
    // App-specific overrides
  },
  "include": ["src/**/*"]
}
```

## Common Settings

All configurations include:

- ✅ Strict mode enabled
- ✅ Skip lib check
- ✅ Force consistent casing in file names
- ✅ Resolve JSON modules
- ✅ Isolated modules
- ✅ Warn on unused locals and parameters
- ✅ No fallthrough cases in switch statements
- ✅ Allow synthetic default imports


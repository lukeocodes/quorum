# ESLint 9 Migration Guide

This project has been upgraded to ESLint 9 with the new flat config format.

## What Changed

### ESLint Version
- **Before:** ESLint 8.x with `.eslintrc.js` files
- **After:** ESLint 9.x with `eslint.config.js` files (flat config format)

### Configuration Format

#### Old Format (.eslintrc.js)
```js
module.exports = {
  extends: ['@quorum/eslint-config/react'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

#### New Format (eslint.config.js)
```js
const reactConfig = require('../../libs/eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

## Key Differences

### 1. Flat Config Array
ESLint 9 uses an array of configuration objects instead of a single object with `extends`.

### 2. No More .eslintrc Files
- ❌ `.eslintrc.js`, `.eslintrc.json`, `.eslintrc.yml`
- ✅ `eslint.config.js`

### 3. Ignores Instead of .eslintignore
Ignore patterns are now specified in the config:

```js
{
  ignores: ['dist/**', 'node_modules/**']
}
```

### 4. Files Pattern
Specify which files each config applies to:

```js
{
  files: ['**/*.{js,ts}']
}
```

### 5. No --ext Flag
The `--ext` flag is no longer needed. Just run:

```bash
# Before
eslint src --ext .ts,.tsx

# After
eslint src
```

## Benefits of ESLint 9

1. **Faster**: Better performance and caching
2. **Simpler**: Flat config is easier to understand and compose
3. **Type-safe**: Better TypeScript support
4. **Modern**: Uses latest JavaScript features
5. **No Deprecated Warnings**: All dependencies updated

## Migration Steps for New Apps

If you add a new app to the monorepo:

1. Create `eslint.config.js` (not `.eslintrc.js`)
2. Import the appropriate shared config
3. Spread it into an array
4. Add app-specific overrides if needed

### Example: New Node.js App

```js
// apps/my-app/eslint.config.js
const baseConfig = require('../../libs/eslint-config');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    ignores: ['dist/**'],
    rules: {
      // App-specific rules
    },
  },
];
```

### Example: New React App

```js
// apps/my-react-app/eslint.config.js
const reactConfig = require('../../libs/eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'build/**'],
  },
];
```

## Running ESLint

No changes to commands needed:

```bash
# Lint specific app
pnpm --filter @quorum/api lint

# Or from the app directory
cd apps/api
pnpm lint

# Fix automatically
pnpm lint --fix
```

## Common Issues

### "ESLint couldn't find eslint.config.js"

Make sure you created `eslint.config.js`, not `.eslintrc.js`.

### "Module not found: ../../libs/eslint-config"

Check that the relative path is correct from your app to the libs directory.

### TypeScript projectService Warnings

ESLint 9 uses `projectService: true` instead of `project: './tsconfig.json'`. This is automatically configured in the shared config.

## Resources

- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [typescript-eslint v8](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8)

## Troubleshooting

### Clear ESLint Cache

```bash
rm -rf .eslintcache
rm -rf node_modules/.cache/eslint
```

### Reinstall Dependencies

```bash
pnpm install
```

### Check Config is Valid

```bash
cd apps/my-app
pnpm exec eslint --print-config src/index.ts
```

This will show the resolved ESLint configuration for a specific file.


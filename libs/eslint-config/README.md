# @quorum/eslint-config

Shared ESLint configuration for the Quorum monorepo using ESLint 9+ flat config format.

## Usage

### Base Config (Node/TypeScript)

For Node.js and TypeScript projects:

```js
// eslint.config.js
const baseConfig = require('../../libs/eslint-config');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    // Add project-specific rules here
  },
];
```

### React Config

For React projects:

```js
// eslint.config.js
const reactConfig = require('../../libs/eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    // Add project-specific rules here
  },
];
```

### Astro Config

For Astro projects:

```js
// eslint.config.js
const astroConfig = require('../../libs/eslint-config/astro');

module.exports = [
  ...astroConfig,
  {
    files: ['**/*.{js,ts,astro}'],
    // Add project-specific rules here
  },
];
```

## Included Configurations

- ESLint recommended rules
- TypeScript ESLint recommended rules
- Prettier compatibility (via eslint-config-prettier)
- React rules (in react.js)
- React Hooks rules (in react.js)
- Astro rules (in astro.js)

## Features

- Warn on unused variables (with _ prefix ignore)
- Warn on explicit any types
- Warn on console statements (except warn/error)
- Support for ES2022
- React 17+ JSX transform support
- TypeScript prop validation (no prop-types needed)


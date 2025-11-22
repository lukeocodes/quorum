# @quorum/tailwind-config

Shared Tailwind CSS configuration for the Quorum monorepo.

## Usage

In your app's `tailwind.config.js` or `tailwind.config.mjs`:

```js
const baseConfig = require('@quorum/tailwind-config');

module.exports = {
  ...baseConfig,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    // Add your content paths here
  ],
};
```

Or for ES modules (`.mjs`):

```js
import baseConfig from '@quorum/tailwind-config';

export default {
  ...baseConfig,
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
};
```

## Custom Theme

### Colors

The shared config includes a comprehensive color palette:

- **primary**: Blue theme (default brand color)
- **secondary**: Slate theme (neutral grays)
- **success**: Green theme (success states)
- **warning**: Amber theme (warning states)
- **danger**: Red theme (error states)

Each color includes shades from 50 (lightest) to 950 (darkest).

### Typography

- **Sans-serif**: Inter, system fonts
- **Monospace**: JetBrains Mono, Fira Code, system fonts

### Spacing

Extended spacing scale including:
- `128`: 32rem
- `144`: 36rem

### Border Radius

Additional border radius:
- `4xl`: 2rem

## Customization

You can override or extend any values in your app's config:

```js
const baseConfig = require('@quorum/tailwind-config');

module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      colors: {
        ...baseConfig.theme.extend.colors,
        // Add app-specific colors
        brand: '#custom-color',
      },
    },
  },
};
```


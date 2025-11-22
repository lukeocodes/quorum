# @quorum/prettier-config

Shared Prettier configuration for the Quorum monorepo.

## Usage

### Base Config

For all projects:

```json
// package.json
{
  "prettier": "@quorum/prettier-config"
}
```

Or create a `.prettierrc.js`:

```js
module.exports = {
  ...require('@quorum/prettier-config'),
};
```

### React Config (with Tailwind)

For React projects with Tailwind CSS:

```js
// .prettierrc.js
module.exports = {
  ...require('@quorum/prettier-config/react'),
};
```

### Astro Config (with Tailwind)

For Astro projects with Tailwind CSS:

```js
// .prettierrc.js
module.exports = {
  ...require('@quorum/prettier-config/astro'),
};
```

## Configuration

- **Semi**: true (use semicolons)
- **Single Quote**: true (use single quotes)
- **Trailing Comma**: es5
- **Tab Width**: 2 spaces
- **Print Width**: 100 characters
- **Arrow Parens**: always
- **End of Line**: LF

## Plugins

- `prettier-plugin-tailwindcss` (for React and Astro configs)
- `prettier-plugin-astro` (for Astro config)


# Shared Libraries

This directory contains shared configuration libraries used across all apps in the Quorum monorepo.

## Available Libraries

### @quorum/components

Shared React components library with reusable UI components:
- Button, Card, Badge
- Built with TypeScript and Tailwind CSS
- Works in both Electron (React) and Astro (with React integration)

[View documentation](./components/README.md)

### @quorum/eslint-config

Shared ESLint configuration with support for:
- Base TypeScript/Node.js projects
- React applications
- Astro projects

[View documentation](./eslint-config/README.md)

### @quorum/prettier-config

Shared Prettier configuration with support for:
- Base formatting rules
- React with Tailwind CSS
- Astro with Tailwind CSS

[View documentation](./prettier-config/README.md)

### @quorum/tailwind-config

Shared Tailwind CSS configuration including:
- Extended color palette (primary, secondary, success, warning, danger)
- Custom typography (Inter, JetBrains Mono)
- Extended spacing and border radius utilities

[View documentation](./tailwind-config/README.md)

### @quorum/tsconfig

Shared TypeScript configurations for:
- Base configuration (common settings)
- Node.js/Express applications
- React applications
- Astro projects

[View documentation](./tsconfig/README.md)

## Usage

These libraries are automatically linked within the monorepo through pnpm workspaces. Apps can reference them by their package names:

```json
{
  "extends": "@quorum/tsconfig/node.json"
}
```

## Benefits

1. **Consistency**: All apps share the same base configuration
2. **Maintainability**: Update configs in one place
3. **DRY**: Don't repeat configuration across apps
4. **Flexibility**: Apps can override or extend base configs as needed
5. **Type Safety**: Configs are properly typed and validated

## Creating a New Shared Config

1. Create a new directory: `libs/my-config/`
2. Add `package.json` with `@quorum/my-config` name
3. Add `project.json` with NX configuration
4. Add your configuration files
5. Add a `README.md` with usage instructions
6. Update this README with a link to your new config

## Best Practices

- Keep configs minimal and focused
- Document all options and overrides
- Provide examples in README files
- Version configs with the monorepo
- Test configs with real projects before sharing


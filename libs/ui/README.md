# @quorum/components

Shared React components library for the Quorum monorepo. These components can be used in both the Electron app and the Astro website.

## Installation

The library is automatically available in the monorepo through pnpm workspaces.

## Usage

### In React (Electron App)

```tsx
import { Button, Card, Badge } from '@quorum/components';

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <h2>Hello World</h2>
      <Badge variant="success">Active</Badge>
      <Button variant="primary" size="lg" onClick={() => console.log('clicked')}>
        Click Me
      </Button>
    </Card>
  );
}
```

### In Astro (Web App)

First, ensure Astro is configured to use React components. Then:

```astro
---
import { Button, Card, Badge } from '@quorum/components';
---

<Card variant="elevated" padding="lg" client:load>
  <h2>Hello World</h2>
  <Badge variant="success">Active</Badge>
  <Button variant="primary" size="lg" client:load>
    Click Me
  </Button>
</Card>
```

## Components

### Button

A flexible button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `fullWidth`: boolean (default: false)
- All standard HTML button attributes

**Example:**
```tsx
<Button variant="primary" size="lg" fullWidth>
  Submit
</Button>
```

### Card

A container component with different visual styles.

**Props:**
- `variant`: 'default' | 'bordered' | 'elevated' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- All standard HTML div attributes

**Example:**
```tsx
<Card variant="elevated" padding="lg">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Badge

A label component for status indicators, tags, or counts.

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- All standard HTML span attributes

**Example:**
```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```

## Styling

Components use Tailwind CSS classes and rely on the shared `@quorum/theme/tailwind` for consistent theming. Make sure your app is configured with Tailwind CSS.

### Color Palette

Components use the following color scales from the shared Tailwind config:
- `primary`: Blue theme
- `secondary`: Gray theme
- `success`: Green theme
- `warning`: Amber theme
- `danger`: Red theme

## Development

### Building

```bash
# From root
pnpm nx run components:build

# Or from this directory
cd libs/components
pnpm build
```

### Development Mode

```bash
# Watch mode for development
pnpm nx run components:dev
```

### Linting

```bash
pnpm nx run components:lint
```

## Adding New Components

1. Create a new component file in `src/` (e.g., `src/Avatar.tsx`)
2. Export the component and its props interface
3. Add exports to `src/index.ts`
4. Document the component in this README
5. Build the library

Example component structure:

```tsx
import React from 'react';
import clsx from 'clsx';

export interface MyComponentProps {
  // Define props
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  variant = 'primary',
  children,
  ...props
}) => {
  return (
    <div className={clsx('base-styles', variant === 'primary' ? 'primary-styles' : 'secondary-styles')}>
      {children}
    </div>
  );
};
```

## TypeScript

All components are fully typed with TypeScript. Types are automatically exported alongside the components.

## Best Practices

1. **Keep components simple and composable**
2. **Use Tailwind classes for styling**
3. **Provide sensible defaults**
4. **Document all props**
5. **Follow accessibility best practices**
6. **Test components in both Electron and Astro contexts**


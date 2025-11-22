# Quorum Web (@quorum/web)

Astro-based marketing and documentation website for Quorum.

## Tech Stack

- **Astro** - Static site generator
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

```bash
# From the root directory
pnpm install
```

### Development

```bash
# From root directory
pnpm nx run web:dev

# Or from this directory
cd apps/web
pnpm dev
```

The website will start on http://localhost:4321

### Building

```bash
# From root directory
pnpm nx run web:build

# Or from this directory
cd apps/web
pnpm build
```

### Preview

Preview the built site:

```bash
# From root directory
pnpm nx run web:preview

# Or from this directory
cd apps/web
pnpm preview
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/      # Reusable Astro components
│   ├── layouts/         # Page layouts
│   │   └── Layout.astro # Base layout
│   ├── pages/          # File-based routing
│   │   └── index.astro # Home page
│   └── env.d.ts        # TypeScript environment definitions
├── public/             # Static assets
│   └── favicon.svg     # Site favicon
├── astro.config.mjs    # Astro configuration
├── tailwind.config.mjs # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── project.json        # NX project configuration
└── README.md          # This file
```

## Development

### Adding Pages

Create new `.astro` files in `src/pages/`. Astro uses file-based routing:

- `src/pages/index.astro` → `/`
- `src/pages/about.astro` → `/about`
- `src/pages/blog/post.astro` → `/blog/post`

### Adding Components

Create reusable components in `src/components/`:

```astro
---
// src/components/Button.astro
interface Props {
  text: string;
  href?: string;
}

const { text, href } = Astro.props;
---

<a href={href} class="btn">
  {text}
</a>
```

### Styling

This project uses Tailwind CSS. Customize the theme in `tailwind.config.mjs`.

## Deployment

The built site is a collection of static files in the `dist/` directory, which can be deployed to any static hosting service:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

## License

MIT


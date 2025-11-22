# Quorum API (@quorum/api)

Express.js REST API backend for the Quorum application.

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **tsx** - TypeScript execution for development

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

```bash
# From the root directory
pnpm install
```

### Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
```

### Development

```bash
# From root directory
pnpm nx run api:dev

# Or from this directory
cd apps/api
pnpm dev
```

The API will start on http://localhost:3000

### Building

```bash
# From root directory
pnpm nx run api:build

# Or from this directory
cd apps/api
pnpm build
```

### Production

```bash
# From root directory
pnpm nx run api:start

# Or from this directory
cd apps/api
pnpm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the API.

### Root

```
GET /
```

Returns API information and version.

## Project Structure

```
apps/api/
├── src/
│   └── index.ts        # Main application entry point
├── dist/               # Compiled JavaScript (generated)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── project.json        # NX project configuration
└── README.md          # This file
```

## Development

### Adding Routes

Create new route files in `src/routes/` and import them in `src/index.ts`.

### Adding Middleware

Add middleware in `src/middleware/` and apply in `src/index.ts`.

## License

MIT


# Quorum API User

User profiles, preferences, and app customization API.

## Features

- **User Profiles**: Get and update user profile information
- **User Preferences**: Store and sync app customization settings
  - UI preferences (column widths, collapsed states, etc.)
  - Last viewed channels
  - Custom channel sections and sorting
  - Display name preferences
- **Cross-platform Sync**: Sync preferences between web and electron apps

## API Endpoints

### User Profile
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile

### User Preferences
- `GET /preferences` - Get all user preferences
- `GET /preferences/app` - Get app-level preferences
- `PUT /preferences/app/:key` - Set app-level preference
- `GET /preferences/server/:serverId` - Get server-specific preferences
- `PUT /preferences/server/:serverId/:key` - Set server-specific preference
- `DELETE /preferences/:key` - Delete a preference

### Channel Sections
- `GET /sections/server/:serverId` - Get channel sections for a server
- `PUT /sections/server/:serverId` - Update channel sections for a server

## Environment Variables

See `example.env` for configuration options.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Database

This API uses PostgreSQL to store user preferences and profiles.
See `src/config/database.ts` for schema initialization.


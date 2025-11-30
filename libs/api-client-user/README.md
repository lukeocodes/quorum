# @quorum/api-client-user

Client SDK for Quorum API User (user profiles, preferences, app customization).

## Features

- **User Profile Management**: Get and update user profiles
- **Preferences API**: Store and sync app customization settings
- **Channel Sections**: Manage custom channel sections per server
- **Type-safe**: Full TypeScript support with types from `@quorum/proto`

## Installation

```bash
pnpm add @quorum/api-client-user
```

## Usage

```typescript
import { QuorumUserClient } from '@quorum/api-client-user';

// Create a client instance
const client = new QuorumUserClient({
  baseUrl: 'http://localhost:3002',
  token: 'your-jwt-token',
});

// Get user profile
const profile = await client.getUserProfile();

// Update user profile
await client.updateUserProfile({
  display_name: 'John Doe',
  bio: 'Hello world!',
});

// Get app-level preferences
const prefs = await client.getAppPreferences();

// Set app-level preference
await client.setAppPreference('serverColumnWidth', '250');

// Get server-specific preferences
const serverPrefs = await client.getServerPreferences(123);

// Set server-specific preference
await client.setServerPreference(123, 'lastViewedChannel', '456');

// Get channel sections
const sections = await client.getChannelSections(123);

// Update channel sections
await client.updateChannelSections(123, [
  { id: '1', name: 'Favorites', channelIds: [1, 2, 3], collapsed: false },
]);
```

## API

### Constructor

```typescript
new QuorumUserClient(config: QuorumUserClientConfig)
```

### User Profile

- `getUserProfile(): Promise<UserProfile>` - Get current user profile
- `updateUserProfile(updates: UserProfileUpdate): Promise<UserProfile>` - Update user profile

### Preferences

- `getAllPreferences(): Promise<UserPreference[]>` - Get all preferences
- `getAppPreferences(): Promise<Record<string, string>>` - Get app-level preferences
- `setAppPreference(key: string, value: string | any): Promise<UserPreference>` - Set app-level preference
- `getServerPreferences(serverId: number): Promise<Record<string, string>>` - Get server preferences
- `setServerPreference(serverId: number, key: string, value: string | any): Promise<UserPreference>` - Set server preference
- `deletePreference(key: string, serverId?: number): Promise<boolean>` - Delete a preference

### Channel Sections

- `getChannelSections(serverId: number): Promise<ChannelSection[]>` - Get channel sections for a server
- `updateChannelSections(serverId: number, sections: ChannelSection[]): Promise<void>` - Update channel sections


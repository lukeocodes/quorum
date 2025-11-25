# Electron App Cleanup Notes

## Files That Were Deleted ✅

The following files used PostgreSQL and have been removed from the Electron app:

- ✅ `electron/database.js` - PostgreSQL connection (Electron should use SQLite for local state only)
- ✅ `electron/ipc-handlers.js` - Contains all PostgreSQL queries; functionality moved to API
- ✅ `electron/database-new.js` - Unused database file
- ✅ `electron/main-connections.js.backup` - Old backup file
- ✅ `electron/preload-connections.js.backup` - Old backup file
- ✅ `electron/queue-manager.js` - AI queue management should happen on the server, not in Electron
- ✅ `electron/ai-service.js` - AI processing should happen via API
- ✅ `electron/auth-service.js` - Auth should go through API
- ✅ `electron/server-service.js` - Server operations should go through API
- ✅ `electron/voice-service.js` - If needed, should call API
- ✅ `electron/speech-service.js` - If needed, should call API
- ✅ `electron/encryption-service.js` - Should be on server if needed

## Current Architecture

### What the Electron App SHOULD Do:
1. **Local Session Management** (SQLite via `database-sessions.js` and `session-manager.js`)
   - Store multiple user sessions (credentials for different API servers)
   - Track which servers are added to the desktop app
   - Persist active session selection

2. **System Integration**
   - Open external URLs (browser)
   - Handle deep links (`quorum://` protocol)
   - OS notifications (future)

3. **UI Rendering**
   - React frontend
   - All data fetched from API via `fetch()` calls

### What the Electron App Should NOT Do:
- ❌ Connect directly to PostgreSQL
- ❌ Process AI responses locally
- ❌ Store application data (rooms, messages, etc.) - that's in the API's PostgreSQL database
- ❌ Implement business logic (that should be in the API)

## IPC Handlers (Current State)

The Electron app now has minimal IPC handlers in `main.js`:

1. **System**: `system:open-external` - Open URLs in browser
2. **Sessions**: Local SQLite CRUD for user sessions
3. **Servers**: Fetch server list from API and cache locally
4. **Events**: Pass events between main and renderer (session changes, etc.)

## Data Flow

```
User Action in UI
    ↓
React Component (uses appStore)
    ↓
fetch() to API Server
    ↓
API processes request (PostgreSQL)
    ↓
Response back to Electron UI
    ↓
UI updates
```

## Migration Status

✅ Removed PostgreSQL dependency from Electron
✅ Room creation now uses API
✅ AI member creation uses API  
✅ Room archival uses API
✅ AI member deletion uses API
✅ Messages already use API
✅ Room loading uses API

✅ **Cleanup Complete!**

All PostgreSQL-dependent code has been removed from the Electron app. The architecture is now clean:

### Remaining Electron Files (Correct Architecture):
- `electron/main.js` - Main process, session management IPC handlers
- `electron/preload.js` - Minimal IPC exposure (only sessions and system)
- `electron/database-sessions.js` - SQLite for local session storage
- `electron/session-manager.js` - Manages user sessions and server cache

### Deleted Files:
- `src/components/ServerSelection.tsx` - Old component using removed IPC methods
- All PostgreSQL-related service files (see list above)

### Updated Files:
- `src/store/appStore.ts` - Now uses API calls for all operations
- `src/types/electron.d.ts` - Cleaned up to only include actual IPC methods
- `electron/preload.js` - Removed all PostgreSQL-related IPC exposures


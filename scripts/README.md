# Database Wipe Scripts

These scripts help you clean your development databases when needed.

## Technologies

- **Electron wipe**: Bash script (cross-platform compatible)
- **PostgreSQL wipe**: Node.js script using `dotenv` and `pg` packages

## Available Commands

### Wipe All Databases
```bash
pnpm db:wipe:all
```
Wipes both the Electron SQLite database and the PostgreSQL database. Use this for a complete fresh start. This command runs both `db:wipe:electron` and `db:wipe:pg` in sequence.

### Wipe Electron Database Only
```bash
pnpm db:wipe:electron
```
Deletes the `apps/electron/quorum.db` file. The database will be recreated automatically when you run the Electron app.

### Wipe PostgreSQL Database Only
```bash
pnpm db:wipe:pg
```
Truncates all tables in the PostgreSQL database while preserving the schema. You'll need to have your `.env` file configured in `apps/api/`.

## What Gets Deleted

### Electron SQLite (`db:wipe:electron`)
- Server connections
- Cached server data
- Cached rooms
- App settings

### PostgreSQL (`db:wipe:pg`)
- All users
- All sessions
- All servers
- All server members
- All server invites
- All rooms/channels
- All messages
- All AI members
- All room summaries
- All message mentions

**Note:** The database schema is preserved. Only the data is deleted.

## Safety Features

- The PostgreSQL wipe script will ask for confirmation (unless running in CI)
- All scripts use `set -e` to stop on errors
- Sequences are reset to start from 1

## After Wiping

### Electron
The SQLite database will be automatically recreated when you launch the Electron app.

### PostgreSQL
The schema is preserved, so you can immediately:
1. Create new users via the web app
2. The migrations table is preserved (migrations won't re-run)
3. Start fresh with clean data

## Environment Variables

The PostgreSQL wipe script reads from `.env` in the project root:
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

## Examples

```bash
# Clean start during development
pnpm db:wipe:all

# Reset just the Electron client state
pnpm db:wipe:electron

# Clear API data but keep Electron connections
pnpm db:wipe:pg
```

## Troubleshooting

### PostgreSQL Connection Issues
If the wipe script can't connect to PostgreSQL:
1. Check your `.env` file exists in the project root and has correct credentials
2. Ensure PostgreSQL is running
3. Verify you can connect manually: `psql -U $DB_USER -d $DB_NAME`

### Permission Denied
If you get permission errors:
```bash
chmod +x scripts/*.sh
```


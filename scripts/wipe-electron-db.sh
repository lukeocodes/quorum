#!/bin/bash

# Wipe Electron SQLite database
# This removes all data from the local Electron development database

set -e

ELECTRON_DB="apps/app-electron/quorum.db"

echo "🗑️  Wiping Electron SQLite database..."

if [ -f "$ELECTRON_DB" ]; then
  rm "$ELECTRON_DB"
  echo "✅ Deleted $ELECTRON_DB"
else
  echo "ℹ️  No database file found at $ELECTRON_DB (nothing to delete)"
fi

echo "✨ Electron database wiped successfully"
echo ""
echo "💡 The database will be recreated automatically when you run the Electron app"

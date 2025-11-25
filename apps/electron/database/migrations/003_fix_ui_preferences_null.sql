-- Migration: Fix ui_preferences to handle NULL server_id properly
-- SQLite UNIQUE constraints with NULL can be problematic, so we'll use -1 for app-level prefs

-- Drop the old table if it exists
DROP TABLE IF EXISTS ui_preferences_old;

-- Rename current table to backup
ALTER TABLE ui_preferences RENAME TO ui_preferences_old;

-- Recreate with server_id NOT NULL and use -1 for app-level preferences
CREATE TABLE ui_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL DEFAULT -1, -- -1 = app-level preference, others = server-specific
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, server_id, preference_key)
);

-- Copy any existing data (if the old table had data)
INSERT INTO ui_preferences (session_id, server_id, preference_key, preference_value, created_at, updated_at)
SELECT 
  session_id, 
  COALESCE(server_id, -1), -- Convert NULL to -1
  preference_key, 
  preference_value, 
  created_at, 
  updated_at
FROM ui_preferences_old
WHERE EXISTS (SELECT 1 FROM ui_preferences_old);

-- Drop the backup
DROP TABLE ui_preferences_old;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_ui_preferences_session ON ui_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_ui_preferences_session_server ON ui_preferences(session_id, server_id);
CREATE INDEX IF NOT EXISTS idx_ui_preferences_key ON ui_preferences(session_id, preference_key);

-- Recreate trigger
CREATE TRIGGER IF NOT EXISTS update_ui_preferences_timestamp 
AFTER UPDATE ON ui_preferences
BEGIN
  UPDATE ui_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


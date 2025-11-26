-- Migration: Add UI preferences for storing user interface settings
-- Allows storing per-user UI preferences (app-level) and per-server UI preferences

-- UI preferences table (stores various UI settings)
-- server_id is NULL for app-level preferences (e.g., sidebar_width)
-- server_id is set for server-specific preferences (e.g., server_theme)
CREATE TABLE IF NOT EXISTS ui_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  server_id INTEGER, -- NULL = app-level preference, NOT NULL = server-specific
  preference_key TEXT NOT NULL, -- e.g., 'sidebar_width', 'theme', etc.
  preference_value TEXT NOT NULL, -- JSON or simple string value
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, server_id, preference_key)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ui_preferences_session ON ui_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_ui_preferences_session_server ON ui_preferences(session_id, server_id);
CREATE INDEX IF NOT EXISTS idx_ui_preferences_key ON ui_preferences(session_id, preference_key);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_ui_preferences_timestamp 
AFTER UPDATE ON ui_preferences
BEGIN
  UPDATE ui_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


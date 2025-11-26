-- Quorum Electron - Session-based Schema
-- This schema only stores user sessions and local preferences
-- All server data is fetched from the API

-- User sessions table (stores auth tokens for multiple users)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_color TEXT DEFAULT '#8b5cf6',
  auth_token TEXT NOT NULL,
  api_url TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, api_url)
);

-- Server display order preferences (local only)
CREATE TABLE IF NOT EXISTS server_display_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, server_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_api_url ON user_sessions(api_url);
CREATE INDEX IF NOT EXISTS idx_server_display_order_session ON server_display_order(session_id);
CREATE INDEX IF NOT EXISTS idx_server_display_order_order ON server_display_order(session_id, display_order);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_user_sessions_timestamp 
AFTER UPDATE ON user_sessions
BEGIN
  UPDATE user_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_server_display_order_timestamp 
AFTER UPDATE ON server_display_order
BEGIN
  UPDATE server_display_order SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


-- Quorum Electron Multi-Server Database Schema
-- This database stores connection information for multiple Quorum API servers
-- The actual data (rooms, messages, users) lives on each API server

-- Server connections table (each entry is a connected Quorum API instance)
CREATE TABLE IF NOT EXISTS server_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- Display name for this server connection
  api_url TEXT NOT NULL, -- Base URL of the Quorum API (e.g., https://api.company.com)
  server_id INTEGER, -- The server ID from the remote API
  icon_url TEXT, -- Optional server icon URL
  icon_color TEXT DEFAULT '#8b5cf6', -- Fallback color for server icon
  display_order INTEGER NOT NULL DEFAULT 0, -- Order in the sidebar (lower = higher)
  is_active BOOLEAN DEFAULT FALSE, -- Currently selected server
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(api_url, server_id) -- Can't connect to the same server twice
);

-- Server auth table (stores auth tokens for each connection)
CREATE TABLE IF NOT EXISTS server_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  auth_token TEXT NOT NULL, -- Session token for this server
  user_id INTEGER, -- User ID on the remote server
  username TEXT, -- Username on the remote server
  email TEXT, -- Email on the remote server
  display_name TEXT, -- Display name on the remote server
  avatar_color TEXT, -- Avatar color on the remote server
  expires_at DATETIME, -- Token expiration (if applicable)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES server_connections(id) ON DELETE CASCADE,
  UNIQUE(connection_id) -- One auth per connection
);

-- Cached server data (for offline access and performance)
-- This caches basic server info from the remote API
CREATE TABLE IF NOT EXISTS cached_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  remote_server_id INTEGER NOT NULL, -- Server ID on remote API
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES server_connections(id) ON DELETE CASCADE,
  UNIQUE(connection_id, remote_server_id)
);

-- Cached rooms (for offline access and performance)
CREATE TABLE IF NOT EXISTS cached_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,
  remote_room_id INTEGER NOT NULL, -- Room ID on remote API
  remote_server_id INTEGER NOT NULL, -- Server ID this room belongs to
  name TEXT NOT NULL,
  description TEXT,
  unread_count INTEGER DEFAULT 0,
  last_message_at DATETIME,
  last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES server_connections(id) ON DELETE CASCADE,
  UNIQUE(connection_id, remote_room_id)
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_server_connections_active ON server_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_server_connections_order ON server_connections(display_order);
CREATE INDEX IF NOT EXISTS idx_server_auth_connection ON server_auth(connection_id);
CREATE INDEX IF NOT EXISTS idx_server_auth_token ON server_auth(auth_token);
CREATE INDEX IF NOT EXISTS idx_cached_servers_connection ON cached_servers(connection_id);
CREATE INDEX IF NOT EXISTS idx_cached_rooms_connection ON cached_rooms(connection_id);
CREATE INDEX IF NOT EXISTS idx_cached_rooms_server ON cached_rooms(connection_id, remote_server_id);

-- Insert default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'dark');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_active_connection_id', '');


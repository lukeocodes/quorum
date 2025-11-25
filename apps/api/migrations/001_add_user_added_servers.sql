-- Migration: Add user_added_servers table
-- Description: Track which servers users have "added" to their desktop/web clients
-- This allows us to differentiate between servers a user is a member of vs servers they've actively added

-- Create the user_added_servers table
CREATE TABLE IF NOT EXISTS user_added_servers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('desktop', 'web')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, server_id, client_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_added_servers_user_id ON user_added_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_added_servers_server_id ON user_added_servers(server_id);
CREATE INDEX IF NOT EXISTS idx_user_added_servers_client_type ON user_added_servers(client_type);
CREATE INDEX IF NOT EXISTS idx_user_added_servers_composite ON user_added_servers(user_id, server_id, client_type);

-- Add comment to table
COMMENT ON TABLE user_added_servers IS 'Tracks which servers users have added to their desktop or web clients';
COMMENT ON COLUMN user_added_servers.client_type IS 'Type of client: desktop or web';
COMMENT ON COLUMN user_added_servers.last_accessed_at IS 'Last time user accessed this server on this client';


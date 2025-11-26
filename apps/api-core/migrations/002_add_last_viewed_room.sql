-- Add last_viewed_channel_id to server_members table
-- This tracks the last channel a user was viewing in each server

ALTER TABLE server_members
ADD COLUMN last_viewed_channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_server_members_last_viewed_channel ON server_members(last_viewed_channel_id);


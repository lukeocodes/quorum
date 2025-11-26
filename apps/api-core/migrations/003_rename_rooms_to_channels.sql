-- Rename rooms to channels throughout the database
-- This migration updates all references from "room" to "channel"

-- Rename the main table
ALTER TABLE rooms RENAME TO channels;

-- Rename columns in related tables
ALTER TABLE messages RENAME COLUMN room_id TO channel_id;
ALTER TABLE ai_members RENAME COLUMN room_id TO channel_id;
ALTER TABLE channel_shares RENAME COLUMN room_id TO channel_id;
ALTER TABLE room_summaries RENAME COLUMN room_id TO channel_id;
ALTER TABLE room_summaries RENAME TO channel_summaries;
ALTER TABLE server_members RENAME COLUMN last_viewed_room_id TO last_viewed_channel_id;

-- Drop old indexes
DROP INDEX IF EXISTS idx_rooms_server_id;
DROP INDEX IF EXISTS idx_rooms_archived;
DROP INDEX IF EXISTS idx_messages_room_id;
DROP INDEX IF EXISTS idx_ai_members_room_id;
DROP INDEX IF EXISTS idx_channel_shares_room_id;
DROP INDEX IF EXISTS idx_server_members_last_viewed_room;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_channels_archived ON channels(archived);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_ai_members_channel_id ON ai_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_shares_channel_id ON channel_shares(channel_id);
CREATE INDEX IF NOT EXISTS idx_server_members_last_viewed_channel ON server_members(last_viewed_channel_id);

-- Update triggers
DROP TRIGGER IF EXISTS update_rooms_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_room_summaries_updated_at ON channel_summaries;
CREATE TRIGGER update_channel_summaries_updated_at BEFORE UPDATE ON channel_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


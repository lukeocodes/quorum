-- ====================================================================
-- Wipe All Channels (Rooms) and Messages from Quorum
-- ====================================================================
-- This will delete all rooms, messages, AI members, and related data
-- while keeping users, servers, and sessions intact.
--
-- ⚠️  WARNING: This action cannot be undone!
-- ====================================================================

BEGIN;

-- Show counts before deletion
SELECT 
  (SELECT COUNT(*) FROM rooms) as rooms_count,
  (SELECT COUNT(*) FROM messages) as messages_count,
  (SELECT COUNT(*) FROM ai_members) as ai_members_count,
  (SELECT COUNT(*) FROM message_mentions) as mentions_count,
  (SELECT COUNT(*) FROM room_summaries) as summaries_count,
  (SELECT COUNT(*) FROM channel_shares) as shares_count;

-- Delete all rooms (this will CASCADE to all related tables)
-- Cascades to: messages, message_mentions, room_summaries, ai_members, channel_shares
DELETE FROM rooms;

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM rooms) as rooms_remaining,
  (SELECT COUNT(*) FROM messages) as messages_remaining,
  (SELECT COUNT(*) FROM ai_members) as ai_members_remaining,
  (SELECT COUNT(*) FROM message_mentions) as mentions_remaining,
  (SELECT COUNT(*) FROM room_summaries) as summaries_remaining,
  (SELECT COUNT(*) FROM channel_shares) as shares_remaining;

-- Committing the changes:
COMMIT;

-- Changes committed successfully!


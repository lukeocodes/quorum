-- Migration: Simplify user_added_servers table
-- Description: Remove client_type distinction - users just "add" servers, not "add to desktop/web"
-- This simplifies the UX: users are members of servers, and can add/remove them from their view

-- Drop the old indexes that include client_type
DROP INDEX IF EXISTS idx_user_added_servers_client_type;
DROP INDEX IF EXISTS idx_user_added_servers_composite;

-- Migrate existing data: keep desktop entries, remove web entries
DELETE FROM user_added_servers WHERE client_type = 'web';

-- For users who have the same server on both desktop and web, keep just one
-- (This is now handled by the DELETE above, but adding this for clarity)

-- Remove the client_type column and its constraint
ALTER TABLE user_added_servers DROP CONSTRAINT IF EXISTS user_added_servers_client_type_check;
ALTER TABLE user_added_servers DROP COLUMN IF EXISTS client_type;

-- Update the unique constraint to not include client_type
ALTER TABLE user_added_servers DROP CONSTRAINT IF EXISTS user_added_servers_user_id_server_id_client_type_key;
ALTER TABLE user_added_servers ADD CONSTRAINT user_added_servers_user_id_server_id_key UNIQUE(user_id, server_id);

-- Recreate indexes without client_type
CREATE INDEX IF NOT EXISTS idx_user_added_servers_composite ON user_added_servers(user_id, server_id);

-- Update table comment
COMMENT ON TABLE user_added_servers IS 'Tracks which servers users have added to their view (vs just being a member)';

-- Migrate existing server memberships: add all servers that users are members of
-- This ensures existing users see their servers
INSERT INTO user_added_servers (user_id, server_id, added_at, last_accessed_at)
SELECT 
  sm.user_id,
  sm.server_id,
  CURRENT_TIMESTAMP as added_at,
  CURRENT_TIMESTAMP as last_accessed_at
FROM server_members sm
WHERE NOT EXISTS (
  SELECT 1 FROM user_added_servers uas
  WHERE uas.user_id = sm.user_id 
    AND uas.server_id = sm.server_id
)
ON CONFLICT (user_id, server_id) DO NOTHING;


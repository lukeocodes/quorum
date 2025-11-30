-- Migration: Add server profiles table
-- Description: Creates server_profiles table for per-server profile overrides
-- Server profiles allow users to customize their profile appearance per server
-- Fields are nullable - only set fields override the base user profile

CREATE TABLE IF NOT EXISTS server_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  display_name VARCHAR(255),
  title VARCHAR(255),
  pronouns VARCHAR(50),
  timezone VARCHAR(100), -- IANA timezone format
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, server_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_server_profiles_user_id ON server_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_server_profiles_server_id ON server_profiles(server_id);
CREATE INDEX IF NOT EXISTS idx_server_profiles_composite ON server_profiles(user_id, server_id);

-- Add comments for documentation
COMMENT ON TABLE server_profiles IS 'Per-server profile overrides for users. Only set fields override the base user profile.';
COMMENT ON COLUMN server_profiles.full_name IS 'Full name override for this server (NULL = use user profile)';
COMMENT ON COLUMN server_profiles.display_name IS 'Display name override for this server (NULL = use user profile)';
COMMENT ON COLUMN server_profiles.title IS 'Title override for this server (NULL = use user profile)';
COMMENT ON COLUMN server_profiles.pronouns IS 'Pronouns override for this server (NULL = use user profile)';
COMMENT ON COLUMN server_profiles.timezone IS 'Timezone override for this server (NULL = use user profile)';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_server_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_server_profiles_timestamp
  BEFORE UPDATE ON server_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_server_profiles_updated_at();


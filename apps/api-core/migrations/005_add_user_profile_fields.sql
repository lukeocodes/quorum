-- Migration: Add user profile fields
-- Description: Adds profile fields (full_name, title, pronouns, timezone) to users table
-- These fields represent the base user profile that can be overridden per-server

-- Add new profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100); -- IANA timezone format (e.g., "Europe/London")

-- Add comments for documentation
COMMENT ON COLUMN users.full_name IS 'Full name (e.g., "Luke Oliff")';
COMMENT ON COLUMN users.title IS 'Job title or role (e.g., "CEO / Founder")';
COMMENT ON COLUMN users.pronouns IS 'Pronouns (e.g., "he/him")';
COMMENT ON COLUMN users.timezone IS 'IANA timezone identifier (e.g., "Europe/London")';
COMMENT ON COLUMN users.display_name IS 'Display name/username (globally unique, e.g., "lukeocodes")';


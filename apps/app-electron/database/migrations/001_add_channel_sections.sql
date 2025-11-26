-- Migration: Add channel sections for organizing channels
-- Allows users to organize channels into custom sections per server

-- Channel sections table (stores section configuration per user per server)
CREATE TABLE IF NOT EXISTS channel_sections (
  id TEXT PRIMARY KEY, -- client-generated ID like 'section-123' or 'default-channels'
  session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'channels', -- 'channels', could be extended to 'voice', etc.
  collapsed INTEGER DEFAULT 0, -- 0 = expanded, 1 = collapsed
  is_default INTEGER DEFAULT 0, -- 0 = custom, 1 = default section
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, server_id, id)
);

-- Channel section items (stores which channels are in which section and their order)
CREATE TABLE IF NOT EXISTS channel_section_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id TEXT NOT NULL REFERENCES channel_sections(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, server_id, section_id, channel_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channel_sections_session_server ON channel_sections(session_id, server_id);
CREATE INDEX IF NOT EXISTS idx_channel_sections_order ON channel_sections(session_id, server_id, display_order);
CREATE INDEX IF NOT EXISTS idx_channel_section_items_section ON channel_section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_channel_section_items_session_server ON channel_section_items(session_id, server_id);
CREATE INDEX IF NOT EXISTS idx_channel_section_items_order ON channel_section_items(section_id, display_order);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_channel_sections_timestamp 
AFTER UPDATE ON channel_sections
BEGIN
  UPDATE channel_sections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_channel_section_items_timestamp 
AFTER UPDATE ON channel_section_items
BEGIN
  UPDATE channel_section_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


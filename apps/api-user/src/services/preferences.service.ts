import { getPool } from '../config/database';

export interface UserPreference {
  id: number;
  user_id: number;
  preference_key: string;
  preference_value: string;
  server_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelSection {
  id: string;
  name: string;
  channelIds: number[];
  collapsed: boolean;
}

/**
 * Get all preferences for a user
 */
export async function getAllPreferences(userId: number): Promise<UserPreference[]> {
  const pool = getPool();
  const result = await pool.query<UserPreference>(
    'SELECT * FROM user_preferences WHERE user_id = $1 ORDER BY preference_key',
    [userId]
  );
  return result.rows;
}

/**
 * Get app-level preferences (no server_id)
 */
export async function getAppPreferences(userId: number): Promise<Record<string, string>> {
  const pool = getPool();
  const result = await pool.query<UserPreference>(
    'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1 AND server_id IS NULL',
    [userId]
  );
  
  const preferences: Record<string, string> = {};
  for (const row of result.rows) {
    preferences[row.preference_key] = row.preference_value;
  }
  return preferences;
}

/**
 * Get server-specific preferences
 */
export async function getServerPreferences(userId: number, serverId: number): Promise<Record<string, string>> {
  const pool = getPool();
  const result = await pool.query<UserPreference>(
    'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1 AND server_id = $2',
    [userId, serverId]
  );
  
  const preferences: Record<string, string> = {};
  for (const row of result.rows) {
    preferences[row.preference_key] = row.preference_value;
  }
  return preferences;
}

/**
 * Set an app-level preference
 */
export async function setAppPreference(
  userId: number,
  key: string,
  value: string
): Promise<UserPreference> {
  const pool = getPool();
  const result = await pool.query<UserPreference>(
    `INSERT INTO user_preferences (user_id, preference_key, preference_value, server_id, updated_at)
     VALUES ($1, $2, $3, NULL, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, preference_key, server_id)
     DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, key, value]
  );
  return result.rows[0];
}

/**
 * Set a server-specific preference
 */
export async function setServerPreference(
  userId: number,
  serverId: number,
  key: string,
  value: string
): Promise<UserPreference> {
  const pool = getPool();
  const result = await pool.query<UserPreference>(
    `INSERT INTO user_preferences (user_id, preference_key, preference_value, server_id, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, preference_key, server_id)
     DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, key, value, serverId]
  );
  return result.rows[0];
}

/**
 * Delete a preference
 */
export async function deletePreference(
  userId: number,
  key: string,
  serverId?: number
): Promise<boolean> {
  const pool = getPool();
  let query: string;
  let params: any[];

  if (serverId !== undefined) {
    query = 'DELETE FROM user_preferences WHERE user_id = $1 AND preference_key = $2 AND server_id = $3';
    params = [userId, key, serverId];
  } else {
    query = 'DELETE FROM user_preferences WHERE user_id = $1 AND preference_key = $2 AND server_id IS NULL';
    params = [userId, key];
  }

  const result = await pool.query(query, params);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get channel sections for a server
 */
export async function getChannelSections(
  userId: number,
  serverId: number
): Promise<ChannelSection[]> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT sections FROM channel_sections WHERE user_id = $1 AND server_id = $2',
    [userId, serverId]
  );

  if (result.rows.length === 0) {
    return [];
  }

  return result.rows[0].sections as ChannelSection[];
}

/**
 * Update channel sections for a server
 */
export async function updateChannelSections(
  userId: number,
  serverId: number,
  sections: ChannelSection[]
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO channel_sections (user_id, server_id, sections, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, server_id)
     DO UPDATE SET sections = $3, updated_at = CURRENT_TIMESTAMP`,
    [userId, serverId, JSON.stringify(sections)]
  );
}


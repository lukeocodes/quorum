import { getPool } from '../config/database';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query<UserProfile>(
    'SELECT id, email, username, display_name, avatar_url, bio, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }
): Promise<UserProfile | null> {
  const pool = getPool();
  
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.display_name !== undefined) {
    fields.push(`display_name = $${paramCount++}`);
    values.push(updates.display_name);
  }

  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramCount++}`);
    values.push(updates.avatar_url);
  }

  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramCount++}`);
    values.push(updates.bio);
  }

  if (fields.length === 0) {
    return await getUserProfile(userId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await pool.query<UserProfile>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, username, display_name, avatar_url, bio, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}


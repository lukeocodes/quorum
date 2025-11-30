import { getPool } from '../config/database';
import type { User } from '@quorum/proto';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_color: string;
  full_name: string | null;
  title: string | null;
  pronouns: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query<UserProfile>(
    `SELECT 
      id, email, username, display_name, avatar_color, 
      full_name, title, pronouns, timezone,
      created_at, updated_at 
    FROM users 
    WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Convert Date objects to ISO strings
  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    display_name?: string | null;
    full_name?: string | null;
    title?: string | null;
    pronouns?: string | null;
    timezone?: string | null;
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

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramCount++}`);
    values.push(updates.full_name);
  }

  if (updates.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }

  if (updates.pronouns !== undefined) {
    fields.push(`pronouns = $${paramCount++}`);
    values.push(updates.pronouns);
  }

  if (updates.timezone !== undefined) {
    fields.push(`timezone = $${paramCount++}`);
    values.push(updates.timezone);
  }

  if (fields.length === 0) {
    return await getUserProfile(userId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await pool.query<UserProfile>(
    `UPDATE users 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, email, username, display_name, avatar_color, 
               full_name, title, pronouns, timezone,
               created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Convert Date objects to ISO strings
  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}


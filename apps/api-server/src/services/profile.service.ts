import { getPool } from '../config/database';
import type { MergedProfile, ServerProfile } from '@quorum/proto';

/**
 * Get merged profile for current user in a server
 * Combines user profile with server profile overrides
 */
export async function getMergedProfile(
  serverId: number,
  userId: number
): Promise<MergedProfile> {
  const pool = getPool();

  // Check if user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  // Get user profile
  const userResult = await pool.query(
    `SELECT id, username, email, display_name, avatar_color, 
            full_name, title, pronouns, timezone
     FROM users 
     WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get server profile (if exists)
  const serverProfileResult = await pool.query<ServerProfile>(
    `SELECT id, user_id, server_id, full_name, display_name, title, pronouns, timezone,
            created_at, updated_at
     FROM server_profiles
     WHERE user_id = $1 AND server_id = $2`,
    [userId, serverId]
  );

  const serverProfile = serverProfileResult.rows[0] || null;

  // Merge profiles: server profile overrides user profile
  const merged: MergedProfile = {
    user_id: user.id,
    server_id: serverId,
    username: user.username,
    email: user.email,
    display_name: serverProfile?.display_name ?? user.display_name,
    avatar_color: user.avatar_color,
    full_name: serverProfile?.full_name ?? user.full_name,
    title: serverProfile?.title ?? user.title,
    pronouns: serverProfile?.pronouns ?? user.pronouns,
    timezone: serverProfile?.timezone ?? user.timezone,
    overrides: {
      display_name: serverProfile?.display_name !== null,
      full_name: serverProfile?.full_name !== null,
      title: serverProfile?.title !== null,
      pronouns: serverProfile?.pronouns !== null,
      timezone: serverProfile?.timezone !== null,
    },
  };

  return merged;
}

/**
 * Get merged profile for another user in a server
 * Only returns server profile (not user profile) for other users
 */
export async function getOtherUserProfile(
  serverId: number,
  viewingUserId: number,
  targetUserId: number
): Promise<MergedProfile> {
  const pool = getPool();

  // Check if viewing user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, viewingUserId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  // Get target user's base profile (limited fields)
  const userResult = await pool.query(
    `SELECT id, username, email, display_name, avatar_color, 
            full_name, title, pronouns, timezone
     FROM users 
     WHERE id = $1`,
    [targetUserId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get server profile (if exists)
  const serverProfileResult = await pool.query<ServerProfile>(
    `SELECT id, user_id, server_id, full_name, display_name, title, pronouns, timezone,
            created_at, updated_at
     FROM server_profiles
     WHERE user_id = $1 AND server_id = $2`,
    [targetUserId, serverId]
  );

  const serverProfile = serverProfileResult.rows[0] || null;

  // For other users, only show server profile (or user profile if no server profile exists)
  // But mark overrides based on what's actually set in server profile
  const merged: MergedProfile = {
    user_id: user.id,
    server_id: serverId,
    username: user.username,
    email: user.email, // Include email for other users too
    display_name: serverProfile?.display_name ?? user.display_name,
    avatar_color: user.avatar_color,
    full_name: serverProfile?.full_name ?? user.full_name,
    title: serverProfile?.title ?? user.title,
    pronouns: serverProfile?.pronouns ?? user.pronouns,
    timezone: serverProfile?.timezone ?? user.timezone,
    overrides: {
      display_name: serverProfile?.display_name !== null,
      full_name: serverProfile?.full_name !== null,
      title: serverProfile?.title !== null,
      pronouns: serverProfile?.pronouns !== null,
      timezone: serverProfile?.timezone !== null,
    },
  };

  return merged;
}

/**
 * Update server profile (creates on first edit)
 */
export async function updateServerProfile(
  serverId: number,
  userId: number,
  updates: {
    display_name?: string | null;
    full_name?: string | null;
    title?: string | null;
    pronouns?: string | null;
    timezone?: string | null;
  }
): Promise<MergedProfile> {
  const pool = getPool();

  // Check if user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  // Check if server profile exists
  const existingResult = await pool.query(
    'SELECT id FROM server_profiles WHERE user_id = $1 AND server_id = $2',
    [userId, serverId]
  );

  const exists = existingResult.rows.length > 0;

  if (exists) {
    // Update existing server profile
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
      // No updates, just return merged profile
      return await getMergedProfile(serverId, userId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId, serverId);

    await pool.query(
      `UPDATE server_profiles 
       SET ${fields.join(', ')} 
       WHERE user_id = $${paramCount} AND server_id = $${paramCount + 1}`,
      values
    );
  } else {
    // Create new server profile
    const fields: string[] = ['user_id', 'server_id'];
    const values: any[] = [userId, serverId];
    const placeholders: string[] = ['$1', '$2'];
    let paramCount = 3;

    if (updates.display_name !== undefined) {
      fields.push('display_name');
      values.push(updates.display_name);
      placeholders.push(`$${paramCount++}`);
    }

    if (updates.full_name !== undefined) {
      fields.push('full_name');
      values.push(updates.full_name);
      placeholders.push(`$${paramCount++}`);
    }

    if (updates.title !== undefined) {
      fields.push('title');
      values.push(updates.title);
      placeholders.push(`$${paramCount++}`);
    }

    if (updates.pronouns !== undefined) {
      fields.push('pronouns');
      values.push(updates.pronouns);
      placeholders.push(`$${paramCount++}`);
    }

    if (updates.timezone !== undefined) {
      fields.push('timezone');
      values.push(updates.timezone);
      placeholders.push(`$${paramCount++}`);
    }

    await pool.query(
      `INSERT INTO server_profiles (${fields.join(', ')})
       VALUES (${placeholders.join(', ')})`,
      values
    );
  }

  // Return merged profile
  return await getMergedProfile(serverId, userId);
}


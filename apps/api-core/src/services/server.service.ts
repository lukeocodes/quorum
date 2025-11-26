import { getPool } from '../config/database';
import { generateInviteCode } from '../utils/encryption';
import type {
  Server,
  ServerMember,
  ServerInvite,
  ServerWithMembers,
  CreateServerRequest,
  UpdateServerRequest,
  CreateInviteRequest,
  ServerRole,
} from '@quorum/proto';

/**
 * Create a new server
 */
export async function createServer(
  userId: number,
  data: CreateServerRequest
): Promise<Server> {
  const pool = getPool();
  const { name, description, is_public = false } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create server
    const serverResult = await client.query(
      `INSERT INTO servers (name, description, owner_id, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, userId, is_public]
    );

    const server = serverResult.rows[0] as Server;

    // Add owner as member
    await client.query(
      `INSERT INTO server_members (server_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [server.id, userId, 'owner']
    );

    // Create default "general" channel
    await client.query(
      `INSERT INTO channels (server_id, name, description)
       VALUES ($1, 'general', 'General discussion channel')`,
      [server.id]
    );

    await client.query('COMMIT');
    return server;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all servers for a user
 */
export async function getUserServers(userId: number): Promise<ServerWithMembers[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT s.*, COUNT(sm.id)::int as member_count
     FROM servers s
     JOIN server_members sm_user ON s.id = sm_user.server_id
     LEFT JOIN server_members sm ON s.id = sm.server_id
     WHERE sm_user.user_id = $1 AND s.archived = FALSE
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [userId]
  );

  return result.rows as ServerWithMembers[];
}

/**
 * Get server by ID
 */
export async function getServer(
  serverId: number,
  userId: number
): Promise<ServerWithMembers> {
  const pool = getPool();

  // Check if user is a member
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  const result = await pool.query(
    `SELECT s.*, COUNT(sm.id)::int as member_count
     FROM servers s
     LEFT JOIN server_members sm ON s.id = sm.server_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [serverId]
  );

  if (result.rows.length === 0) {
    throw new Error('Server not found');
  }

  return result.rows[0] as ServerWithMembers;
}

/**
 * Update server
 */
export async function updateServer(
  serverId: number,
  userId: number,
  data: UpdateServerRequest
): Promise<Server> {
  const pool = getPool();

  // Check if user is owner or admin
  const memberCheck = await pool.query(
    `SELECT role FROM server_members 
     WHERE server_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Insufficient permissions');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }

  if (data.is_public !== undefined) {
    updates.push(`is_public = $${paramCount++}`);
    values.push(data.is_public);
  }

  if (data.archived !== undefined) {
    updates.push(`archived = $${paramCount++}`);
    values.push(data.archived);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(serverId);

  const result = await pool.query(
    `UPDATE servers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] as Server;
}

/**
 * Delete server
 */
export async function deleteServer(serverId: number, userId: number): Promise<void> {
  const pool = getPool();

  // Check if user is owner
  const memberCheck = await pool.query(
    `SELECT role FROM server_members 
     WHERE server_id = $1 AND user_id = $2 AND role = 'owner'`,
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Only the server owner can delete the server');
  }

  await pool.query('DELETE FROM servers WHERE id = $1', [serverId]);
}

/**
 * Get server members
 */
export async function getServerMembers(serverId: number, userId: number) {
  const pool = getPool();

  // Check if user is a member
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  const result = await pool.query(
    `SELECT sm.*, u.username, u.email, u.display_name, u.avatar_color
     FROM server_members sm
     JOIN users u ON sm.user_id = u.id
     WHERE sm.server_id = $1
     ORDER BY sm.joined_at`,
    [serverId]
  );

  return result.rows;
}

/**
 * Create invite code
 */
export async function createInvite(
  serverId: number,
  userId: number,
  data: CreateInviteRequest
): Promise<ServerInvite> {
  const pool = getPool();

  // Check if user is owner or admin
  const memberCheck = await pool.query(
    `SELECT role FROM server_members 
     WHERE server_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Insufficient permissions');
  }

  const code = generateInviteCode();
  const expiresAt = data.expires_in_days
    ? new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000)
    : null;

  const result = await pool.query(
    `INSERT INTO server_invites (server_id, created_by, code, max_uses, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [serverId, userId, code, data.max_uses || null, expiresAt]
  );

  return result.rows[0] as ServerInvite;
}

/**
 * Join server with invite code
 */
export async function joinServerWithInvite(
  code: string,
  userId: number
): Promise<{ server: Server; member: ServerMember }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find and validate invite
    const inviteResult = await client.query(
      `SELECT * FROM server_invites 
       WHERE code = $1 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR uses < max_uses)`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      throw new Error('Invalid or expired invite code');
    }

    const invite = inviteResult.rows[0];

    // Check if already a member
    const memberCheck = await client.query(
      'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
      [invite.server_id, userId]
    );

    if (memberCheck.rows.length > 0) {
      throw new Error('Already a member of this server');
    }

    // Add member
    const memberResult = await client.query(
      `INSERT INTO server_members (server_id, user_id, role)
       VALUES ($1, $2, 'member')
       RETURNING *`,
      [invite.server_id, userId]
    );

    // Increment invite uses
    await client.query(
      'UPDATE server_invites SET uses = uses + 1 WHERE id = $1',
      [invite.id]
    );

    // Get server
    const serverResult = await client.query(
      'SELECT * FROM servers WHERE id = $1',
      [invite.server_id]
    );

    await client.query('COMMIT');

    return {
      server: serverResult.rows[0] as Server,
      member: memberResult.rows[0] as ServerMember,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get public servers
 */
export async function getPublicServers(): Promise<ServerWithMembers[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT s.*, COUNT(sm.id)::int as member_count
     FROM servers s
     LEFT JOIN server_members sm ON s.id = sm.server_id
     WHERE s.is_public = TRUE AND s.archived = FALSE
     GROUP BY s.id
     ORDER BY member_count DESC, s.created_at DESC
     LIMIT 50`
  );

  return result.rows as ServerWithMembers[];
}

/**
 * Join public server
 */
export async function joinPublicServer(
  serverId: number,
  userId: number
): Promise<ServerMember> {
  const pool = getPool();

  // Check if server is public
  const serverCheck = await pool.query(
    'SELECT is_public FROM servers WHERE id = $1',
    [serverId]
  );

  if (serverCheck.rows.length === 0) {
    throw new Error('Server not found');
  }

  if (!serverCheck.rows[0].is_public) {
    throw new Error('Server is not public');
  }

  // Check if already a member
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length > 0) {
    throw new Error('Already a member of this server');
  }

  const result = await pool.query(
    `INSERT INTO server_members (server_id, user_id, role)
     VALUES ($1, $2, 'member')
     RETURNING *`,
    [serverId, userId]
  );

  return result.rows[0] as ServerMember;
}

/**
 * Leave server
 */
export async function leaveServer(serverId: number, userId: number): Promise<void> {
  const pool = getPool();

  // Check if user is owner
  const memberCheck = await pool.query(
    'SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  if (memberCheck.rows[0].role === 'owner') {
    throw new Error('Server owner cannot leave. Transfer ownership or delete the server.');
  }

  await pool.query(
    'DELETE FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );
}

/**
 * Update last viewed channel for a user in a server
 */
export async function updateLastViewedChannel(
  serverId: number,
  userId: number,
  channelId: number
): Promise<void> {
  const pool = getPool();

  // Verify user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  // Verify channel belongs to the server
  const channelCheck = await pool.query(
    'SELECT id FROM channels WHERE id = $1 AND server_id = $2',
    [channelId, serverId]
  );

  if (channelCheck.rows.length === 0) {
    throw new Error('Channel not found in this server');
  }

  // Update last viewed channel
  await pool.query(
    'UPDATE server_members SET last_viewed_channel_id = $1 WHERE server_id = $2 AND user_id = $3',
    [channelId, serverId, userId]
  );
}

/**
 * Get last viewed channel for a user in a server
 */
export async function getLastViewedChannel(
  serverId: number,
  userId: number
): Promise<number | null> {
  const pool = getPool();

  const result = await pool.query(
    'SELECT last_viewed_channel_id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].last_viewed_channel_id;
}


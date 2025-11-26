import { getPool } from '../config/database';
import type {
  Channel,
  ChannelWithDetails,
  CreateChannelRequest,
  UpdateChannelRequest,
} from '@quorum/proto';

/**
 * Create a new channel in a server
 */
export async function createChannel(
  serverId: number,
  userId: number,
  data: CreateChannelRequest
): Promise<Channel> {
  const pool = getPool();

  // Check if user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  const result = await pool.query(
    `INSERT INTO channels (server_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [serverId, data.name, data.description || null]
  );

  return result.rows[0] as Channel;
}

/**
 * Get all channels in a server
 */
export async function getServerChannels(
  serverId: number,
  userId: number
): Promise<ChannelWithDetails[]> {
  const pool = getPool();

  // Check if user is a member of the server
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Not a member of this server');
  }

  const result = await pool.query(
    `SELECT c.*, 
            json_build_object(
              'id', s.id,
              'name', s.name,
              'owner_id', s.owner_id
            ) as server
     FROM channels c
     JOIN servers s ON c.server_id = s.id
     WHERE c.server_id = $1 AND c.archived = FALSE
     ORDER BY c.created_at`,
    [serverId]
  );

  return result.rows as ChannelWithDetails[];
}

/**
 * Get channel by ID
 */
export async function getChannel(channelId: number, userId: number): Promise<ChannelWithDetails> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT c.*,
            json_build_object(
              'id', s.id,
              'name', s.name,
              'owner_id', s.owner_id
            ) as server
     FROM channels c
     JOIN servers s ON c.server_id = s.id
     WHERE c.id = $1`,
    [channelId]
  );

  if (result.rows.length === 0) {
    throw new Error('Channel not found');
  }

  const channel = result.rows[0];

  // Check if user has access to this channel
  const memberCheck = await pool.query(
    'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
    [channel.server_id, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  return channel as ChannelWithDetails;
}

/**
 * Update channel
 */
export async function updateChannel(
  channelId: number,
  userId: number,
  data: UpdateChannelRequest
): Promise<Channel> {
  const pool = getPool();

  // Get channel and check permissions
  const channelResult = await pool.query(
    'SELECT server_id FROM channels WHERE id = $1',
    [channelId]
  );

  if (channelResult.rows.length === 0) {
    throw new Error('Channel not found');
  }

  const serverId = channelResult.rows[0].server_id;

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

  if (data.archived !== undefined) {
    updates.push(`archived = $${paramCount++}`);
    values.push(data.archived);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(channelId);

  const result = await pool.query(
    `UPDATE channels SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] as Channel;
}

/**
 * Delete channel
 */
export async function deleteChannel(channelId: number, userId: number): Promise<void> {
  const pool = getPool();

  // Get channel and check permissions
  const channelResult = await pool.query(
    'SELECT server_id FROM channels WHERE id = $1',
    [channelId]
  );

  if (channelResult.rows.length === 0) {
    throw new Error('Channel not found');
  }

  const serverId = channelResult.rows[0].server_id;

  // Check if user is owner or admin
  const memberCheck = await pool.query(
    `SELECT role FROM server_members 
     WHERE server_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
    [serverId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Insufficient permissions');
  }

  await pool.query('DELETE FROM channels WHERE id = $1', [channelId]);
}

/**
 * Share channel with another server
 */
export async function shareChannel(
  channelId: number,
  targetServerId: number,
  userId: number
): Promise<void> {
  const pool = getPool();

  // Get source channel
  const channelResult = await pool.query(
    'SELECT server_id FROM channels WHERE id = $1',
    [channelId]
  );

  if (channelResult.rows.length === 0) {
    throw new Error('Channel not found');
  }

  const sourceServerId = channelResult.rows[0].server_id;

  // Check if user is owner of source server
  const sourceOwnerCheck = await pool.query(
    `SELECT role FROM server_members 
     WHERE server_id = $1 AND user_id = $2 AND role = 'owner'`,
    [sourceServerId, userId]
  );

  if (sourceOwnerCheck.rows.length === 0) {
    throw new Error('Only the server owner can share channels');
  }

  // Check if target server exists
  const targetServerCheck = await pool.query(
    'SELECT id FROM servers WHERE id = $1',
    [targetServerId]
  );

  if (targetServerCheck.rows.length === 0) {
    throw new Error('Target server not found');
  }

  // Create channel share
  await pool.query(
    `INSERT INTO channel_shares (channel_id, source_server_id, target_server_id, shared_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (channel_id, target_server_id) DO NOTHING`,
    [channelId, sourceServerId, targetServerId, userId]
  );
}


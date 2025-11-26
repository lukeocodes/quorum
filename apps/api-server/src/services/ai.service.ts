import { getPool } from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';
import type {
  AIMember,
  CreateAIMemberRequest,
  UpdateAIMemberRequest,
} from '@quorum/proto';

/**
 * Create a new AI member in a channel
 */
export async function createAIMember(
  channelId: number,
  userId: number,
  data: CreateAIMemberRequest
): Promise<AIMember> {
  const pool = getPool();

  // Check if user has access to channel
  const accessCheck = await pool.query(
    `SELECT c.id FROM channels c
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE c.id = $1 AND sm.user_id = $2`,
    [channelId, userId]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  // Encrypt API key
  const encryptedApiKey = encrypt(data.api_key);

  // Generate random avatar color
  const colors = [
    '#8b5cf6',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#14b8a6',
  ];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const result = await pool.query(
    `INSERT INTO ai_members (channel_id, name, provider, model, api_key_encrypted, persona, system_instructions, avatar_color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, channel_id, name, provider, model, persona, system_instructions, avatar_color, created_at, updated_at`,
    [
      channelId,
      data.name,
      data.provider,
      data.model,
      encryptedApiKey,
      data.persona || null,
      data.system_instructions || null,
      avatarColor,
    ]
  );

  return result.rows[0] as AIMember;
}

/**
 * Get all AI members in a channel
 */
export async function getAIMembers(
  channelId: number,
  userId: number
): Promise<AIMember[]> {
  const pool = getPool();

  // Check if user has access to channel
  const accessCheck = await pool.query(
    `SELECT c.id FROM channels c
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE c.id = $1 AND sm.user_id = $2`,
    [channelId, userId]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  const result = await pool.query(
    `SELECT id, channel_id, name, provider, model, persona, system_instructions, avatar_color, created_at, updated_at
     FROM ai_members
     WHERE channel_id = $1
     ORDER BY created_at`,
    [channelId]
  );

  return result.rows as AIMember[];
}

/**
 * Get AI member by ID
 */
export async function getAIMember(
  aiMemberId: number,
  userId: number
): Promise<AIMember> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT ai.id, ai.channel_id, ai.name, ai.provider, ai.model, ai.persona, ai.system_instructions, ai.avatar_color, ai.created_at, ai.updated_at
     FROM ai_members ai
     JOIN channels c ON ai.channel_id = c.id
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE ai.id = $1 AND sm.user_id = $2`,
    [aiMemberId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('AI member not found or access denied');
  }

  return result.rows[0] as AIMember;
}

/**
 * Update AI member
 */
export async function updateAIMember(
  aiMemberId: number,
  userId: number,
  data: UpdateAIMemberRequest
): Promise<AIMember> {
  const pool = getPool();

  // Check if user has access
  const accessCheck = await pool.query(
    `SELECT ai.id FROM ai_members ai
     JOIN channels c ON ai.channel_id = c.id
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE ai.id = $1 AND sm.user_id = $2`,
    [aiMemberId, userId]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }

  if (data.model !== undefined) {
    updates.push(`model = $${paramCount++}`);
    values.push(data.model);
  }

  if (data.api_key !== undefined) {
    updates.push(`api_key_encrypted = $${paramCount++}`);
    values.push(encrypt(data.api_key));
  }

  if (data.persona !== undefined) {
    updates.push(`persona = $${paramCount++}`);
    values.push(data.persona);
  }

  if (data.system_instructions !== undefined) {
    updates.push(`system_instructions = $${paramCount++}`);
    values.push(data.system_instructions);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(aiMemberId);

  const result = await pool.query(
    `UPDATE ai_members 
     SET ${updates.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, channel_id, name, provider, model, persona, system_instructions, avatar_color, created_at, updated_at`,
    values
  );

  return result.rows[0] as AIMember;
}

/**
 * Delete AI member
 */
export async function deleteAIMember(
  aiMemberId: number,
  userId: number
): Promise<void> {
  const pool = getPool();

  // Check if user has access
  const accessCheck = await pool.query(
    `SELECT ai.id FROM ai_members ai
     JOIN channels c ON ai.channel_id = c.id
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE ai.id = $1 AND sm.user_id = $2`,
    [aiMemberId, userId]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  await pool.query('DELETE FROM ai_members WHERE id = $1', [aiMemberId]);
}

/**
 * Get AI member's decrypted API key (internal use only)
 */
export async function getAIMemberApiKey(aiMemberId: number): Promise<string> {
  const pool = getPool();

  const result = await pool.query(
    'SELECT api_key_encrypted FROM ai_members WHERE id = $1',
    [aiMemberId]
  );

  if (result.rows.length === 0) {
    throw new Error('AI member not found');
  }

  return decrypt(result.rows[0].api_key_encrypted);
}


import { getPool } from '../config/database';
import { extractMentionIds } from '@quorum/utils';
import { sseManager } from './sse.service';
import type {
  MessageWithAuthor,
  SendMessageRequest,
  GetMessagesRequest,
  PaginatedResponse,
  SSEEventType,
} from '@quorum/proto';

/**
 * Send a message to a channel
 */
export async function sendMessage(
  channelId: number,
  userId: number,
  data: SendMessageRequest
): Promise<MessageWithAuthor> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user has access to channel
    const accessCheck = await client.query(
      `SELECT c.id FROM channels c
       JOIN servers s ON c.server_id = s.id
       JOIN server_members sm ON s.id = sm.server_id
       WHERE c.id = $1 AND sm.user_id = $2`,
      [channelId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    // Insert message
    const messageResult = await client.query(
      `INSERT INTO messages (channel_id, member_type, member_id, content, reply_to_message_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [channelId, 'user', userId, data.content, data.reply_to_message_id || null]
    );

    const message = messageResult.rows[0];

    // Extract and store mentions
    const mentions = extractMentionIds(data.content);
    for (const mention of mentions) {
      await client.query(
        `INSERT INTO message_mentions (message_id, mentioned_member_type, mentioned_member_id)
         VALUES ($1, $2, $3)`,
        [message.id, mention.type, mention.id]
      );
    }

    await client.query('COMMIT');

    // Get author info
    const userResult = await pool.query(
      'SELECT id, username, email, display_name, avatar_color, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    const messageWithAuthor = {
      ...message,
      author: userResult.rows[0],
    } as MessageWithAuthor;

    // Broadcast message to all clients in the channel via SSE
    sseManager.broadcastToRoom(channelId, {
      type: 'message' as SSEEventType,
      data: { message: messageWithAuthor },
      timestamp: new Date().toISOString(),
    });

    return messageWithAuthor;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get messages from a channel with pagination
 */
export async function getMessages(
  channelId: number,
  userId: number,
  params: GetMessagesRequest
): Promise<PaginatedResponse<MessageWithAuthor>> {
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

  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  let query = `
    SELECT m.*,
           CASE
             WHEN m.member_type = 'user' THEN
               json_build_object(
                 'id', u.id,
                 'username', u.username,
                 'display_name', u.display_name,
                 'avatar_color', u.avatar_color
               )
             WHEN m.member_type = 'ai' THEN
               json_build_object(
                 'id', ai.id,
                 'name', ai.name,
                 'avatar_color', ai.avatar_color
               )
           END as author
    FROM messages m
    LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
    LEFT JOIN ai_members ai ON m.member_type = 'ai' AND m.member_id = ai.id
    WHERE m.channel_id = $1
  `;

  const queryParams: any[] = [channelId];
  let paramCount = 2;

  if (params.before) {
    query += ` AND m.created_at < $${paramCount++}`;
    queryParams.push(params.before);
  }

  if (params.after) {
    query += ` AND m.created_at > $${paramCount++}`;
    queryParams.push(params.after);
  }

  query += ` ORDER BY m.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM messages WHERE channel_id = $1',
    [channelId]
  );

  const total = parseInt(countResult.rows[0].count);

  return {
    data: result.rows as MessageWithAuthor[],
    pagination: {
      page,
      limit,
      total,
      has_more: offset + result.rows.length < total,
    },
  };
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: number,
  userId: number
): Promise<void> {
  const pool = getPool();

  // Check if user owns the message
  const messageCheck = await pool.query(
    `SELECT member_type, member_id, channel_id FROM messages WHERE id = $1`,
    [messageId]
  );

  if (messageCheck.rows.length === 0) {
    throw new Error('Message not found');
  }

  const message = messageCheck.rows[0];

  // Only allow deletion if user is the author or server admin/owner
  if (message.member_type === 'user' && message.member_id === userId) {
    // User is the author
    await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
    
    // Broadcast deletion event
    sseManager.broadcastToRoom(message.channel_id, {
      type: 'message_deleted' as SSEEventType,
      data: { message_id: messageId, channel_id: message.channel_id },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check if user is admin/owner of the server
  const adminCheck = await pool.query(
    `SELECT sm.role FROM channels c
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE c.id = $1 AND sm.user_id = $2 AND sm.role IN ('owner', 'admin')`,
    [message.channel_id, userId]
  );

  if (adminCheck.rows.length === 0) {
    throw new Error('Insufficient permissions');
  }

  await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

  // Broadcast deletion event
  sseManager.broadcastToRoom(message.channel_id, {
    type: 'message_deleted' as SSEEventType,
    data: { message_id: messageId, channel_id: message.channel_id },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get message context (messages before and after for replies)
 */
export async function getMessageContext(
  messageId: number,
  userId: number,
  contextSize: number = 5
): Promise<{
  message: MessageWithAuthor;
  context: {
    before: MessageWithAuthor[];
    after: MessageWithAuthor[];
  };
}> {
  const pool = getPool();

  // Get the message
  const messageResult = await pool.query(
    `SELECT m.*,
            CASE
              WHEN m.member_type = 'user' THEN
                json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'display_name', u.display_name,
                  'avatar_color', u.avatar_color
                )
              WHEN m.member_type = 'ai' THEN
                json_build_object(
                  'id', ai.id,
                  'name', ai.name,
                  'avatar_color', ai.avatar_color
                )
            END as author
     FROM messages m
     LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
     LEFT JOIN ai_members ai ON m.member_type = 'ai' AND m.member_id = ai.id
     WHERE m.id = $1`,
    [messageId]
  );

  if (messageResult.rows.length === 0) {
    throw new Error('Message not found');
  }

  const message = messageResult.rows[0];

  // Check access
  const accessCheck = await pool.query(
    `SELECT c.id FROM channels c
     JOIN servers s ON c.server_id = s.id
     JOIN server_members sm ON s.id = sm.server_id
     WHERE c.id = $1 AND sm.user_id = $2`,
    [message.channel_id, userId]
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied');
  }

  // Get context before
  const beforeResult = await pool.query(
    `SELECT m.*,
            CASE
              WHEN m.member_type = 'user' THEN
                json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'display_name', u.display_name,
                  'avatar_color', u.avatar_color
                )
              WHEN m.member_type = 'ai' THEN
                json_build_object(
                  'id', ai.id,
                  'name', ai.name,
                  'avatar_color', ai.avatar_color
                )
            END as author
     FROM messages m
     LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
     LEFT JOIN ai_members ai ON m.member_type = 'ai' AND m.member_id = ai.id
     WHERE m.channel_id = $1 AND m.created_at < $2
     ORDER BY m.created_at DESC
     LIMIT $3`,
    [message.channel_id, message.created_at, contextSize]
  );

  // Get context after
  const afterResult = await pool.query(
    `SELECT m.*,
            CASE
              WHEN m.member_type = 'user' THEN
                json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'display_name', u.display_name,
                  'avatar_color', u.avatar_color
                )
              WHEN m.member_type = 'ai' THEN
                json_build_object(
                  'id', ai.id,
                  'name', ai.name,
                  'avatar_color', ai.avatar_color
                )
            END as author
     FROM messages m
     LEFT JOIN users u ON m.member_type = 'user' AND m.member_id = u.id
     LEFT JOIN ai_members ai ON m.member_type = 'ai' AND m.member_id = ai.id
     WHERE m.channel_id = $1 AND m.created_at > $2
     ORDER BY m.created_at ASC
     LIMIT $3`,
    [message.channel_id, message.created_at, contextSize]
  );

  return {
    message: message as MessageWithAuthor,
    context: {
      before: beforeResult.rows.reverse() as MessageWithAuthor[],
      after: afterResult.rows as MessageWithAuthor[],
    },
  };
}


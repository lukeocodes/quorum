import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /discovery/servers
 * List all servers the authenticated user has access to
 * This is used by the web app to show which servers can be added to the desktop app
 */
router.get('/servers', authenticate, async (req: Request, res: Response) => {
    const pool: Pool = req.app.locals.pool;
    const userId = req.user!.id;

    try {
        // Get all servers where the user is a member, including whether they've added them to their clients
        const result = await pool.query(
            `SELECT 
        s.id,
        s.name,
        s.description,
        s.is_public,
        sm.role,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM channels WHERE server_id = s.id AND archived = FALSE) as channel_count,
        (SELECT COUNT(*) FROM server_members WHERE server_id = s.id) as member_count,
        EXISTS(
          SELECT 1 FROM user_added_servers 
          WHERE user_id = $1 AND server_id = s.id
        ) as is_added
       FROM servers s
       INNER JOIN server_members sm ON s.id = sm.server_id
       WHERE sm.user_id = $1
         AND s.archived = FALSE
       ORDER BY s.name ASC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows.map((row) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                isPublic: row.is_public,
                role: row.role,
                channelCount: parseInt(row.channel_count),
                memberCount: parseInt(row.member_count),
                isAdded: row.is_added,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching user servers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch servers',
        });
    }
});

/**
 * POST /discovery/prepare-desktop
 * Prepare connection info for desktop app
 * Returns the current session token and server info for adding to desktop
 */
router.post(
  '/prepare-desktop/:serverId',
  authenticate,
  async (req: Request, res: Response) => {
        const pool: Pool = req.app.locals.pool;
        const userId = req.user!.id;
        const serverId = parseInt(req.params.serverId);

        try {
            // Verify user has access to this server
            const memberResult = await pool.query(
                'SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2',
                [serverId, userId]
            );

            if (memberResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have access to this server',
                });
            }

            // Get server info
            const serverResult = await pool.query(
                'SELECT id, name, description, is_public FROM servers WHERE id = $1 AND archived = FALSE',
                [serverId]
            );

            if (serverResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Server not found',
                });
            }

            const server = serverResult.rows[0];

            // Get user info
            const userResult = await pool.query(
                'SELECT id, username, email, display_name, avatar_color FROM users WHERE id = $1',
                [userId]
            );

            const user = userResult.rows[0];

            // Return the token from the request (it's already validated by authenticateToken)
            const token = req.headers.authorization?.replace('Bearer ', '');

            res.json({
                success: true,
                data: {
                    server: {
                        id: server.id,
                        name: server.name,
                        description: server.description,
                        isPublic: server.is_public,
                        role: memberResult.rows[0].role,
                    },
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        displayName: user.display_name,
                        avatarColor: user.avatar_color,
                    },
                    authToken: token,
                    apiUrl: process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`,
                },
            });
        } catch (error) {
            console.error('Error preparing desktop connection:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to prepare desktop connection',
            });
        }
    }
);

/**
 * POST /discovery/servers/:serverId/add
 * Mark a server as added
 */
router.post(
  '/servers/:serverId/add',
  authenticate,
  async (req: Request, res: Response) => {
    const pool: Pool = req.app.locals.pool;
    const userId = req.user!.id;
    const serverId = parseInt(req.params.serverId);

    try {
      // Verify user is a member of this server
      const memberCheck = await pool.query(
        'SELECT id FROM server_members WHERE server_id = $1 AND user_id = $2',
        [serverId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this server',
        });
      }

      // Add server (or update last_accessed_at if already added)
      await pool.query(
        `INSERT INTO user_added_servers (user_id, server_id, last_accessed_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, server_id)
         DO UPDATE SET last_accessed_at = CURRENT_TIMESTAMP`,
        [userId, serverId]
      );

      res.json({
        success: true,
        data: {
          server_id: serverId,
        },
      });
    } catch (error) {
      console.error('Error adding server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add server',
      });
    }
  }
);

/**
 * POST /discovery/servers/:serverId/remove
 * Remove a server from user's added list
 */
router.post(
  '/servers/:serverId/remove',
  authenticate,
  async (req: Request, res: Response) => {
    const pool: Pool = req.app.locals.pool;
    const userId = req.user!.id;
    const serverId = parseInt(req.params.serverId);

    try {
      // Remove server
      const result = await pool.query(
        `DELETE FROM user_added_servers 
         WHERE user_id = $1 AND server_id = $2`,
        [userId, serverId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Server was not added',
        });
      }

      res.json({
        success: true,
      });
    } catch (error) {
      console.error('Error removing server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove server',
      });
    }
  }
);

/**
 * GET /discovery/servers/added
 * Get all servers the user has added
 */
router.get(
  '/servers/added',
  authenticate,
  async (req: Request, res: Response) => {
    const pool: Pool = req.app.locals.pool;
    const userId = req.user!.id;

    console.log(`📡 GET /discovery/servers/added - User ID: ${userId}`);

    try {
      // Get all servers the user has added
      const result = await pool.query(
        `SELECT 
          s.id,
          s.name,
          s.description,
          s.is_public,
          sm.role,
          s.created_at,
          s.updated_at,
          uas.added_at,
          uas.last_accessed_at,
          (SELECT COUNT(*) FROM channels WHERE server_id = s.id AND archived = FALSE) as channel_count,
          (SELECT COUNT(*) FROM server_members WHERE server_id = s.id) as member_count
         FROM servers s
         INNER JOIN server_members sm ON s.id = sm.server_id
         INNER JOIN user_added_servers uas ON s.id = uas.server_id
         WHERE sm.user_id = $1
           AND uas.user_id = $1
           AND s.archived = FALSE
         ORDER BY uas.last_accessed_at DESC`,
        [userId]
      );

      console.log(`📦 Found ${result.rows.length} added servers for user ${userId}`);
      if (result.rows.length > 0) {
        console.log(`   Servers: ${result.rows.map(r => r.name).join(', ')}`);
      }

      res.json({
        success: true,
        data: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          isPublic: row.is_public,
          role: row.role,
          channelCount: parseInt(row.channel_count),
          memberCount: parseInt(row.member_count),
          addedAt: row.added_at,
          lastAccessedAt: row.last_accessed_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      });
    } catch (error) {
      console.error('❌ Error fetching added servers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch added servers',
      });
    }
  }
);

export default router;


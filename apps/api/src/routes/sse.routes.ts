import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sseManager } from '../services/sse.service';
import crypto from 'crypto';

const router = Router();

/**
 * GET /sse/channels/:channelId
 * Subscribe to channel updates via Server-Sent Events
 */
router.get('/sse/channels/:channelId', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const userId = req.user!.id;

    // TODO: Verify user has access to this channel
    // For now, we'll skip this check

    // Generate unique client ID
    const clientId = crypto.randomBytes(16).toString('hex');

    // Add client to SSE manager
    sseManager.addClient(clientId, res, userId, channelId);

    console.log(`SSE client connected: ${clientId} (user: ${userId}, channel: ${channelId})`);
  } catch (error: any) {
    console.error('SSE connection error:', error);
    res.status(500).json({
      error: 'Failed to establish SSE connection',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /sse/subscribe
 * Subscribe to all user's updates (servers, channels, messages)
 */
router.get('/sse/subscribe', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Generate unique client ID
    const clientId = crypto.randomBytes(16).toString('hex');

    // Add client to SSE manager (no specific room)
    sseManager.addClient(clientId, res, userId);

    console.log(`SSE client connected (global): ${clientId} (user: ${userId})`);
  } catch (error: any) {
    console.error('SSE connection error:', error);
    res.status(500).json({
      error: 'Failed to establish SSE connection',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;


import { Router, Request, Response } from 'express';
import * as serverService from '../services/server.service';
import { authenticate } from '../middleware/auth';
import type {
  CreateServerRequest,
  UpdateServerRequest,
  CreateInviteRequest,
  JoinServerRequest,
} from '@quorum/proto';

const router = Router();

/**
 * GET /servers
 * Get all servers for current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const servers = await serverService.getUserServers(req.user!.id);
    res.json({ data: { servers } });
  } catch (error: any) {
    console.error('Get servers error:', error);
    res.status(500).json({
      error: 'Failed to get servers',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers
 * Create a new server
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const data: CreateServerRequest = req.body;
    const server = await serverService.createServer(req.user!.id, data);
    res.status(201).json({ data: { server } });
  } catch (error: any) {
    console.error('Create server error:', error);
    res.status(400).json({
      error: 'Failed to create server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /servers/public
 * Get all public servers
 */
router.get('/public', async (req: Request, res: Response) => {
  try {
    const servers = await serverService.getPublicServers();
    res.json({ data: { servers } });
  } catch (error: any) {
    console.error('Get public servers error:', error);
    res.status(500).json({
      error: 'Failed to get public servers',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /servers/:id
 * Get server details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const server = await serverService.getServer(serverId, req.user!.id);
    res.json({ data: { server } });
  } catch (error: any) {
    console.error('Get server error:', error);
    res.status(error.message === 'Not a member of this server' ? 403 : 500).json({
      error: 'Failed to get server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * PUT /servers/:id
 * Update server
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const data: UpdateServerRequest = req.body;
    const server = await serverService.updateServer(serverId, req.user!.id, data);
    res.json({ data: { server } });
  } catch (error: any) {
    console.error('Update server error:', error);
    res.status(error.message === 'Insufficient permissions' ? 403 : 400).json({
      error: 'Failed to update server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * DELETE /servers/:id
 * Delete server
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    await serverService.deleteServer(serverId, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Delete server error:', error);
    res.status(error.message.includes('owner') ? 403 : 500).json({
      error: 'Failed to delete server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /servers/:id/members
 * Get server members
 */
router.get('/:id/members', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const members = await serverService.getServerMembers(serverId, req.user!.id);
    res.json({ data: { members } });
  } catch (error: any) {
    console.error('Get server members error:', error);
    res.status(error.message === 'Not a member of this server' ? 403 : 500).json({
      error: 'Failed to get members',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers/:id/invites
 * Create invite code
 */
router.post('/:id/invites', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const data: CreateInviteRequest = req.body;
    const invite = await serverService.createInvite(serverId, req.user!.id, data);
    res.status(201).json({ data: { invite } });
  } catch (error: any) {
    console.error('Create invite error:', error);
    res.status(error.message === 'Insufficient permissions' ? 403 : 400).json({
      error: 'Failed to create invite',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers/join/:code
 * Join server with invite code
 */
router.post('/join/:code', authenticate, async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const result = await serverService.joinServerWithInvite(code, req.user!.id);
    res.json({ data: result });
  } catch (error: any) {
    console.error('Join server error:', error);
    res.status(400).json({
      error: 'Failed to join server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers/public/:id/join
 * Join public server
 */
router.post('/public/:id/join', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const member = await serverService.joinPublicServer(serverId, req.user!.id);
    res.json({ data: { member } });
  } catch (error: any) {
    console.error('Join public server error:', error);
    res.status(400).json({
      error: 'Failed to join server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers/:id/leave
 * Leave server
 */
router.post('/:id/leave', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    await serverService.leaveServer(serverId, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Leave server error:', error);
    res.status(error.message.includes('owner') ? 403 : 400).json({
      error: 'Failed to leave server',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * PUT /servers/:id/last-viewed-channel
 * Update last viewed channel in a server
 */
router.put('/:id/last-viewed-channel', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const { channel_id } = req.body;

    if (!channel_id) {
      res.status(400).json({
        error: 'Missing channel_id',
        message: 'channel_id is required',
      });
      return;
    }

    await serverService.updateLastViewedChannel(serverId, req.user!.id, channel_id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Update last viewed channel error:', error);
    res.status(error.message === 'Not a member of this server' ? 403 : 400).json({
      error: 'Failed to update last viewed channel',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /servers/:id/last-viewed-channel
 * Get last viewed channel in a server
 */
router.get('/:id/last-viewed-channel', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.id);
    const channelId = await serverService.getLastViewedChannel(serverId, req.user!.id);
    res.json({ data: { channel_id: channelId } });
  } catch (error: any) {
    console.error('Get last viewed channel error:', error);
    res.status(500).json({
      error: 'Failed to get last viewed channel',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;


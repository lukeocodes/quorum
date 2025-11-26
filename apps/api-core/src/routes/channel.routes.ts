import { Router, Request, Response } from 'express';
import * as channelService from '../services/channel.service';
import { authenticate } from '../middleware/auth';
import type { CreateChannelRequest, UpdateChannelRequest, ShareChannelRequest } from '@quorum/proto';

const router = Router();

/**
 * GET /servers/:serverId/channels
 * Get all channels in a server
 */
router.get('/servers/:serverId/channels', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const channels = await channelService.getServerChannels(serverId, req.user!.id);
    res.json({ data: { channels } });
  } catch (error: any) {
    console.error('Get channels error:', error);
    res.status(error.message === 'Not a member of this server' ? 403 : 500).json({
      error: 'Failed to get channels',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /servers/:serverId/channels
 * Create a new channel in a server
 */
router.post('/servers/:serverId/channels', authenticate, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const data: CreateChannelRequest = req.body;
    const channel = await channelService.createChannel(serverId, req.user!.id, data);
    res.status(201).json({ data: { channel } });
  } catch (error: any) {
    console.error('Create channel error:', error);
    res.status(error.message === 'Not a member of this server' ? 403 : 400).json({
      error: 'Failed to create channel',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /channels/:id
 * Get channel details
 */
router.get('/channels/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const channel = await channelService.getChannel(channelId, req.user!.id);
    res.json({ data: { channel } });
  } catch (error: any) {
    console.error('Get channel error:', error);
    res.status(error.message === 'Access denied' ? 403 : 404).json({
      error: 'Failed to get channel',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * PUT /channels/:id
 * Update channel
 */
router.put('/channels/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const data: UpdateChannelRequest = req.body;
    const channel = await channelService.updateChannel(channelId, req.user!.id, data);
    res.json({ data: { channel } });
  } catch (error: any) {
    console.error('Update channel error:', error);
    res.status(error.message === 'Insufficient permissions' ? 403 : 400).json({
      error: 'Failed to update channel',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * DELETE /channels/:id
 * Delete channel
 */
router.delete('/channels/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    await channelService.deleteChannel(channelId, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Delete channel error:', error);
    res.status(error.message === 'Insufficient permissions' ? 403 : 500).json({
      error: 'Failed to delete channel',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /channels/:id/share
 * Share channel with another server
 */
router.post('/channels/:id/share', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const data: ShareChannelRequest = req.body;
    await channelService.shareChannel(channelId, data.target_server_id, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Share channel error:', error);
    res.status(error.message.includes('owner') ? 403 : 400).json({
      error: 'Failed to share channel',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;


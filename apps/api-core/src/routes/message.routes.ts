import { Router, Request, Response } from 'express';
import * as messageService from '../services/message.service';
import { authenticate } from '../middleware/auth';
import type { SendMessageRequest, GetMessagesRequest } from '@quorum/proto';

const router = Router();

/**
 * GET /channels/:channelId/messages
 * Get messages from a channel
 */
router.get('/channels/:channelId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const params: GetMessagesRequest = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      before: req.query.before as string,
      after: req.query.after as string,
    };
    const result = await messageService.getMessages(channelId, req.user!.id, params);
    res.json({ data: result });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(error.message === 'Access denied' ? 403 : 500).json({
      error: 'Failed to get messages',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /channels/:channelId/messages
 * Send a message to a channel
 */
router.post('/channels/:channelId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const data: SendMessageRequest = req.body;
    const message = await messageService.sendMessage(channelId, req.user!.id, data);
    res.status(201).json({ data: { message } });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(error.message === 'Access denied' ? 403 : 400).json({
      error: 'Failed to send message',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * DELETE /messages/:id
 * Delete a message
 */
router.delete('/messages/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);
    await messageService.deleteMessage(messageId, req.user!.id);
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(error.message === 'Insufficient permissions' ? 403 : 400).json({
      error: 'Failed to delete message',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /messages/:id/context
 * Get message with context (for replies)
 */
router.get('/messages/:id/context', authenticate, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);
    const contextSize = parseInt(req.query.size as string) || 5;
    const result = await messageService.getMessageContext(messageId, req.user!.id, contextSize);
    res.json({ data: result });
  } catch (error: any) {
    console.error('Get message context error:', error);
    res.status(error.message === 'Access denied' ? 403 : 404).json({
      error: 'Failed to get message context',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;

